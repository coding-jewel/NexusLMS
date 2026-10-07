import { api } from './client'

// Public: no token needed, the caller is redeeming a code for the first time.
// Step 1 holds the details and emails a code; nothing is created yet.
export const startJoin = (data) => api.post('/public/join', data, { auth: false })

// Step 2 creates the account. Teachers get back { token: null } and wait for admin approval.
export const verifyJoin = (data) => api.post('/public/join/verify', data, { auth: false })

export const resendJoinCode = (email) => api.post('/public/join/resend', { email }, { auth: false })