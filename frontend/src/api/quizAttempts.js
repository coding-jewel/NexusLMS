import { api } from './client'

export const startQuizAttempt = (quizId) => 
  api.post('/quiz-attempts/start', { quizId })

export const submitQuizAttempt = (attemptId, answers) => 
  api.post(`/quiz-attempts/${encodeURIComponent(attemptId)}/submit`, { answers })

// NEW: Abandon endpoint using fetch with keepalive for tab close
export const abandonQuizAttempt = (attemptId) => {
  const token = localStorage.getItem('token')
  return fetch(`/api/quiz-attempts/${encodeURIComponent(attemptId)}/abandon`, {
    method: 'POST',
    keepalive: true,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
}

export const getMyAttempt = (quizId) => 
  api.get(`/quiz-attempts/quiz/${encodeURIComponent(quizId)}/mine`)

export const listMyAttempts = () => 
  api.get('/quiz-attempts/mine')

export const listAttemptsByQuiz = (quizId) => 
  api.get(`/quiz-attempts/quiz/${encodeURIComponent(quizId)}`)

export const listUngradedAttempts = (quizId) => 
  api.get(`/quiz-attempts/quiz/${encodeURIComponent(quizId)}/ungraded`)

export const getAttemptById = (id) => 
  api.get(`/quiz-attempts/${encodeURIComponent(id)}`)

export const gradeAttempt = (attemptId, payload) => 
  api.patch(`/quiz-attempts/${encodeURIComponent(attemptId)}/grade`, payload)

export const deleteAttempt = (id) => 
  api.delete(`/quiz-attempts/${encodeURIComponent(id)}`)