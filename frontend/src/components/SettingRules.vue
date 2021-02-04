<template>
  <v-card>
    <v-card-title>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
      ></v-text-field>
    </v-card-title>
    <v-data-table
      :headers="headers"
      :items="rules"
      :search="search"
    ></v-data-table>
  </v-card>
</template>

<script>
export default {
    components: {},
    methods: {},
    computed: {
        headers: function () {
            let headers = this.setting.configurable_features.reduce(
                function(accumulator, currentValue) {
                    accumulator.push({
                        text: currentValue,
                        value: `context_features[${currentValue}]`
                    })
                    return accumulator
                }, [])
            headers.push({
                text: "value",
                value: "value"
            },
            {
                text:"Added by",
                value: "metadata.addedBy"
            },
            {
                text:"Date added",
                value: "metadata.date"
            },
            {
                text:"Information",
                value: "metadata.information"
            },)
            return headers;
        }
    },
    props: ['setting'],
    data() {
        return {
            search: "",
            rules: [{
                "value": "aviramcake",
                "context_features":{
                    "env": "notyourtoy"
                },
                "metadata": {
                    "addedBy": "dudu topaz",
                    "information": "rip",
                    "date": "13/22/2022"
                }
            }]
        }
    }
}
</script>
