import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import("../views/HomeView.vue"),
    meta: {}
  },
  {
    path: "/login",
    name: "Sign In",
    component: () => import("../views/LoginView.vue"),
    meta: {}
  },
  {
    path: "/register",
    name: "Create Account",
    component: () => import("../views/RegisterView.vue"),
    meta: {}
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: () => import("../views/DashboardView.vue"),
    meta: {}
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
