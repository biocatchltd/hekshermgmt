import csv
from io import StringIO
from logging import getLogger
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter
from fastapi.params import Query
from pydantic import BaseModel, Field  # pytype: disable=import-error

from hekshermgmt.api.v1.utils import application, httpx_error_to_response
from hekshermgmt.app import HeksherManagement

router = APIRouter(prefix="/settings")

logger = getLogger(__name__)


class Setting(BaseModel):
    name: str = Field(description="The name of the setting")
    configurable_features: List[str] = Field(
        description="A list of the context features the setting can be configured by"
    )
    type: str = Field(description="The type of the setting")
    default_value: Any = Field(description="The default value of the setting")
    description: Optional[str] = Field(
        description="Configuration description (from metadata)"
    )


class Rule(BaseModel):
    value: Any = Field(description="Value set by the rule.")
    context_features: Dict[str, str] = Field(
        description="Context features for matching rule."
    )
    rule_id: int
    added_by: Optional[str] = Field(None, description="Creator of the rule.")
    information: Optional[str] = Field(
        None, description="Information on this rule, what this tries to achieve."
    )
    date: Optional[str] = Field(None, description="Date ruled was created")


@router.get("", response_model=List[Setting])
async def get_settings(app: HeksherManagement = application):
    """
    Get settings list
    """
    logger.debug("Getting settings request.")
    try:
        settings = await app.heksher_client.get_settings()
    except httpx.HTTPStatusError as error:
        logger.warning("Error from Heksher API when fetching settings.", exc_info=error)
        return httpx_error_to_response(error)
    return [
        Setting(
            name=setting["name"],
            configurable_features=setting["configurable_features"],
            type=setting["type"],
            default_value=setting["default_value"],
            description=setting["metadata"].get("description"),
        )
        for setting in settings
    ]


@router.get("/{setting_name}/rules", response_model=List[Rule])
async def get_setting_rules(setting_name: str, app: HeksherManagement = application):
    """
    Get setting's rules
    """
    logger.debug("Get setting's rules", extra={"setting_name": setting_name})
    rules = await app.heksher_client.get_setting_rules(setting_name)

    # Convert dictionary values into JSON for easier view.
    return [
        Rule(
            value=rule["value"],
            context_features=dict(rule["context_features"]),
            rule_id=rule["rule_id"],
            added_by=rule["metadata"].get("added_by"),
            information=rule["metadata"].get("information"),
            date=rule["metadata"].get("date"),
        )
        for rule in rules
    ]


class ExportCSVOutput(BaseModel):
    csv: str = Field(description='The rules of all settings in CSV format')


@router.get("/export/csv")
async def export_to_csv(metadata_field: List[str] = Query(default=['added_by', 'information', 'date']),
                        dialect: str = Query(default='excel'), app: HeksherManagement = application):
    ret = StringIO(newline='')

    # get all context features
    context_features = await app.heksher_client.get_context_features()
    field_names = ['setting', *context_features, 'value', *metadata_field]
    writer = csv.DictWriter(ret, field_names, dialect=dialect, extrasaction='ignore')
    writer.writeheader()

    # get all settings
    all_settings = await app.heksher_client.get_setting_names()

    # get all rules for settings
    all_rules = await app.heksher_client.get_settings_rules(all_settings)
    for setting, ruleset in sorted(all_rules.items()):
        for rule in ruleset:
            row = {'setting': setting, 'value': rule['value'], **rule['metadata'], **dict(rule['context_features'])}
            writer.writerow(row)

    return ExportCSVOutput(csv=ret.getvalue())
