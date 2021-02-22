from unittest.mock import AsyncMock, patch

from pytest import fixture
from starlette.testclient import TestClient

from hekshermgmt.main import app


@fixture
def heksher_client_mock():
    return AsyncMock()


@fixture
def app_client(monkeypatch, heksher_client_mock):
    monkeypatch.setenv("HEKSHER_DB_CONNECTION_STRING", "dummy")
    monkeypatch.setenv("HEKSHER_STARTUP_CONTEXT_FEATURES", '["A","B","C"]')

    with patch("hekshermgmt.app.HeksherClient") as heksher_class_mock:
        heksher_class_mock.from_env.return_value = heksher_client_mock
        with TestClient(app) as app_client:
            app_client.headers["X-FORWARDED-EMAIL"] = "eyal@shani.pita"
            yield app_client
