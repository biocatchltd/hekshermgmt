import Vue from 'vue'
import VueRouter from 'vue-router'
import About from '../components/About.vue'
import Configuration from '../views/ConfigurationsTable.vue'
import Export from "../views/Export";

Vue.use(VueRouter)

const routes = [
  {
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/configuration',
    name: 'Configuration',
    component: Configuration
  },
  {
    path: '/export',
    name: 'Export',
    component: Export
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
