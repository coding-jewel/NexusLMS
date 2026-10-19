import { createContext, useContext, useEffect, useState } from 'react'
import { api, clearToken, getToken, setToken } from '../api/client'

if (window.location.pathname === '/login' && new URLSearchParams(window.location.search).get('fresh') === '1') {
  clearToken()
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(getToken()))

  const refreshUser = async () => {
    if (!getToken()) return
    try {
      const me = await api.get('/auth/me')
      setUser(me)
    } catch {
      // 401 is handled globally by the api client
    }
  }

  useEffect(() => {
    if (!getToken()) return
    let current = true
    api.get('/auth/me')
      .then((me) => current && setUser(me))
      .catch(() => {})
      .finally(() => current && setLoading(false))
    return () => { current = false }
  }, [])

  const setSession = ({ token, user: who }) => {
    setToken(token)
    setUser(who)
  }

  const login = async (subdomain, email, password) => {
    const data = await api.post('/auth/login', { subdomain, email, password }, { auth: false })
    setSession(data)
    return data.user
  }

  const logout = () => {
    clearToken()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, logout, setSession, refreshUser }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)