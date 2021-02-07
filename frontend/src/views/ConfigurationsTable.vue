<template>
<v-container align="start">
    <v-card>
        <v-card-title>
            <v-text-field v-model="search" append-icon="mdi-magnify" label="Search" single-line hide-details show-expand :expanded.sync="expanded"></v-text-field>
        </v-card-title>
        <v-data-table :expanded.sync="expanded" :headers="headers" :items="configurations" :search="search" item-key="name" show-expand>
            <template v-slot:expanded-item="{ headers, item }">
                <td :colspan="headers.length">
                    <settings-rule :setting="item" />
                </td>
            </template>
        </v-data-table>
    </v-card>
</v-container>
</template>

<script>
import SettingsRule from '../components/SettingRules.vue'
export default {
    components: {
        SettingsRule
    },
    methods: {},
    data() {
        return {
            expanded: [],
            search: "",
            headers: [{
                    text: 'Name',
                    value: 'name'
                },
                {
                    text: 'Data Type',
                    value: 'type'
                },
                {
                    text: 'Default value',
                    value: 'default_value'
                },
                {
                    text: 'Description',
                    value: 'metadata.description'
                },
            ],
            configurations: [{
                    "name": "cake_color",
                    "configurable_features": [
                        "env"
                    ],
                    "type": "Flags[\"blue\",\"green\",\"red\"]",
                    "default_value": null,
                    "metadata": {}
                },
                {
                    "name": "cake_cooking_temp",
                    "configurable_features": [
                        "service"
                    ],
                    "type": "int",
                    "default_value": 30,
                    "metadata": {}
                },
                {
                    "name": "cake_frosting",
                    "configurable_features": [
                        "service",
                        "env",
                        "cid"
                    ],
                    "type": "Sequence<Enum[\"candies\",\"sprinkles\"]>",
                    "default_value": null,
                    "metadata": {}
                },
                {
                    "name": "cake_interest_rate",
                    "configurable_features": [
                        "env"
                    ],
                    "type": "float",
                    "default_value": null,
                    "metadata": {}
                },
                {
                    "name": "cake_name",
                    "configurable_features": [
                        "env"
                    ],
                    "type": "str",
                    "default_value": "benben",
                    "metadata": {}
                },
                {
                    "name": "cake_test_mapping_bool",
                    "configurable_features": [
                        "service"
                    ],
                    "type": "Mapping<bool>",
                    "default_value": null,
                    "metadata": {}
                },
                {
                    "name": "cake_test_mapping_float",
                    "configurable_features": [
                        "service"
                    ],
                    "type": "Mapping<float>",
                    "default_value": null,
                    "metadata": {}
                },
                {
                    "name": "cake_test_mapping_int",
                    "configurable_features": [
                        "service"
                    ],
                    "type": "Mapping<int>",
                    "default_value": null,
                    "metadata": {}
                },
                {
                    "name": "cake_test_mapping_str",
                    "configurable_features": [
                        "service"
                    ],
                    "type": "Mapping<str>",
                    "default_value": null,
                    "metadata": {}
                },
                {
                    "name": "cake_test_sequence_bool",
                    "configurable_features": [
                        "service"
                    ],
                    "type": "Sequence<bool>",
                    "default_value": null,
                    "metadata": {}
                },
                {
                    "name": "cake_test_sequence_float",
                    "configurable_features": [
                        "service"
                    ],
                    "type": "Sequence<float>",
                    "default_value": null,
                    "metadata": {}
                },
                {
                    "name": "cake_test_sequence_int",
                    "configurable_features": [
                        "service"
                    ],
                    "type": "Sequence<int>",
                    "default_value": null,
                    "metadata": {}
                },
                {
                    "name": "cake_test_sequence_str",
                    "configurable_features": [
                        "service"
                    ],
                    "type": "Sequence<str>",
                    "default_value": null,
                    "metadata": {}
                },
                {
                    "name": "cake_type",
                    "configurable_features": [
                        "cid"
                    ],
                    "type": "Enum[0,1,2]",
                    "default_value": 2,
                    "metadata": {}
                },
                {
                    "name": "is_cake_enabled",
                    "configurable_features": [
                        "service",
                        "env",
                        "cid"
                    ],
                    "type": "bool",
                    "default_value": false,
                    "metadata": {}
                }
            ]
        }
    },
}
</script>
