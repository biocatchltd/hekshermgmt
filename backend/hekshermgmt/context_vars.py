from contextvars import ContextVar

user: ContextVar[str] = ContextVar("user", default=None)
