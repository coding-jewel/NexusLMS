import { api } from './client'

// Everything a teacher's Overview page needs: four counts plus the "waiting to be graded" list.
export const getTeacherStats = () => api.get('/teacher/stats')