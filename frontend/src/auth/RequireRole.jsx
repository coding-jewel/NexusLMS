import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import NotAllowed from '../pages/NotAllowed'

// Wraps a group of routes. Not signed in -> login (and back here afterwards).
// If a `role` is provided, wrong role -> "not allowed". If omitted, any logged-in user can pass.
export default function RequireRole({ role }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--slate-500)' }}>Loading…</div>
  }
  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }
  if (role && user.role !== role) return <NotAllowed />
  return <Outlet />
}