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
    methods: {
        async getSettings() {
            try {
                var response = await this.$http.get("/api/v1/settings")
            } catch (error) {
                this.$toast.error(error);
                return;
            }
            this.configurations = response.data;
        }
    },
    async mounted() {
        await this.getSettings();
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
                    value: 'description'
                },
            ],
            configurations: []
        }
    },
}
</script>
