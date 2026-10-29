import { ROLES } from "./roles";

export const links = [
  { title: 'Home', to: '/' },
  // { title: 'Dashboard', to: '/dashboard'},
  { title: 'Artists', to: '/artists'},
  { title: 'Releases', to: '/releases'},
  { title: 'Admin', to: '/admin', roles: [ROLES.ADMIN] },
]