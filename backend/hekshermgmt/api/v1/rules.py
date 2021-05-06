import datetime
from logging import getLogger
from typing import Any, Dict, Optional

import httpx
from fastapi import APIRouter
from pydantic import BaseModel, Field, validator  # pytype: disable=import-error

from hekshermgmt.api.v1.utils import application, httpx_error_to_response
from hekshermgmt.app import HeksherManagement
from hekshermgmt.context_vars import user

router = APIRouter(prefix="/rule")

logger = getLogger(__name__)


class RuleAddOutput(BaseModel):
    rule_id: int = Field(description="ID of the newly created rule.")


class RuleAddInput(BaseModel):
    setting: str = Field(description="the setting name the rule should apply to")
    feature_values: Dict[str, str] = Field(
        description="the exact-match conditions of the rule"
    )
    value: Any = Field(
        description="the value of the setting in contexts that match the rule"
    )
    information: Optional[str] = Field(
        description="information to store with the rule", max_length=100
    )

    @validator("feature_values")
    @classmethod
    def feature_values_not_empty(cls, v):
        if not v:
            raise ValueError("feature_values must not be empty")
        return v


@router.delete("/{rule_id}")
async def delete_rule(rule_id: int, app: HeksherManagement = application):
    """
    Deletes a specific rule
    """
    try:
        rule = await app.heksher_client.get_rule_data(rule_id)
    except httpx.HTTPStatusError as error:
        logger.warning("Error from Heksher API when deleting rule.", exc_info=error)
        return httpx_error_to_response(error)
    logger.info(
        "Deleting rule.",
        extra={
            "rule_id": rule_id,
            "setting_name": rule["setting"],
            "value": rule["value"],
        },
    )
    await app.heksher_client.delete_rule(rule_id)


@router.post("", response_model=RuleAddOutput)
async def add_rule(rule: RuleAddInput, app: HeksherManagement = application):
    metadata = {
        "added_by": user.get(),
        "information": rule.information,
        "date": datetime.datetime.now().isoformat(),
    }
    try:
        rule_id = await app.heksher_client.add_rule(
            rule.setting, rule.feature_values, rule.value, metadata
        )
    except httpx.HTTPStatusError as error:
        logger.warning("Error from Heksher API when adding rule.", exc_info=error)
        return httpx_error_to_response(error)
    logger.info(
        "Added rule.",
        extra={
            "rule_id": rule_id,
            "rule_value": rule.value,
            "feature_values": rule.feature_values,
            "setting_name": rule.setting,
        },
    )
    return RuleAddOutput(rule_id=rule_id)


class RuleEditInput(BaseModel):
    value: Any = Field(description="the new value of the rule")


@router.patch("/{rule_id}")
async def edit_rule(rule_id: int, input_: RuleEditInput, app: HeksherManagement = application):
    """Edit a specific rule"""
    try:
        await app.heksher_client.edit_rule(rule_id, input_.value)
    except httpx.HTTPStatusError as error:
        logger.warning("Error from Heksher API when patching rule.", exc_info=error)
        return httpx_error_to_response(error)
