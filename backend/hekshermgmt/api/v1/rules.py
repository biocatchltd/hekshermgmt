import datetime
from logging import getLogger
from typing import Any, Dict, Optional

import httpx

from fastapi import APIRouter
from pydantic import BaseModel, Field, validator
from starlette.responses import Response

from hekshermgmt.app import HeksherManagement
from hekshermgmt.api.v1.utils import application
from hekshermgmt.context_vars import user

router = APIRouter(prefix='/rule')

logger = getLogger(__name__)

class RuleAddOutput(BaseModel):
    rule_id: int = Field(description="ID of the newly created rule.")

class RuleAddInput(BaseModel):
    setting: str = Field(description="the setting name the rule should apply to")
    feature_values: Dict[str, str] = Field(description="the exact-match conditions of the rule")
    value: Any = Field(description="the value of the setting in contexts that match the rule")
    information: Optional[str] = Field(description="information to store with the rule" , max_length=100)

    @validator('feature_values')
    @classmethod
    def feature_values_not_empty(cls, v):
        if not v:
            raise ValueError('feature_values must not be empty')
        return v


@router.delete('/{rule_id}')
async def delete_rule(rule_id: int, app: HeksherManagement = application):
    """
    Deletes a specific rule
    """
    rule = await app.heksher_client.get_rule_data(rule_id)
    logger.info("Deleting rule.", extra={"rule_id": rule_id, "setting_name": rule["setting"], "value": rule["value"]})
    await app.heksher_client.delete_rule(rule_id)

@router.post('', response_model=RuleAddOutput)
async def add_rule(rule: RuleAddInput, app: HeksherManagement = application):
    metadata = {"added_by": user.get(), "information": rule.information, "date": str(datetime.datetime.now())}
    try:
        rule_id = await app.heksher_client.add_rule(rule.setting, rule.feature_values, rule.value, metadata)
    except httpx.HTTPStatusError as exception:
        return Response(exception.response.content, exception.response.status_code)
    logger.info("Added rule.", extra={"rule_id": rule_id, "rule_value": rule.value,
                                "feature_values": rule.feature_values, "setting_name": rule.setting})