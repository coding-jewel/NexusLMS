import { api } from './client'

export const listSubmissionsByAssignment = (assignmentId) =>
  api.get(`/submissions/assignment/${encodeURIComponent(assignmentId)}`)

export const listUngradedSubmissions = (assignmentId) =>
  api.get(`/submissions/assignment/${encodeURIComponent(assignmentId)}/ungraded`)

export const getSubmission = (id) => api.get(`/submissions/${encodeURIComponent(id)}`)

// Body: { grade, feedback }
export const gradeSubmission = (id, data) =>
  api.patch(`/submissions/${encodeURIComponent(id)}/grade`, data)

export const deleteSubmission = (id) => api.delete(`/submissions/${encodeURIComponent(id)}`)