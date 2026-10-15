import { api } from './client'

// --- topic-level quizzes ---

export const listQuizzesByCourse = (courseId) =>
  api.get(`/quizzes/course/${encodeURIComponent(courseId)}`)

export const listPublishedQuizzesByCourse = (courseId) =>
  api.get(`/quizzes/course/${encodeURIComponent(courseId)}/published`)

// --- class-level tests and exams ---

export const listTestsByClass = (classId) =>
  api.get(`/quizzes/class/${encodeURIComponent(classId)}/tests`)

export const listExamsByClass = (classId) =>
  api.get(`/quizzes/class/${encodeURIComponent(classId)}/exams`)

export const listPublishedTestsByClass = (classId) =>
  api.get(`/quizzes/class/${encodeURIComponent(classId)}/tests/published`)

export const listPublishedExamsByClass = (classId) =>
  api.get(`/quizzes/class/${encodeURIComponent(classId)}/exams/published`)

// --- teacher's combined list (tests + exams) ---

export const listMyTestsAndExams = () => api.get('/quizzes/mine')

// --- shared ---

export const getQuiz = (id) => api.get(`/quizzes/${encodeURIComponent(id)}`)

// Body: { category: 'QUIZ' | 'TEST' | 'EXAM', courseId?, classId?, title, description, timeLimitMinutes }
export const createQuiz = (data) => api.post('/quizzes', data)

// Body: { title, description, timeLimitMinutes, questions }
export const updateQuiz = (id, data) => api.put(`/quizzes/${encodeURIComponent(id)}`, data)

export const publishQuiz = (id) => api.patch(`/quizzes/${encodeURIComponent(id)}/publish`)

// Body: { released: true|false }
export const setQuizReleased = (id, released) =>
  api.patch(`/quizzes/${encodeURIComponent(id)}/release`, { released })

export const deleteQuiz = (id) => api.delete(`/quizzes/${encodeURIComponent(id)}`)

export const uploadQuizAttachment = (id, file) => {
  const form = new FormData()
  form.append('file', file)
  return api.upload(`/quizzes/${encodeURIComponent(id)}/attachments`, form)
}