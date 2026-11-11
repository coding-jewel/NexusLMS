import { api } from './client'

export const clearSchoolData = () => api.post('/admin/clear-data')

export const deleteSchool = () => api.delete('/admin/school')