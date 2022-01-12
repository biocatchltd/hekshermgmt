from fastapi import APIRouter

from hekshermgmt.app import HeksherMgmtBackend
from hekshermgmt.util import user_name, application, convert_responses

router = APIRouter(prefix='/api/v1', dependencies=[user_name])


@router.get('/settings')
async def get_settings(app: HeksherMgmtBackend = application):
    response = await app.heksher_client.get('/api/v1/settings?include_additional_data=true')
    return convert_responses(response)


@router.get('/query')
async def get_query(app: HeksherMgmtBackend = application):
    response = await app.heksher_client.get('/api/v1/query?include_metadata=true')
    return convert_responses(response)


@router.get('/context_features')
async def get_context_features(app: HeksherMgmtBackend = application):
    response = await app.heksher_client.get('/api/v1/context_features')
    return convert_responses(response)
