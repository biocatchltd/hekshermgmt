<template>
<v-dialog v-model="show" width="50%">
    <v-card>
        <v-card-title>
            <span class="headline">New Rule</span>
        </v-card-title>
        <v-card-text>
            <v-form ref="form" v-model="valid">
                <v-container>
                    <v-row>
                        <v-col v-for="context in setting.configurable_features" :key="context">
                            <v-text-field :label="context" v-model="newRule['context_features'][context]" outlined :rules="[() => /^[a-z0-9]+$/i.test(newRule['context_features'][context]) || 'Alphanumeric only!']" />
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col>
                            <v-text-field required outlined v-model.number="newRule.value" label="Value" type="number" v-if="settingType == 'int'" :rules="integerRules" />
                            <v-text-field required outlined v-model.number="newRule.value" label="Value" type="number" v-else-if="settingType == 'float'" />
                            <v-switch required v-model="newRule.value" label="Value" v-else-if="settingType == 'bool'" />
                            <v-text-field required outlined v-model="newRule.value" label="Value" type="text" v-else-if="settingType == 'str'" />
                            <v-select v-else-if="['Enum', 'Flags'].includes(settingType)" :items="settingOptions" :multiple="'Flags' == settingType" />
                            <v-textarea v-else v-model="newRule.value" label="Complex value type, use JSON for inserting value." auto-grow/>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col>
                            <v-text-field label="Information" v-model="newRule.metadata.information" outlined />
                        </v-col>
                    </v-row>
                </v-container>
            </v-form>
        </v-card-text>
        <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue" text @click.prevent="show=false">
                Cancel
            </v-btn>
            <v-btn color="blue" text @click="saveNewRule">
                Save
            </v-btn>
        </v-card-actions>
    </v-card>
</v-dialog>
</template>

<script>
export default {
    components: {},
    methods: {
        async saveNewRule() {
            this.$refs.form.validate();
            var contextFeatureFound = false;
            for (const value of Object.values(this.newRule.context_features)) {
                if (value !== null) {
                    contextFeatureFound = true;
                    break;
                }
            }
            if (!contextFeatureFound) {
                this.$toast.error("Atleast one context feature must be configured.")
                return;
            }
            if (!this.valid) {
                return;
            }
            if (["Sequence", "Mapping"].includes(this.settingType)) {
                try {
                    this.newRule.value = JSON.parse(this.newRule.value);
                } catch (err) {
                    this.$toast.error("JSON Parse error " + err);
                    return;
                }
            }
            this.$emit('rule-saved');
            console.log(this.newRule);
            this.show = false;
        },
        initializeRuleObject() {
            let rule = {
                metadata: {
                    information: ""
                }

            };
            let contextFeatures = this.setting.configurable_features.reduce(
                function (obj, currentValue) {
                    obj[currentValue] = null;
                    return obj;
                }, {})
            rule["context_features"] = contextFeatures;
            return rule
        }
    },
    computed: {
        settingType() {
            if (['str', 'bool', 'float', 'int'].includes(this.setting.type)) {
                return this.setting.type;
            }
            else if (this.setting.type.startsWith("Enum")) {
                return "Enum";
            }
            else if (this.setting.type.startsWith("Flags")) {
                return "Flags";
            }
            else if (this.setting.type.startsWith("Sequence")) {
                return "Sequence";
            }
            else if (this.setting.type.startsWith("Mapping")) {
                return "Mapping";
            }
            return "error";
        },
        settingOptions() {
            let settingType = this.setting.type
            // Flags and Enums options are parsable using JSON, so we remove the Flags/Enum part and just parse it
            return JSON.parse(settingType.slice(settingType.indexOf("[")));
        },
        show: {
            get() {
                return this.value
            },
            set(value) {
                this.$refs.form.reset();
                this.$emit('input', value);
            }
        }
    },
    props: ['setting', 'value'],
    data() {
        return {
            newRule: this.initializeRuleObject(),
            newRuleDialog: false,
            valid: true,
            integerRules: [
                (v) => {
                    if (isNaN(v) || !Number.isInteger(v)) {
                        return "Integer numbers only!";
                    }
                    return true;
                }
            ],
        }
    }
}
</script>
