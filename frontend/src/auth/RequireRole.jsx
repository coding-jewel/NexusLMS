import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import NotAllowed from '../pages/NotAllowed'

// Wraps a group of routes. Not signed in -> login (and back here afterwards). Wrong role -> "not allowed".
// This is only about what people see. The server still checks every request.
export default function RequireRole({ role }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--slate-500)' }}>Loading…</div>
  }
  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }
  if (user.role !== role) return <NotAllowed />
  return <Outlet />
}