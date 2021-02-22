import Vue from 'vue';
import Vuetify, {VSnackbar, VBtn, VIcon} from 'vuetify/lib';
import VuetifyToast from 'vuetify-toast-snackbar-ng';

Vue.use(Vuetify, {
    components: {
        VSnackbar,
        VBtn,
        VIcon
    }
});

Vue.use(VuetifyToast, {
    x: 'center',
    dismissable: true,
    queueable: true,
    closeText: 'Close',
    showClose: true,
    timeout: 10000
});

export default new Vuetify({
});
