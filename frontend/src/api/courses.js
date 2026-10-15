import { api } from './client'

export const listCourses = () => api.get('/courses')

export const getCourse = (id) => api.get(`/courses/${encodeURIComponent(id)}`)

export const createCourse = (data) => api.post('/courses', data)

export const publishCourse = (id) => api.patch(`/courses/${encodeURIComponent(id)}/publish`)

export const unpublishCourse = (id) => api.patch(`/courses/${encodeURIComponent(id)}/unpublish`)

export const deleteCourse = (id) => api.delete(`/courses/${encodeURIComponent(id)}`)

export const getCoursePeople = (id) => api.get(`/courses/${encodeURIComponent(id)}/people`)

export const uploadCourseAttachment = (id, file) => {
  const form = new FormData()
  form.append('file', file)
  return api.upload(`/courses/${encodeURIComponent(id)}/attachments`, form)
}

export const removeCourseAttachment = (id, url) =>
  api.delete(`/courses/${encodeURIComponent(id)}/attachments?url=${encodeURIComponent(url)}`)