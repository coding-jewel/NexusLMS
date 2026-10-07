import { api } from './client'

// For an admin this returns every course in the school, with the class and teacher names filled in.
export const listCourses = () => api.get('/courses')