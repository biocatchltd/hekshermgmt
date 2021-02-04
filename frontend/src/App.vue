<template>
<v-app id="inspire">
    <v-navigation-drawer v-model="drawer" app clipped>
        <v-list dense>
            <v-list-item link to="/configuration">
                <v-list-item-action>
                    <v-icon>mdi-cog</v-icon>
                </v-list-item-action>
                <v-list-item-content>
                    <v-list-item-title>Configuration</v-list-item-title>
                </v-list-item-content>
            </v-list-item>
            <v-list-item link to="/about">
                <v-list-item-action>
                    <v-icon>mdi-information</v-icon>
                </v-list-item-action>
                <v-list-item-content>
                    <v-list-item-title>About</v-list-item-title>
                </v-list-item-content>
            </v-list-item>
        </v-list>
    </v-navigation-drawer>

    <v-app-bar app clipped-left>
        <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
        <v-toolbar-title>Heksher Management</v-toolbar-title>
    </v-app-bar>

    <v-main>
        <v-container>
            <router-view />
        </v-container>
    </v-main>

    <v-footer app>
        <span>Biocatch LTD &copy; {{ new Date().getFullYear() }}</span>
    </v-footer>
</v-app>
</template>

<script>
export default {
    props: {
        source: String,
    },

    data: () => ({
        drawer: null,
    }),

    created() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.$vuetify.theme.dark = true
        }

    },
}
</script>
