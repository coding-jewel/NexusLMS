import { api } from './client'

export const listAssignmentsByCourse = (courseId) =>
  api.get(`/assignments/course/${encodeURIComponent(courseId)}`)

export const listMyAssignments = () => api.get('/assignments/mine')

export const getAssignment = (id) => api.get(`/assignments/${encodeURIComponent(id)}`)

export const createAssignment = (data) => api.post('/assignments', data)

export const deleteAssignment = (id) => api.delete(`/assignments/${encodeURIComponent(id)}`)

export const uploadAssignmentAttachment = (id, file) => {
  const form = new FormData()
  form.append('file', file)
  return api.upload(`/assignments/${encodeURIComponent(id)}/attachments`, form)
}