from logging import getLogger

from fastapi import APIRouter
from starlette.responses import JSONResponse

from hekshermgmt.app import HeksherMgmtBackend
from hekshermgmt.util import application

logger = getLogger(__name__)

router = APIRouter(prefix='/backend/v1')


@router.get('/banner', response_class=JSONResponse)
async def get_banner(app: HeksherMgmtBackend = application):
    return {
        'text': app.banner_props.text,
        'color': app.banner_props.color,
        'text_color': app.banner_props.text_color,
    } if app.banner_props else None
