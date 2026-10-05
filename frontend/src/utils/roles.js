export const HOME = { admin: '/admin', teacher: '/teacher', student: '/student' }
export const homeFor = (role) => HOME[role?.toLowerCase()] || '/'