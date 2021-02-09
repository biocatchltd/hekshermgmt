from logging import getLogger
from typing import Any, Dict, List, Optional

import orjson

from fastapi import APIRouter
from pydantic import BaseModel, Field  # pytype: disable=import-error

from hekshermgmt.app import HeksherManagement
from hekshermgmt.api.v1.utils import application

router = APIRouter(prefix="/settings")

logger = getLogger(__name__)


class Setting(BaseModel):
    name: str = Field(description="The name of the setting")
    configurable_features: List[str] = Field(
        description="A list of the context features the setting can be configured" " by"
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
    settings = await app.heksher_client.get_settings()
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
    rules = await app.heksher_client.get_settings_rules(setting_name)

    # Convert dictionary values into JSON for easier view.
    return [
        Rule(
            value=orjson.dumps(rule["value"])
            if isinstance(rule["value"], dict)
            else rule["value"],
            context_features=dict(rule["context_features"]),
            rule_id=rule["rule_id"],
            added_by=rule["metadata"].get("added_by"),
            information=rule["metadata"].get("information"),
            date=rule["metadata"].get("date"),
        )
        for rule in rules
    ]
