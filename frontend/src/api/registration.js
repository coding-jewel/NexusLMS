import { api } from './client'

export const checkSubdomain = (subdomain) =>
  api.get(`/public/subdomains/${encodeURIComponent(subdomain)}/available`)

export const startRegistration = (data) => api.post('/public/registrations', data)

export const verifyRegistration = (data) => api.post('/public/registrations/verify', data)

export const resendCode = (subdomain) => api.post('/public/registrations/resend', { subdomain })