from datetime import datetime

from fastapi import APIRouter, Request

from hekshermgmt.app import HeksherMgmtBackend, user_cv
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


@router.post('/rules')
async def add_rule(request: Request, app: HeksherMgmtBackend = application):
    req_json: dict = await request.json()
    req_json.setdefault('metadata', {}).update({
        'added_by': user_cv.get(),
        'date': datetime.now().isoformat(),
    })

    response = await app.heksher_client.post('/api/v1/rules', json=req_json)
    return convert_responses(response)


@router.get('/rules/{id}')
async def get_rule(id: int, app: HeksherMgmtBackend = application):
    response = await app.heksher_client.get(f'/api/v1/rules/{id}')
    return convert_responses(response)


@router.put('/rules/{id}/value')
async def edit_rule(request: Request, id: int, app: HeksherMgmtBackend = application):
    # note both these routes return a 204 so their response isn't actually that important
    # todo change heksher so this can be done in one call?
    response = await app.heksher_client.put(f'/api/v1/rules/{id}/value', json=(await request.json()))
    if response.is_error:
        return convert_responses(response)
    response = await app.heksher_client.post(f'/api/v1/rules/{id}/metadata', json={
        'metadata': {
            'added_by': user_cv.get(),
            'date': datetime.now().isoformat(),
        }
    })
    # todo revert change on error?
    return convert_responses(response)


@router.delete('/rules/{id}')
async def delete_rule(id: int, app: HeksherMgmtBackend = application):
    response = await app.heksher_client.delete(f'/api/v1/rules/{id}')
    return convert_responses(response)
