import { api } from './client'

export const getCourseGradebook = (courseId) =>
  api.get(`/gradebook/course/${encodeURIComponent(courseId)}`)

export const getClassGradebook = (classId) =>
  api.get(`/gradebook/class/${encodeURIComponent(classId)}`)