from functools import partial
from typing import Optional, Sequence

import heksher
import httpx
from docker import DockerClient
from heksher import ThreadHeksherClient
from heksher.heksher_client import TemporaryClient
from pytest import fixture
from starlette.testclient import TestClient
from yellowbox import SingleContainerService, connect, temp_network
from yellowbox.containers import create_and_pull, get_ports, killing
from yellowbox.extras.postgresql import PostgreSQLService
from yellowbox.retry import RetrySpec

from hekshermgmt.main import app

CONTEXT_FEATURES = ["user", "trust", "theme"]


class HeksherService(SingleContainerService):
    def __init__(
        self,
        docker_client: DockerClient,
        *,
        db_connection_string: str,
        context_features: Sequence[str],
        **kwargs,
    ):
        self.context_features = context_features
        self.db_connection_string = db_connection_string
        super().__init__(
            create_and_pull(
                docker_client,
                "biocatchltd/heksher:0.2.2",
                detach=True,
                publish_all_ports=True,
                environment={
                    "HEKSHER_DB_CONNECTION_STRING": db_connection_string,
                    "HEKSHER_STARTUP_CONTEXT_FEATURES": ";".join(context_features),
                },
            )
        )

    def start(self, retry_spec: Optional[RetrySpec] = None, **kwargs):
        super().start(**kwargs)

        def health_check(client: httpx.Client):
            client.get(
                f"http://localhost:{self.client_port()}/api/health"
            ).raise_for_status()

        with httpx.Client() as client:
            retry_spec = retry_spec or RetrySpec(attempts=10)
            retry_spec.retry(partial(health_check, client), httpx.RequestError)

    def stop(self, **kwargs):
        super().stop(**kwargs)

    def client_port(self):
        return get_ports(self.container)[80]

    def client_url(self):
        return f"http://localhost:{self.client_port()}/"


@fixture(scope="session")
def docker_client():
    # todo improve when yellowbox is upgraded
    try:
        ret = DockerClient.from_env()
        ret.ping()
    except Exception:
        return DockerClient(base_url="tcp://localhost:2375")
    else:
        return ret


@fixture(scope="session")
def sql_service(docker_client):
    service: PostgreSQLService
    with PostgreSQLService.run(docker_client) as service:
        yield service


@fixture(scope="session")
def heksher_service(sql_service, docker_client):
    with temp_network(docker_client) as network, connect(
        network, sql_service
    ) as sql_alias:
        service = HeksherService(
            docker_client,
            db_connection_string=sql_service.container_connection_string(sql_alias[0]),
            context_features=CONTEXT_FEATURES,
        )
        with connect(network, service):
            service.start()
            with killing(service.container):
                yield service


@fixture
def app_client(monkeypatch, heksher_service):
    monkeypatch.setenv("HEKSHERMGMT_HEKSHER_URL", heksher_service.client_url())
    with TestClient(app) as app_client:
        app_client.headers["X-FORWARDED-EMAIL"] = "eyal@shani.pita"
        yield app_client


@fixture
def heksher_client(heksher_service):
    with ThreadHeksherClient(
        heksher_service.client_url(),
        update_interval=2000,
        context_features=CONTEXT_FEATURES,
    ) as client:
        yield client
    heksher.main_client.Main = TemporaryClient()
