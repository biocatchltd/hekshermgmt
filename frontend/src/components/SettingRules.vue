<template>
<v-card>
    <vue-confirm-dialog></vue-confirm-dialog>
    <v-card-title>
        <v-text-field v-model="search" append-icon="mdi-magnify" label="Search" single-line hide-details></v-text-field>
        <v-spacer />
        <v-btn color=green @click.prevent="newRuleDialog=true">
            <v-icon>mdi-plus</v-icon>
        </v-btn>
        <new-rule-dialog v-on:rule-saved="onNewRule" v-model="newRuleDialog" :setting="setting"/>
    </v-card-title>
    <v-card>

    </v-card>
    <v-data-table :headers="headers" :items="rules" :search="search">
        <template v-slot:item.actions="{ item }">
            <v-icon small @click="deleteConfirmDialog(item)">
                mdi-delete
            </v-icon>
        </template>
    </v-data-table>
</v-card>
</template>

<script>
import NewRuleDialog from './NewRuleDialog.vue';

export default {
    components: {NewRuleDialog},
    methods: {
        async deleteConfirmDialog(rule) {
            this.$confirm({
                message: `Are you sure you want to delete ${rule.rule_id}`,
                button: {
                    yes: 'Yes',
                    no: 'Cancel'
                },
                callback: confirm => {
                    if (confirm) {
                        this.deleteRule(rule);
                    }
                }
            })
        },
        async deleteRule(rule) {
            //TODO: add api logic
            let index = this.rules.indexOf(rule);
            this.rules.splice(index, 1);
        },
        closeNewDialog() {
            this.newRuleDialog = false;
        },
        onNewRule(rule) {
            console.log(rule);
            this.rules.push(rule);
        }
    },
    computed: {
        headers: function () {
            let headers = this.setting.configurable_features.reduce(
                function (accumulator, currentValue) {
                    accumulator.push({
                        text: currentValue,
                        value: `context_features[${currentValue}]`
                    })
                    return accumulator
                }, [])
            headers.push({
                text: "value",
                value: "value"
            }, {
                text: "Added by",
                value: "metadata.addedBy"
            }, {
                text: "Date added",
                value: "metadata.date"
            }, {
                text: "Information",
                value: "metadata.information"
            }, {
                text: "Actions",
                value: "actions"
            }, )
            return headers;
        }
    },
    props: ['setting'],
    data() {
        let newRule = {
            information: ""

        };
        let contextFeatures = this.setting.configurable_features.reduce(
                function (obj, currentValue) {
                    obj[currentValue] = null;
                    return obj;
                }, [])
        newRule[contextFeatures] = contextFeatures;
        return {
            newRule: {},
            newRuleDialog: false,
            search: "",
            rules: [{
                "value": "aviramcake",
                "context_features": {
                    "env": "notyourtoy"
                },
                "metadata": {
                    "addedBy": "dudu topaz",
                    "information": "rip",
                    "date": "13/22/2022"
                },
                "rule_id": 1
            }]
        }
    }
}
</script>
