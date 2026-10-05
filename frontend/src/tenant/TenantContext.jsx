import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api/client'
import { getSubdomain } from '../utils/tenant'

const TenantContext = createContext(null)

// Reads the school's address from the browser and looks the school up.
// status: 'none' (main site) | 'loading' | 'ready' | 'missing' | 'error'
export function TenantProvider({ children }) {
  const subdomain = getSubdomain()
  const [state, setState] = useState({ status: subdomain ? 'loading' : 'none' })

  useEffect(() => {
    if (!subdomain) return
    let current = true
    api.get(`/public/tenants/${encodeURIComponent(subdomain)}`, { auth: false })
      .then((tenant) => current && setState({ status: 'ready', tenant }))
      .catch((err) => current && setState({ status: err.status === 404 ? 'missing' : 'error' }))
    return () => { current = false }
  }, [subdomain])

  return <TenantContext.Provider value={{ subdomain, ...state }}>{children}</TenantContext.Provider>
}

export const useTenant = () => useContext(TenantContext)