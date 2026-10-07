import { api } from './client'

export const getStats = () => api.get('/admin/stats')