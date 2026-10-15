import { api } from './client'

export const listAttemptsByQuiz = (quizId) =>
  api.get(`/quiz-attempts/quiz/${encodeURIComponent(quizId)}`)

export const listUngradedAttempts = (quizId) =>
  api.get(`/quiz-attempts/quiz/${encodeURIComponent(quizId)}/ungraded`)

export const getAttempt = (id) => api.get(`/quiz-attempts/${encodeURIComponent(id)}`)

// Body: { additionalScore }
export const gradeAttempt = (id, data) =>
  api.patch(`/quiz-attempts/${encodeURIComponent(id)}/grade`, data)

export const deleteAttempt = (id) => api.delete(`/quiz-attempts/${encodeURIComponent(id)}`)