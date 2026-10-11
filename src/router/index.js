import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import HomeView from '../views/HomeView.vue'
import { ROLES } from '@/constants/roles.js'

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView
  },
  {
    path: "/login",
    name: "login",
    component: () => import("../views/LoginView.vue"),
    meta: { guestOnly: true, }
  },
  {
    path: "/register",
    name: "register",
    component: () => import("../views/RegisterView.vue"),
    meta: { guestOnly: true, }
  },
  {
    path: "/dashboard",
    name: "dashboard",
    component: () => import("../views/DashboardView.vue"),
    meta: { requiresAuth: true, }
  },
  {
    path: "/admin",
    name: "admin",
    component: () => import("../views/DashboardView.vue"),
    meta: { roles: [ROLES.ADMIN], }
  },
  {
    path: "/forbidden",
    name: "forbidden",
    component: () => import("../views/ForbiddenView.vue"),
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})


router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.init()

  if (to.meta.guestOnly && auth.isAuthenticated) return { name: "home" }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  const needsAuth = to.matched.some((r) => r.meta.requiresAuth || r.meta.roles)
  if (needsAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  const allowed = to.matched.every((r) => !r.meta.roles || auth.hasAnyRole(r.meta.roles))
  if (!allowed) return { name: 'forbidden' }
 
})


export default router
