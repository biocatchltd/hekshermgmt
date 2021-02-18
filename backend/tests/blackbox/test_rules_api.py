from heksher import Setting, ThreadHeksherClient, TRACK_ALL


from utils import generate_setting_name


def test_rule_add_delete(app_client, heksher_client: ThreadHeksherClient):
    setting_name = generate_setting_name()
    setting_description = "me control cake temp"
    setting_default_value = 5
    setting_features = ["user", "theme"]
    int_setting = Setting(
        setting_name,
        int,
        setting_features,
        setting_default_value,
        metadata={"description": setting_description},
    )
    heksher_client.track_contexts(user=TRACK_ALL, theme=TRACK_ALL)
    heksher_client.reload()

    rules = [{
        'value': 30,
        'feature_values': {'user': 'pita', 'theme': 'sabich'},
        'setting': setting_name,
        'information': 'funfun'
    },
    {
        'value': 1,
        'feature_values': {'user': 'pita', 'theme': 'iraqish'},
        'setting': setting_name,
        'information': 'funfun2'
    }]
    def create_rule(rule) -> int:
        response = app_client.post("/api/v1/rule", json=rule)
        response.raise_for_status()
        return response.json()['rule_id']

    rule_ids = []
    for rule in rules:
        rule_ids.append(create_rule(rule))

    heksher_client.reload()
    assert int_setting.get(user='pita', theme='sabich') == 30
    assert int_setting.get(user='pita') == setting_default_value
    assert int_setting.get(user='pita', theme='iraqish') == 1

    def delete_rule(rule_id):
        response = app_client.delete(f"/api/v1/rule/{rule_id}")
        response.raise_for_status()

    for rule in rule_ids:
        delete_rule()

    heksher_client.reload()

    assert int_setting.get(user='pita', theme='sabich') == setting_default_value
    assert int_setting.get(user='pita') == setting_default_value
    assert int_setting.get(user='pita', theme='iraqish') == setting_default_value


