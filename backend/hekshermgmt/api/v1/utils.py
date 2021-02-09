from fastapi import Depends, Request, Header

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
