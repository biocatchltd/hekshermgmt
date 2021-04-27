<template>
  <v-text-field required outlined v-model.number="x_value" label="Value" type="number"
                v-if="settingInputKind === 'int'"
                :rules="integerRules"/>
  <v-text-field required outlined v-model.number="x_value" label="Value" type="number"
                v-else-if="settingInputKind === 'float'"/>
  <v-switch required v-model="x_value" label="Value" v-else-if="settingInputKind === 'bool'"/>
  <v-text-field required outlined v-model="x_value" label="Value" type="text"
                v-else-if="settingInputKind === 'str'"/>
  <v-select v-else-if="['Enum', 'Flags'].includes(settingInputKind)" v-model="x_value" :items="settingOptions"
            :multiple="settingInputKind === 'Flags'"/>
  <v-textarea v-else v-model="x_value" label="Complex value type, use JSON for inserting value." auto-grow/>
</template>
<script>
export default {
  components: {},
  methods: {},
  computed: {
    settingInputKind() {
      if (['str', 'bool', 'float', 'int'].includes(this.settingType)) {
        return this.settingType;
      } else if (this.settingType.startsWith("Enum")) {
        return "Enum";
      } else if (this.settingType.startsWith("Flags")) {
        return "Flags";
      } else if (this.settingType.startsWith("Sequence")) {
        return "Sequence";
      } else if (this.settingType.startsWith("Mapping")) {
        return "Mapping";
      }
      return "error";
    },
    settingOptions() {
      let settingType = this.settingType
      // Flags and Enums options are parsable using JSON, so we remove the Flags/Enum part and just parse it
      return JSON.parse(settingType.slice(settingType.indexOf("[")));
    },
    x_value: {
      get() {
        return this.rule_value
      },
      set(value){
        console.log(value, typeof(value))
      }
    }
  },
  props: ['settingType', 'rule_value'],
  data() {
    return {
      valid: false,
      integerRules: [
        (v) => {
          console.log("A", v, typeof(v))
          v = Number(v);
          console.log("B", v, typeof(v))
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