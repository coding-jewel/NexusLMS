import { api } from './client'

export const listSubmissionsByAssignment = (assignmentId) =>
  api.get(`/submissions/assignment/${encodeURIComponent(assignmentId)}`)

export const listUngradedSubmissions = (assignmentId) =>
  api.get(`/submissions/assignment/${encodeURIComponent(assignmentId)}/ungraded`)

// The signed-in student's own submission. 404 means they haven't submitted yet.
export const getMySubmission = async (assignmentId) => {
  try {
    return await api.get(`/submissions/assignment/${encodeURIComponent(assignmentId)}/mine`)
  } catch (err) {
    if (err.status === 404) return null
    throw err
  }
}

// Delete my own submission so I can hand in again. Only works while it's ungraded.
export const unsubmit = (assignmentId) =>
  api.delete(`/submissions/assignment/${encodeURIComponent(assignmentId)}/mine`)

export const getSubmission = (id) => api.get(`/submissions/${encodeURIComponent(id)}`)

// Body: { assignmentId, text }
export const createSubmission = (data) => api.post('/submissions', data)

export const uploadSubmissionFile = (submissionId, file) => {
  const form = new FormData()
  form.append('file', file)
  return api.upload(`/submissions/${encodeURIComponent(submissionId)}/files`, form)
}

// Body: { grade, feedback }
export const gradeSubmission = (id, data) =>
  api.patch(`/submissions/${encodeURIComponent(id)}/grade`, data)

export const deleteSubmission = (id) => api.delete(`/submissions/${encodeURIComponent(id)}`)