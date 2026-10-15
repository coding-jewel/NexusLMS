import { api } from './client'

export const listClasses = () => api.get('/classes')

export const createClass = (data) => api.post('/classes', data)

export const regenerateCode = (id) => api.post(`/classes/${encodeURIComponent(id)}/regenerate-code`)

export const deleteClass = (id) => api.delete(`/classes/${encodeURIComponent(id)}`)

export const assignTeacher = (classId, teacherId) =>
  api.post(`/classes/${encodeURIComponent(classId)}/teachers`, { teacherId })

export const removeTeacher = (classId, teacherId) =>
  api.delete(`/classes/${encodeURIComponent(classId)}/teachers/${encodeURIComponent(teacherId)}`)

export const listClassStudents = (classId) =>
  api.get(`/classes/${encodeURIComponent(classId)}/students`)