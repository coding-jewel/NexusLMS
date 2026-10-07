import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import Logo from '../components/Logo'
import PasswordField from '../components/PasswordField'
import SchoolAddressRequired from '../components/SchoolAddressRequired'
import { useTenant } from '../tenant/TenantContext'
import { useAuth } from '../auth/AuthContext'
import { rootUrl } from '../utils/tenant'
import { homeFor } from '../utils/roles'
import '../styles/auth.css'

// Only go back to the page they were on if it belongs to their own area.
function destination(next, role) {
  const home = homeFor(role)
  return next && next.startsWith(home) && !next.startsWith('//') ? next : home
}

export default function Login() {
  const [params] = useSearchParams()
  const { status, tenant, subdomain } = useTenant()
  const { user, loading, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState('')
  const [busy, setBusy] = useState(false)
  const expired = params.get('expired') === '1'
  // Set by the redirect below when we were bounced here from a bad subdomain.
  const addressError = params.get('addressError') || ''

  // A school address that doesn't exist or a server we can't reach should not trap someone
  // on a broken subdomain. Send them back to the main site's login page with a reason.
  useEffect(() => {
    if (status !== 'missing' && status !== 'error') return
    const message = status === 'missing'
      ? `We couldn’t find “${subdomain}”. Check the address and try again.`
      : 'We couldn’t reach the server. Check your connection and try again.'
    window.location.replace(`${rootUrl('/login')}?addressError=${encodeURIComponent(message)}`)
  }, [status, subdomain])

  // No school subdomain: ask which one they belong to. Any bounce message from above rides along.
  if (status === 'none') return <SchoolAddressRequired error={addressError} />

  if (status === 'loading' || loading) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--slate-500)' }}>Loading…</div>
  }

  // The useEffect above is already navigating us away; show a plain "Redirecting…" for the moment.
  if (status === 'missing' || status === 'error') {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--slate-500)' }}>Redirecting…</div>
  }

  // Signed in (or just signed in): go to their dashboard, or back to the page they were on.
  if (user) return <Navigate to={destination(params.get('next'), user.role)} replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setPending('')
    setBusy(true)
    try {
      await login(subdomain, email, password) // on success this page re-renders and redirects
    } catch (err) {
      // The server tells us this is a pending teacher and not a wrong password by sending code = PENDING_APPROVAL.
      if (err.code === 'PENDING_APPROVAL') {
        setPending(err.message)
      } else {
        setError(err.message)
      }
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <aside className="auth__side">
        <Logo light />
        <div>
          <p className="auth__school">{subdomain}.nexuslms.com</p>
          <h1>Welcome to {tenant.name}.</h1>
        </div>
      </aside>

      <main className="auth__main">
        <form className="auth__card" onSubmit={handleSubmit}>
          <h2>Sign in</h2>
          <p className="auth__sub">to {tenant.name}</p>

          {expired && (
            <div className="banner" role="status">Your session expired. Sign in again to pick up where you left off.</div>
          )}

          {pending && (
            <div className="banner" role="status">{pending}</div>
          )}

          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" autoComplete="username" required />
          </label>
          <PasswordField label="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

          {error && <p className="field__error" role="alert">{error}</p>}
          <button className="btn btn--primary btn--block btn--lg" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="auth__foot">New student? <Link to="/join">Join with a class code</Link></p>
        </form>
      </main>
    </div>
  )
}