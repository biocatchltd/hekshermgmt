<template>
<v-dialog v-model="show" width="50%">
    <v-card>
        <v-card-title>
            <span class="headline">New Rule - {{setting.name}}</span>
        </v-card-title>
        <v-card-text>
            <v-form ref="form" v-model="valid">
              <v-container>
                    <v-row>
                        <v-col v-for="context in setting.configurable_features" :key="context">
                            <v-text-field clearable :label="context" v-model="newRule['feature_values'][context]"
                                          outlined :rules="[(v) => /^[a-z_0-9]+$/i.test(v) || 'Alphanumeric only!']" />
                        </v-col>
                        <v-col>
                          <v-container>
                            <v-btn color="primary" dark @click="clearContexts">
                                Clear <br /> Contexts
                                <v-icon dark right>
                                  mdi-close
                                </v-icon>
                            </v-btn>
                          </v-container>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col>
                            <rule-value v-model="newRule.value" :setting-type="setting.type" :initial-value="setting.default_value" />
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col>
                            <v-text-field label="Information" v-model="newRule.information" outlined />
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
import RuleValue from "./RuleValue";

export default {
    components: {
      RuleValue
    },
    methods: {
        async saveNewRule() {
            this.$refs.form.validate();
            var featureValueFound = false;
            for (const value of Object.values(this.newRule.feature_values)) {
                if (value !== null) {
                    featureValueFound = true;
                    break;
                }
            }
            if (!featureValueFound) {
                this.$toast.error("At least one context feature must be configured.")
                return;
            }
            if (!this.valid) {
                return;
            }
            var rule = JSON.parse(JSON.stringify(this.newRule))
            if (this.setting.type.startsWith("Sequence") || this.setting.type.startsWith("Mapping")) {
                try {
                    rule.value = JSON.parse(this.newRule.value);
                } catch (err) {
                    this.$toast.error("JSON Parse error " + err);
                    return;
                }
            }
            const feature_values = rule.feature_values
            for (const propName in feature_values) {
                if (feature_values[propName] === null || feature_values[propName] === undefined) {
                delete feature_values[propName];
                }
            }
            try {
                await this.$http.post("/api/v1/rule", rule);
            } catch (error) {
                this.$toast.error(`${error.response.status} ${error.response.data}`);
                return;
            }
            this.$emit('rule-saved');
            this.show = false;
        },
        clearContexts(){
          this.newRule['feature_values'] = {};
        },
        initializeRuleObject() {
            let rule = {setting: this.setting.name};
            let contextFeatures = this.setting.configurable_features.reduce(
                function (obj, currentValue) {
                    obj[currentValue] = null;
                    return obj;
                }, {})
            rule.feature_values = contextFeatures;
            rule.value = null;
            return rule
        }
    },
    computed: {
        show: {
            get() {
                return this.value
            },
            set(value) {
                //this.$refs.form.reset();
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
            RuleValue: null,
        }
    }
}
</script>
