import { api } from './client'

export const listClasses = () => api.get('/classes')
export const getClass = (id) => api.get(`/classes/${encodeURIComponent(id)}`)
export const getClassPeople = (id) => api.get(`/classes/${encodeURIComponent(id)}/people`)
export const getClassGradebook = (id) => api.get(`/classes/${encodeURIComponent(id)}/gradebook`)

export const updateGradingSettings = (id, settings) => 
  api.put(`/classes/${encodeURIComponent(id)}/grading`, settings)

export const createClass = (data) => api.post('/classes', data)
export const regenerateCode = (id) => api.post(`/classes/${encodeURIComponent(id)}/regenerate-code`)
export const deleteClass = (id) => api.delete(`/classes/${encodeURIComponent(id)}`)

// FIXED: Removed res.data and added encodeURIComponent to match the rest of the file
export const updateClass = (id, data) => api.put(`/classes/${encodeURIComponent(id)}`, data)

export const assignTeacher = (classId, teacherId) =>
  api.post(`/classes/${encodeURIComponent(classId)}/teachers`, { teacherId })

export const removeTeacher = (classId, teacherId) =>
  api.delete(`/classes/${encodeURIComponent(classId)}/teachers/${encodeURIComponent(teacherId)}`)

export const listClassStudents = (classId) =>
  api.get(`/classes/${encodeURIComponent(classId)}/students`)

export const removeStudentFromClass = (classId, studentId) =>
  api.delete(`/classes/${encodeURIComponent(classId)}/students/${encodeURIComponent(studentId)}`)