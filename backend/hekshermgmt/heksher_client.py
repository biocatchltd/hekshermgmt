from __future__ import annotations

import re
from logging import getLogger
from typing import Any, Dict, List, Optional

from envolved import EnvVar, Schema
from envolved.parsers import CollectionParser
from httpx import AsyncClient

logger = getLogger(__name__)


class HeksherClientSettingSchema(Schema):
    url: str = EnvVar("URL")
    """ URL Of the Heksher Server """
    headers = EnvVar(
        "HEADERS",
        type=CollectionParser.pair_wise_delimited(re.compile(r"\s"), ":", str, str),
        default={},
    )
    """ Headers to send as part of the HTTP requests """


heksher_settings_env = EnvVar("HEKSHERMGMT_HEKSHER_", type=HeksherClientSettingSchema)


class HeksherClient:
    http_client: AsyncClient

    def __init__(self, host: str, headers: Optional[Dict[str, str]] = None):
        self.http_client = AsyncClient(base_url=host, headers=headers)

    @classmethod
    def from_env(cls) -> "HeksherClient":
        settings = heksher_settings_env.get()
        return HeksherClient(settings.url, settings.headers)

    async def ping(self) -> None:
        """
        Check the health of the Heksher server
        Raises: httpx.HTTPError, if an error occurs
        """
        response = await self.http_client.get("/api/health")
        response.raise_for_status()

    async def get_settings(self) -> List[Dict[str, Any]]:
        """
        Get all settings in the Heksher system
        Returns:
            List of settings.
        Raises:
            Can raise httpx.Error in case of error from server.
        """
        response = await self.http_client.get(
            "/api/v1/settings", params={"include_additional_data": True}
        )
        response.raise_for_status()
        result = response.json()
        return result["settings"]

    async def get_settings_rules(self, setting_name: str) -> List[Dict[str, Any]]:
        """
        Get rules of a specific setting by name
        Args:
            setting_name - Name of setting
        Returns:
            List of rules
        Raises:
            Can raise httpx.Error in case of error from server.
        """
        request_data = {
            "setting_names": [setting_name],
            "context_features_options": "*",
            "include_metadata": True,
        }
        response = await self.http_client.post("/api/v1/rules/query", json=request_data)
        response.raise_for_status()
        result = response.json()
        return result["rules"][setting_name]

    async def add_rule(
        self,
        setting_name: str,
        feature_values: Dict[str, str],
        value: Any,
        metadata: Dict[str, Any],
    ) -> int:
        """
        Adds a new rule to Heksher.
        Args:
            setting_name - Name of setting.
            feature_values - Dictionary of keys and required values for rule to evaluate.
            value - The output value in case of match.
            metadata - Additional data to store.
        Returns:
            Rule ID.
        Raises:
            Can raise httpx.Error in case of error from server.
        """
        request_data = {
            "setting": setting_name,
            "feature_values": feature_values,
            "value": value,
            "metadata": metadata,
        }
        response = await self.http_client.post("/api/v1/rules", json=request_data)
        response.raise_for_status()
        return response.json()["rule_id"]

    async def delete_rule(self, rule_id: int) -> None:
        """
        Deletes a rule from Heksher based on rule_id.
        Args:
            rule_id - Identifier of rule to remove.
        Returns:
            None
        Raises:
            Can raise httpx.Error in case of error from server.
        """
        response = await self.http_client.delete(f"/api/v1/rules/{rule_id}")
        response.raise_for_status()

    async def get_rule_data(self, rule_id: int) -> Dict[str, Any]:
        """
        Gets rule's data
        Args:
            rule_id - Identifier of rule to fetch.
        Returns:
            Rule as dict
        Raises:
            Can raise httpx.Error in case of error from server.
        """
        response = await self.http_client.get(f"/api/v1/rules/{rule_id}")
        response.raise_for_status()

        return response.json()

    async def close(self) -> None:
        """
        Closes the HTTP client. Instance isn't usable afterwards.
        """
        await self.http_client.aclose()
