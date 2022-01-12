from httpx import Response as HttpxResponse
from fastapi import Depends, Header, Request
from starlette.responses import Response as StarletteResponse


from hekshermgmt.app import user_cv

@Depends
def application(request: Request):
    """
    A helper dependancy to get the app instance
    """
    return request.app


header_param = Header(...)
if __debug__:
    header_param = Header('john.johnson@place.job')


@Depends
async def user_name(x_forwarded_email: str = header_param) -> str:
    """
    Extracts email from header and sets it into the context var.
    """
    user_cv.set(x_forwarded_email)
    return x_forwarded_email

def convert_responses(response: HttpxResponse)->StarletteResponse:
    """
    Converts a HttpxResponse to a StarletteResponse
    """
    return StarletteResponse(
        content=response.content,
        status_code=response.status_code,
        headers=response.headers,
    )