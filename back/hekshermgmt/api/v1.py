from datetime import datetime
from logging import getLogger

from fastapi import APIRouter, Request

from hekshermgmt.app import HeksherMgmtBackend, user_cv
from hekshermgmt.util import user_name, application, convert_responses

logger = getLogger(__name__)

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

    log_extras = {'setting': req_json['setting'], 'value': req_json['value'],
                  'metadata': req_json['metadata'],
                  **{'rule_' + k: v for k, v in req_json['feature_values'].items()}}

    if response.is_error:
        logger.error('failed adding rule', extra={**log_extras, 'response_code': response.status_code,
                                                  'response_content': response.content})
    else:
        logger.info('added rule', extra={**log_extras, 'rule_id': response.headers['Location'][1:], })

    return convert_responses(response)


@router.get('/rules/{id}')
async def get_rule(id: int, app: HeksherMgmtBackend = application):
    response = await app.heksher_client.get(f'/api/v1/rules/{id}')
    return convert_responses(response)


@router.put('/rules/{id}/value')
async def edit_rule(request: Request, id: int, app: HeksherMgmtBackend = application):
    # we need the rule info so we can properly log this, and we can't trust the frontend
    response = await app.heksher_client.get(f'/api/v1/rules/{id}')
    if response.is_error:
        return convert_responses(response)
    resp_json = response.json()
    req_json: dict = await request.json()
    log_extras = {'rule_id': str(id), 'setting': resp_json['setting'], 'value': req_json['value'],
                  **{('rule_' + k): v for k, v in resp_json['feature_values']}}

    # note both these routes return a 204 so their response isn't actually that important
    response = await app.heksher_client.put(f'/api/v1/rules/{id}/value', json=(await request.json()))
    if response.is_error:
        logger.error('failed editing rule', extra={**log_extras, 'response_code': response.status_code,
                                                   'response_content': response.content})
        return convert_responses(response)
    response = await app.heksher_client.post(f'/api/v1/rules/{id}/metadata', json={
        'metadata': {
            'added_by': user_cv.get(),
            'date': datetime.now().isoformat(),
        }
    })
    if response.is_error:
        logger.critical('failed editing rule metadata', extra={**log_extras, 'response_code': response.status_code,
                                                               'response_content': response.content})
        return convert_responses(response)
        # todo revert change on error?
    logger.info('edited rule', extra=log_extras)
    return convert_responses(response)


@router.delete('/rules/{id}')
async def delete_rule(id: int, app: HeksherMgmtBackend = application):
    # we need the rule info so we can properly log this, and we can't trust the frontend
    response = await app.heksher_client.get(f'/api/v1/rules/{id}')
    if response.is_error:
        return convert_responses(response)
    resp_json = response.json()
    log_extras = {'rule_id': str(id), 'setting': resp_json['setting'],
                  **{'rule_' + k: v for k, v in resp_json['feature_values']}}

    response = await app.heksher_client.delete(f'/api/v1/rules/{id}')
    if response.is_error:
        logger.critical('failed deleting rule', extra={**log_extras, 'response_code': response.status_code,
                                                       'response_content': response.content})
        return convert_responses(response)
    logger.info('deleted rule', extra=log_extras)
    return convert_responses(response)
