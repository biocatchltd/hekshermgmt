from contextvars import ContextVar

user: ContextVar[str] = ContextVar("user", default=None)
""" Context variable of the user whom initiated the request, used for logging and monitoring """
