from httpx import HTTPStatusError, Response, Request

def test_rule_add_failure(app_client, heksher_client_mock):
    heksher_client_mock.get_settings.side_effect = HTTPStatusError("?", request= Request("get", ".."),
    response=Response(455, content="??"))
    response = app_client.get("/api/v1/settings")
    assert response.status_code == 455
    assert response.content == b"??"