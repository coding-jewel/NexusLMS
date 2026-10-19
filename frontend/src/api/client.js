import { getSubdomain } from '../utils/tenant'

const BASE = '/api'
const TOKEN_KEY = 'nexuslms.token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

export class ApiError extends Error {
  constructor(status, message, code) {
    super(message)
    this.status = status
    this.code = code
  }
}

async function request(method, path, body, { auth = true } = {}) {
  const isForm = body instanceof FormData
  const headers = {}
  if (!isForm && body !== undefined) headers['Content-Type'] = 'application/json'
  
  const token = getToken()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  // THIS IS THE CRUCIAL PART: Attach the subdomain to every request
  const subdomain = getSubdomain()
  if (subdomain) headers['X-Tenant-Subdomain'] = subdomain

  let res
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: isForm ? body : (body !== undefined ? JSON.stringify(body) : undefined),
    })
  } catch {
    throw new ApiError(0, 'Can’t reach the server. Please try again.')
  }

  const data = await res.json().catch(() => null)

  if (res.status === 401 && auth && token) {
    clearToken()
    if (!window.location.pathname.startsWith('/login')) {
      const next = encodeURIComponent(window.location.pathname + window.location.search)
      window.location.assign(`/login?expired=1&next=${next}`)
      return new Promise(() => {})
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, data?.error || 'Something went wrong. Please try again.', data?.code)
  }
  return data
}

export const api = {
  get: (path, options) => request('GET', path, undefined, options),
  post: (path, body, options) => request('POST', path, body, options),
  put: (path, body, options) => request('PUT', path, body, options),
  patch: (path, body, options) => request('PATCH', path, body, options),
  delete: (path, options) => request('DELETE', path, undefined, options),
  upload: (path, formData) => request('POST', path, formData),
}