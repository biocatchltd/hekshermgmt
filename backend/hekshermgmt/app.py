import sentry_sdk
import re

from logging import getLogger, INFO

from aiologstash import create_tcp_handler
from contextfilter import ContextVarFilter
from envolved import EnvVar, Schema
from envolved.parsers import CollectionParser
from fastapi import FastAPI

from hekshermgmt.heksher_client import HeksherClient
from hekshermgmt.context_vars import user
from hekshermgmt._version import __version__

logger = getLogger(__name__)


class LogstashSettingSchema(Schema):
    # todo remove explicit uppercase names when envolved is upgraded
    host: str = EnvVar("HOST")
    port: int = EnvVar("PORT")
    level: int = EnvVar("LEVEL", default=INFO)
    tags = EnvVar(
        "TAGS",
        type=CollectionParser.pair_wise_delimited(re.compile(r"\s"), ":", str, str),
        default={},
    )


logstash_settings_env = EnvVar(
    "HEKSHERMGMT_LOGSTASH_", default=None, type=LogstashSettingSchema
)
sentry_dsn_env = EnvVar("SENTRY_DSN", default="", type=str)


class HeksherManagement(FastAPI):
    """
    The application class
    """

    heksher_client: HeksherClient

    async def startup(self):
        logstash_settings = logstash_settings_env.get()
        if logstash_settings is not None:
            handler = await create_tcp_handler(
                logstash_settings.host,
                logstash_settings.port,
                extra={"hekshermgmt_version": __version__, **logstash_settings.tags},
            )
            _logger = getLogger("hekshermgmt")
            _logger.addHandler(handler)
            _logger.setLevel(logstash_settings.level)
            _logger.addFilter(ContextVarFilter(user=user))

        sentry_dsn = sentry_dsn_env.get()
        if sentry_dsn:
            try:
                sentry_sdk.init(sentry_dsn, release=f"HeksherMgmt@{__version__}")
            except Exception:
                logger.exception("cannot start sentry")

        self.heksher_client = HeksherClient.from_env()
        await self.heksher_client.ping()

    async def shutdown(self):
        await self.heksher_client.close()

    async def is_healthy(self) -> bool:
        """
        Returns whether service is healthy or not. Depends on Heksher service health.
        """
        try:
            await self.heksher_client.ping()
        except Exception:
            return False
        return True
