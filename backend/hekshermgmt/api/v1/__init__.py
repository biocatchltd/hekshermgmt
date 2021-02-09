from fastapi import APIRouter
from hekshermgmt.api.v1.utils import get_user_name
from hekshermgmt.api.v1.settings import router as settings
from hekshermgmt.api.v1.rules import router as rules

router = APIRouter(prefix="/api/v1", dependencies=[get_user_name])
router.include_router(settings)
router.include_router(rules)
