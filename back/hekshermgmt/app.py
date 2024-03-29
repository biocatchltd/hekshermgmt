import re
from contextvars import ContextVar
from dataclasses import dataclass
from logging import INFO, StreamHandler, getLogger
from typing import Dict, Optional

import sentry_sdk
from aiologstash2 import create_tcp_handler
from contextfilter import ContextVarFilter
from envolved import EnvVar, env_var
from envolved.parsers import CollectionParser
from fastapi import FastAPI
from httpx import AsyncClient

from hekshermgmt._version import __version__

logger = getLogger(__name__)


@dataclass
class LogstashSettings:
    host: str
    port: int
    level: int
    tags: Dict[str, str]


logstash_settings_ev: EnvVar[Optional[LogstashSettings]] = env_var(
    "HEKSHERMGMT_LOGSTASH_", default=None, type=LogstashSettings, args={
        "host": env_var('HOST'),
        "port": env_var('PORT'),
        "level": env_var('LEVEL'),
        "tags": env_var('TAGS', type=CollectionParser.pair_wise_delimited(re.compile(r"\s"), ":", str, str),
                        default={}, ),
    }
)
sentry_dsn_ev = env_var("SENTRY_DSN", default="", type=str)


@dataclass
class HeksherConnectionSettings:
    url: str
    headers: Dict[str, str]


heksher_connection_ev = env_var("HEKSHERMGMT_HEKSHER_", type=HeksherConnectionSettings, args={
    "url": env_var('URL'),
    "headers": env_var('HEADERS', type=CollectionParser.pair_wise_delimited(re.compile(r"\s"), ":", str, str),
                       default={}, ),
})

user_cv: ContextVar[Optional[str]] = ContextVar("user", default=None)
""" Context variable of the user whom initiated the request, used for logging and monitoring """

require_user_ev = env_var("HEKSHERMGMT_REQUIRE_USER", default=False, type=bool)


@dataclass
class BannerProps:
    text: str
    color: str
    text_color: str


banner_props_ev = env_var("HEKSHERMGMT_BANNER_", type=BannerProps, args={
    "text": env_var('TEXT'),
    "color": env_var('COLOR', default='yellow'),
    "text_color": env_var('TEXT_COLOR', default='black'),
}, default=None)


class HeksherMgmtBackend(FastAPI):
    heksher_client: AsyncClient
    require_user: bool
    banner_props: Optional[BannerProps]

    async def startup(self):
        logstash_settings = logstash_settings_ev.get()
        _logger = getLogger("hekshermgmt")
        _logger.setLevel(INFO)
        _logger.addHandler(StreamHandler())
        if logstash_settings is not None:
            handler = await create_tcp_handler(
                logstash_settings.host,
                logstash_settings.port,
                extra={"hekshermgmt_version": __version__, **logstash_settings.tags},
            )
            handler.setLevel(logstash_settings.level)
            handler.addFilter(ContextVarFilter(user=user_cv))
            _logger.addHandler(handler)

        sentry_dsn = sentry_dsn_ev.get()
        if sentry_dsn:
            try:
                sentry_sdk.init(sentry_dsn, release=f"HeksherMgmt@{__version__}")
            except Exception:
                logger.exception("cannot start sentry")

        self.require_user = require_user_ev.get()

        heksher_connection_settings = heksher_connection_ev.get()
        self.heksher_client = AsyncClient(
            base_url=heksher_connection_settings.url,
            headers=heksher_connection_settings.headers,
        )
        (await self.heksher_client.get('/api/health')).raise_for_status()

        self.banner_props = banner_props_ev.get()

    async def shutdown(self):
        await self.heksher_client.aclose()
