<template>
<v-card>
    <vue-confirm-dialog></vue-confirm-dialog>
    <v-card-title>
        <v-text-field v-model="search" append-icon="mdi-magnify" label="Search" single-line hide-details></v-text-field>
        <v-spacer />
        <v-btn color=green @click.prevent="newRuleDialog=true">
            <v-icon>mdi-plus</v-icon>
        </v-btn>
        <new-rule-dialog v-on:rule-saved="onRuleChanges" v-model="newRuleDialog" :setting="setting" />
    </v-card-title>
    <v-card>
    </v-card>
    <v-data-table :headers="headers" :items="rules" :search="search">
        <template v-slot:item.actions="{ item }">
          <v-icon small @click.prevent="editRuleDialog=true">
                mdi-pencil
          </v-icon>
          <edit-rule-dialog v-on:rule-saved="onRuleChanges" v-model="editRuleDialog" :setting="setting" :rule="item"/>
          <v-spacer/>
            <v-icon small @click="deleteConfirmDialog(item)">
                mdi-delete
            </v-icon>
        </template>
    </v-data-table>
</v-card>
</template>

<script>
import NewRuleDialog from './NewRuleDialog.vue';
import EditRuleDialog from './EditRuleDialog';

export default {
    components: {
        NewRuleDialog,
        EditRuleDialog
    },
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
                        this.deleteRule(rule).then();
                    }
                }
            })
        },
        async deleteRule(rule) {
            try {
                await this.$http.delete(`/api/v1/rule/${rule.rule_id}`)
            } catch (error) {
                this.$toast.error(error);
                return;
            }
            let index = this.rules.indexOf(rule);
            this.rules.splice(index, 1);
        },
        closeNewDialog() {
            this.newRuleDialog = false;
        },
        async onRuleChanges() {
            await this.getRules();
        },
        async getRules() {
            try {
                var response = await this.$http.get(`/api/v1/settings/${this.setting.name}/rules`)
            } catch (error) {
                this.$toast.error(error);
                return;
            }
            this.rules = response.data;
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
                value: "added_by"
            }, {
                text: "Date added",
                value: "date"
            }, {
            text: "Information",
                value: "information"
            }, {
                text: "Actions",
                value: "actions"
            }, )
            return headers;
        }
    },
    props: ['setting'],
    async mounted() {
        await this.getRules();
    },
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
            editRuleDialog: false,
            search: "",
            rules: []
        }
    }
}
</script>
