const BASE = '/api'
const TOKEN_KEY = 'nexuslms.token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

// options.auth = false sends the request without the sign-in token (used for login itself).
async function request(method, path, body, { auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined })
  } catch {
    throw new ApiError(0, 'Can’t reach the server. Please try again.')
  }

  const data = await res.json().catch(() => null)

  // A 401 on a signed-in request means the session ended: clear it and go to the login page,
  // which sends them back to this page afterwards.
  if (res.status === 401 && auth && token) {
    clearToken()
    if (!window.location.pathname.startsWith('/login')) {
      const next = encodeURIComponent(window.location.pathname + window.location.search)
      window.location.assign(`/login?expired=1&next=${next}`)
      return new Promise(() => {}) // the page is about to reload
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, data?.error || 'Something went wrong. Please try again.')
  }
  return data
}

export const api = {
  get: (path, options) => request('GET', path, undefined, options),
  post: (path, body, options) => request('POST', path, body, options),
  delete: (path, options) => request('DELETE', path, undefined, options),
}