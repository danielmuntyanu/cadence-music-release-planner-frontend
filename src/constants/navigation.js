import { ROLES } from "./roles";

export const links = [
  { title: 'Home', to: '/' },
  { title: 'Dashboard', to: '/dashboard', requiresAuth: true },
  { title: 'Admin', to: '/admin', roles: [ROLES.ADMIN] },
]