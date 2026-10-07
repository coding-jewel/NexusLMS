import { api } from './client'

// Admin only. Optional filters: { role: 'STUDENT' | 'TEACHER', classId }
export const listUsers = ({ role, classId } = {}) => {
  const params = new URLSearchParams()
  if (role) params.set('role', role)
  if (classId) params.set('classId', classId)
  const query = params.toString()
  return api.get(`/users${query ? `?${query}` : ''}`)
}

export const approveUser = (id) => api.post(`/users/${encodeURIComponent(id)}/approve`)

export const declineUser = (id) => api.post(`/users/${encodeURIComponent(id)}/decline`)

export const deleteUser = (id) => api.delete(`/users/${encodeURIComponent(id)}`)

export const getTeacherCode = () => api.get('/admin/teacher-code')

export const regenerateTeacherCode = () => api.post('/admin/teacher-code/regenerate')