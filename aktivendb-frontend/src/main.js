import Vue from 'vue'
import App from '@/App.vue'
import vuetify from '@/plugins/vuetify'
import router from '@/router'
import axios from '@/backend/vue-axios'
import store from '@/store'
import 'material-design-icons-iconfont/dist/material-design-icons.css'

Vue.config.productionTip = false;

new Vue({
  vuetify,
  router,
  axios,
  store,
  render: h => h(App)
}).$mount('#app');