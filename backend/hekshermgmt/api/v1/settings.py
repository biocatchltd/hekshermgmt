from logging import getLogger
from typing import Any, List, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from hekshermgmt.app import HeksherManagement
from hekshermgmt.api.v1.utils import application

router = APIRouter(prefix='/settings')

logger = getLogger(__name__)


class Setting(BaseModel):
    name: str = Field(description="The name of the setting")
    configurable_features: List[str] = Field(
        description="A list of the context features the setting can be configured"
                    " by")
    type: str = Field(description="The type of the setting")
    default_value: Any = Field(description="The default value of the setting")
    description: Optional[str] = Field(description="Configuration description (from metadata)")

@router.get('', response_model=List[Setting])
async def get_settings(app: HeksherManagement = application):
    """
    Get settings list
    """
    logger.info("user requested settings.")
    settings = await app.heksher_client.get_settings()
    return [Setting(name=setting['name'],
            configurable_features=setting['configurable_features'],
            type=setting['type'],
            default_value=setting['default_value'],
            description=setting['metadata'].get('description')) for setting in settings]
