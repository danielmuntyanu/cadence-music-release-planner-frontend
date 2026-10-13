import { toUser } from '@/models/user'
import api from './api'

const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials) 
    return toUser(response.data)
}

const logout = async () => {
    await api.post('/auth/logout')
}

const me = async () => {
    const response = await api.get('/auth/me')
    return toUser(response.data)
}

const register = async (payload) => {
    const response = await api.post('/users', payload)
    return toUser(response.data)
}

export const authService = {
    login, 
    logout, 
    me, 
    register
}