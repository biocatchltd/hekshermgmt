from typing import Optional

from fastapi import Depends, Header, HTTPException, Request
from httpx import Response as HttpxResponse
from starlette.responses import Response as StarletteResponse

from hekshermgmt.app import HeksherMgmtBackend, user_cv


@Depends
def application(request: Request):
    """
    A helper dependancy to get the app instance
    """
    return request.app


header_param = Header(None)
if __debug__:
    header_param = Header('john.johnson@place.job')


@Depends
async def user_name(x_forwarded_email: Optional[str] = header_param, app: HeksherMgmtBackend = application) -> str:
    """
    Extracts email from header and sets it into the context var.
    """
    if x_forwarded_email is None and app.require_user:
        raise HTTPException(status_code=401, detail='Required Header: x_forwarded_email')
    user_cv.set(x_forwarded_email)
    return x_forwarded_email


def convert_responses(response: HttpxResponse) -> StarletteResponse:
    """
    Converts a HttpxResponse to a StarletteResponse
    """
    return StarletteResponse(
        content=response.content,
        status_code=response.status_code,
        headers=response.headers,  # type: ignore[arg-type]
    )
