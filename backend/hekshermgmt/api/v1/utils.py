import httpx
from fastapi import Depends, Header, Request
from starlette.responses import Response

from hekshermgmt.context_vars import user


@Depends
def application(request: Request):
    """
    A helper dependancy to get the app instance
    """
    return request.app


@Depends
async def get_user_name(x_forwarded_email: str = Header(...)) -> str:
    """
    Extracts email from header and sets it into the context var.
    """
    user.set(x_forwarded_email)
    return x_forwarded_email


def httpx_error_to_response(error: httpx.HTTPStatusError) -> Response:
    return Response(error.response.content, status_code=error.response.status_code)
