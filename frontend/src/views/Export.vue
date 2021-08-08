<template>
<v-container align="start">
  <v-btn color="primary" text @click="exportCSV">
    Export as CSV
  </v-btn>
</v-container>
</template>

<script>
export default {
    methods: {
        async exportCSV() {
            try {
                var response = await this.$http.get("/api/v1/settings/export/csv")
            } catch (error) {
                this.$toast.error(error);
                return;
            }
            var file = new Blob([response.data["csv"]], {type: 'text/csv'})
            const filename = "heksher_settings_"+Date.now() +".csv"
            if (window.navigator.msSaveOrOpenBlob) // IE10+
                window.navigator.msSaveOrOpenBlob(file, filename);
            else { // Others
                var a = document.createElement("a"),
                        url = URL.createObjectURL(file);
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                setTimeout(function() {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }, 0);
            }
        }
    }
}
</script>
