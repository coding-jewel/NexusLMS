import { createContext, useContext, useEffect, useState } from 'react'
import { api, clearToken, getToken, setToken } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(getToken())) // true while a saved session is being checked

  // On every page load, ask the server who the saved token belongs to.
  useEffect(() => {
    if (!getToken()) return
    let current = true
    api.get('/auth/me')
      .then((me) => current && setUser(me))
      .catch(() => {}) // a 401 has already cleared the token; any other failure means "not signed in"
      .finally(() => current && setLoading(false))
    return () => { current = false }
  }, [])

  const login = async (subdomain, email, password) => {
    const data = await api.post('/auth/login', { subdomain, email, password }, { auth: false })
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    clearToken()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)