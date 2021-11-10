<template>
  <v-dialog v-model="show" width="50%" @focusin.prevent :retain-focus="false">
    <v-card>
      <v-card-title>
        <span class="headline">Edit Setting - {{ setting_.name }}, Rule - {{ rule_.rule_id }}</span>
      </v-card-title>
      <v-card-text>
        <v-form ref="form" v-model="valid">
          <v-container class="d-flex flex-column">
            <v-container class="d-flex">
              <v-text-field
                  outlined readonly :label="context" v-for="context in setting_.configurable_features" :key="context"
                  :value="changedRule['context_features'][context] || ' '" class="ml-1 mr-1"
              />
            </v-container>
            <rule-value v-model="changedRule.value" :setting-type="setting_.type"
                        :initial-value="rule_.value" :default-value="setting_.default_value" ref="rule_value"/>
            <v-text-field readonly label="Information" :value="changedRule.information || ' '" outlined/>
          </v-container>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue" text @click.prevent="closeDialog()" @focusin.stop>
          Cancel
        </v-btn>
        <v-btn color="blue" text @click="saveRule">
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
    async closeDialog() {
      this.show = false;
      this.$refs.rule_value.resetValue()
    },
    async saveRule() {
      this.$refs.form.validate();
      if (!this.valid) {
        return;
      }
      var new_value = this.changedRule.value
      if (this.setting_.type.startsWith("Sequence") || this.setting_.type.startsWith("Mapping")) {
        try {
          new_value = JSON.parse(this.changedRule.value);
        } catch (err) {
          this.$toast.error("JSON Parse error " + err);
          return;
        }
      }
      try {
        await this.$http.patch(`/api/v1/rule/${this.rule_.rule_id}`, {
          'value': new_value
        });
      } catch (error) {
        this.$toast.error(`${error.response.status} ${error.response.data}`);
        return;
      }
      this.$emit('rule-saved');
      this.show = false;
    },
    initializeRuleObject() {
      return JSON.parse(JSON.stringify(this.rule_));
    },
    selectRule(setting, rule) {
      this.setting_ = setting
      this.rule_ = rule
      this.changedRule = JSON.parse(JSON.stringify(rule));
      this.valid = true
      this.newRuleDialog = false
    }
  },
  computed: {
    show: {
      get() {
        return this.value
      },
      set(value) {
        this.$emit('input', value);
      }
    }
  },
  props: ['setting', 'rule', 'value'],
  data() {
    return {
      setting_: this.setting,
      rule_: this.rule,
      changedRule: this.initializeRuleObject(),
      newRuleDialog: false,
      valid: true,
    }
  }
}
</script>
