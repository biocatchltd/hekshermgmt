import axios from 'axios'
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify';
import VueConfirmDialog from 'vue-confirm-dialog'
import VueColumnsResizableVuetify from 'vue-columns-resizable-vuetify';


Vue.prototype.$http = axios
Vue.prototype.$http.defaults.validateStatus = (status) => {
  return (status >= 200) && (status < 300)
};
if (process.env.NODE_ENV == 'development') {
  Vue.prototype.$http.defaults.baseURL = 'http://localhost:8000';
  // The backend API requires X-Forwarded-Email header for all APIs
  Vue.prototype.$http.defaults.headers.common['X-Forwarded-Email'] = 'shlomo@doron.com';
}
Vue.config.productionTip = false

Vue.use(VueConfirmDialog);
Vue.use(VueColumnsResizableVuetify);

new Vue({
  vuetify,
  router,
  render: h => h(App)
}).$mount('#app')

Vue.component('vue-confirm-dialog', VueConfirmDialog.default)