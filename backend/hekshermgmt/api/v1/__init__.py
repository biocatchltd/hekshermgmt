from fastapi import APIRouter
from hekshermgmt.api.v1.utils import get_user_name
from hekshermgmt.api.v1.settings import router as settings

router = APIRouter(prefix='/api/v1', dependencies=[get_user_name])
router.include_router(settings)