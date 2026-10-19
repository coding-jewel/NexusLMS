import { api } from './client'

export const listQuizzesByCourse = (courseId) =>
  api.get(`/quizzes/course/${encodeURIComponent(courseId)}`)

export const listPublishedQuizzesByCourse = (courseId) =>
  api.get(`/quizzes/course/${encodeURIComponent(courseId)}/published`)

export const listTestsByClass = (classId) =>
  api.get(`/quizzes/class/${encodeURIComponent(classId)}/tests`)

export const listExamsByClass = (classId) =>
  api.get(`/quizzes/class/${encodeURIComponent(classId)}/exams`)

export const listPublishedTestsByClass = (classId) =>
  api.get(`/quizzes/class/${encodeURIComponent(classId)}/tests/published`)

export const listPublishedExamsByClass = (classId) =>
  api.get(`/quizzes/class/${encodeURIComponent(classId)}/exams/published`)

export const listMyTestsAndExams = () => api.get('/quizzes/mine')

export const getQuiz = (id) => api.get(`/quizzes/${encodeURIComponent(id)}`)

// Student-safe view — questions with no correctAnswer.
export const getQuizForTake = (id) => api.get(`/quizzes/${encodeURIComponent(id)}/take`)

// Body: { category, courseId?, classId?, title, description, timeLimitMinutes, guardMode, guardLimit }
export const createQuiz = (data) => api.post('/quizzes', data)

// Body: { title, description, timeLimitMinutes, questions, guardMode, guardLimit }
export const updateQuiz = (id, data) => api.put(`/quizzes/${encodeURIComponent(id)}`, data)

export const publishQuiz = (id) => api.patch(`/quizzes/${encodeURIComponent(id)}/publish`)

export const setQuizReleased = (id, released) =>
  api.patch(`/quizzes/${encodeURIComponent(id)}/release`, { released })

export const deleteQuiz = (id) => api.delete(`/quizzes/${encodeURIComponent(id)}`)

export const uploadQuizAttachment = (id, file) => {
  const form = new FormData()
  form.append('file', file)
  return api.upload(`/quizzes/${encodeURIComponent(id)}/attachments`, form)
}