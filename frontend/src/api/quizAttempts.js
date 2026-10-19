import { api } from './client'

export const listAttemptsByQuiz = (quizId) =>
  api.get(`/quiz-attempts/quiz/${encodeURIComponent(quizId)}`)

export const listUngradedAttempts = (quizId) =>
  api.get(`/quiz-attempts/quiz/${encodeURIComponent(quizId)}/ungraded`)

// The signed-in student's own attempt. 404 means they haven't attempted.
export const getMyAttempt = async (quizId) => {
  try {
    return await api.get(`/quiz-attempts/quiz/${encodeURIComponent(quizId)}/mine`)
  } catch (err) {
    if (err.status === 404) return null
    throw err
  }
}

export const getAttempt = (id) => api.get(`/quiz-attempts/${encodeURIComponent(id)}`)

// Body: { quizId, answers, leftPage }
export const submitAttempt = (data) => api.post('/quiz-attempts', data)

// Body: { additionalScore }
export const gradeAttempt = (id, data) =>
  api.patch(`/quiz-attempts/${encodeURIComponent(id)}/grade`, data)

export const deleteAttempt = (id) => api.delete(`/quiz-attempts/${encodeURIComponent(id)}`)