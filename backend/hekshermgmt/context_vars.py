from contextvars import ContextVar
from typing import Optional

user: ContextVar[Optional[str]] = ContextVar("user", default=None)
""" Context variable of the user whom initiated the request, used for logging and monitoring """
