<template>
<v-container align="start">
    <v-card>
        <v-card-title>
            <v-text-field v-model="search" append-icon="mdi-magnify" label="Search" single-line hide-details show-expand :expanded.sync="expanded"></v-text-field>
        </v-card-title>
        <v-data-table :expanded.sync="expanded" :headers="headers" :items="configurations" :search="search" item-key="name" show-expand>
            <template v-slot:expanded-item="{ headers, item }">
                <td :colspan="headers.length">
                    <settings-rule :setting="item"/>
                </td>
            </template>
        </v-data-table>
    </v-card>
</v-container>
</template>

<script>
import SettingsRule from '../components/SettingRules.vue'
export default {
    components: {SettingsRule},
    methods: {
    },
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
                    name: "cake_cooking_temp",
                    configurable_features: [
                        "service"
                    ],
                    type: "int",
                    default_value: 30,
                    metadata: {}
                },
                {
                    name: "cake_frosting",
                    configurable_features: [
                        "service",
                        "env",
                        "cid"
                    ],
                    type: "Sequence<Enum[\"candies\",\"sprinkles\"]>",
                    default_value: null,
                    metadata: {'description': "What kind of frostings you'd like"}
                },
                {
                    name: "cake_name",
                    configurable_features: [
                        "env"
                    ],
                    type: "str",
                    default_value: "nice_cake",
                    metadata: {}
                },
                {
                    name: "cake_type",
                    configurable_features: [
                        "cid"
                    ],
                    type: "Enum[0,1,2]",
                    default_value: 2,
                    metadata: {}
                },
                {
                    name: "is_cake_enabled",
                    configurable_features: [
                        "service",
                        "env",
                        "cid"
                    ],
                    type: "bool",
                    default_value: false,
                    metadata: {}
                }
            ]
        }
    },
}
</script>
