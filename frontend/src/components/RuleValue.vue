<template>
  <v-container class="d-flex">
    <v-text-field required outlined clearable v-model.number="value" label="Value" type="number"
                  v-if="settingInputKind === 'int'" :rules="integerRules"/>
    <v-text-field required outlined clearable v-model.number="value" label="Value" type="number"
                  v-else-if="settingInputKind === 'float'"/>
    <v-switch required v-model="value" label="Value" v-else-if="settingInputKind === 'bool'"/>
    <v-text-field required outlined clearable v-model="value" label="Value" type="text"
                  v-else-if="settingInputKind === 'str'"/>
    <v-select v-else-if="['Enum', 'Flags'].includes(settingInputKind)" v-model="value" :items="settingOptions"
              :multiple="settingInputKind === 'Flags'" :clearable="settingInputKind === 'Flags'"/>
    <v-textarea required outlined clearable auto-grow v-else v-model="value"
                label="Complex value type, use JSON for inserting value."/>
    <div class="d-flex flex-column ml-2 align-content-center">
      <v-tooltip right>
        <template v-slot:activator="{ on, attrs }">
          <v-icon @click="resetValue" v-bind="attrs" v-on="on">mdi-undo</v-icon>
        </template>
        <span>original rule value</span>
      </v-tooltip>
      <v-tooltip right v-if="defaultValue != null">
        <template v-slot:activator="{ on, attrs }">
          <v-icon @click="clearValue" v-bind="attrs" v-on="on">mdi-refresh</v-icon>
        </template>
        <span>setting's default value</span>
      </v-tooltip>
    </div>
  </v-container>
</template>
<script>
export default {
  components: {},
  methods: {
    resetValue() {
      let initialValue = this.initialValue;
      if (this.settingType.startsWith("Sequence") || this.settingType.startsWith("Mapping")) {
        initialValue = JSON.stringify(initialValue)
      }
      this.value = initialValue;
    },
    clearValue() {
      let initialValue = this.defaultValue;
      if (this.settingType.startsWith("Sequence") || this.settingType.startsWith("Mapping")) {
        initialValue = JSON.stringify(initialValue)
      }
      this.value = initialValue;
    }
  },
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
    value: {
      get() {
        return this.innerValue;
      },
      set(value) {
        this.$emit('input', value);
        this.innerValue = value;
      }
    }
  },
  props: ['settingType', 'initialValue', 'defaultValue'],
  data() {
    let initialValue = this.initialValue;
    if (this.settingType.startsWith("Sequence") || this.settingType.startsWith("Mapping")) {
      initialValue = JSON.stringify(initialValue)
    }
    return {
      valid: false,
      innerValue: initialValue,
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