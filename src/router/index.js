import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
    { path: '/', name: 'projects', component: () => import('../components/ProjectsView.vue') },
    { path: '/projects/new', name: 'project-new', component: () => import('../components/ProjectFormView.vue') },
    { path: '/projects/:id', name: 'project-detail', component: () => import('../views/ProjectDetailView.vue') },
    { path: '/clients', name: 'clients', component: () => import('../components/ClientsView.vue') },
    { path: '/calendar', name: 'calendar', component: () => import('../components/CalendarView.vue') },
    { path: '/settings', name: 'settings', component: () => import('../components/SettingsView.vue') }
  ]
})

router.beforeEach(async (to) => {
  const { data } = await supabase.auth.getSession()
  if (!data.session && to.name !== 'login') return { name: 'login' }
  if (data.session && to.name === 'login') return { name: 'projects' }
})

export default router
