import { api } from './client'

export const listClasses = () => api.get('/classes')

export const createClass = (data) => api.post('/classes', data)

export const regenerateCode = (id) => api.post(`/classes/${encodeURIComponent(id)}/regenerate-code`)

export const deleteClass = (id) => api.delete(`/classes/${encodeURIComponent(id)}`)