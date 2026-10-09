import http from './http'

export const login = (credentials) => http.post('/auth/login', credentials)
export const logout = () => http.post('/auth/logout')
export const me = () => http.get('/auth/me')
export const register = (payload) => http.post('/auth/register', payload)
