import { api } from './client'

export const joinClass = (code) => api.post('/student/join', { code })

export const getMyTodo = () => api.get('/student/todo')

export const listMyClasses = () => api.get('/student/classes')

export const listMyTopics = () => api.get('/student/topics')

export const listMyAssessments = () => api.get('/student/assessments')

export const getMyGrades = () => api.get('/student/grades')