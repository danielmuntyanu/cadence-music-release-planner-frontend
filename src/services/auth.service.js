import api from './api'

const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials) 
    return response.data
}

const logout = async () => {
    await api.post('/auth/logout')
}

const me = async () => {
    const response = await api.get('/auth/me')
    return response.data
}

const register = async (userData) => {
    const response = await api.post('/users', userData)
    return response.data
}

export const authService = {
    login, 
    logout, 
    me, 
    register
}