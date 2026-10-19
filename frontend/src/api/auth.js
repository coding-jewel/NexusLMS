import { api } from './client'

export const forgotPassword = (email) => api.post('/auth/forgot-password', { email }, { auth: false })

export const resetPassword = (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }, { auth: false })