import { api } from './client'

export const getGradingWeights = () => api.get('/grading/weights')

export const saveGradingWeights = (weights) => api.put('/grading/weights', weights)