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
                            <v-text-field label="Information" v-model="newRule.information" outlined/>
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
            this.$emit('rule-saved', this.newRule);
            this.show = false;
        },
        initializeRuleObject() {
            let rule = {
                information: ""

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
        show: {
            get() {
                return this.value
            },
            set(value) {
                this.newRule = this.initializeRuleObject();
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
            valid: true
        }
    }
}
</script>
