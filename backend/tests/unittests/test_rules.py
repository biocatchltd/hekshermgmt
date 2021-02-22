def test_rule_add_failure(app_client):
    response = app_client.post(
        "/api/v1/rule",
        json={
            "value": 1,
            "feature_values": {},
            "setting": "dummy",
            "information": "funfun2",
        },
    )
    assert response.status_code == 422
