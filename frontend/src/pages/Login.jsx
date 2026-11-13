import { useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import Logo from '../components/Logo'
import PasswordField from '../components/PasswordField'
import SchoolAddressRequired from '../components/SchoolAddressRequired'
import { useTenant } from '../tenant/TenantContext'
import { useAuth } from '../auth/AuthContext'
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
  const resetSuccess = params.get('reset') === '1'

  if (status === 'none') return <SchoolAddressRequired />
  if (status === 'loading' || loading) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--slate-500)' }}>Loading…</div>
  }
  if (status === 'missing') return <SchoolAddressRequired error={`We couldn’t find “${subdomain}”. Check the address and try again.`} />
  if (status === 'error') return <SchoolAddressRequired error="We couldn’t reach the server. Check your connection and try again." />

  if (user) return <Navigate to={destination(params.get('next'), user.role)} replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setPending('')
    setBusy(true)
    try {
      await login(subdomain, email, password)
    } catch (err) {
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
          <p className="auth__school">{window.location.host}</p>
          <h1>Welcome to {tenant.name}.</h1>
        </div>
      </aside>

      <main className="auth__main">
        <form className="auth__card" onSubmit={handleSubmit}>
          <h2>Sign in</h2>
          <p className="auth__sub">to {tenant.name}</p>

          {resetSuccess && (
            <div className="banner" role="status">Your password was reset. Sign in with your new password.</div>
          )}

          {expired && !resetSuccess && (
            <div className="banner" role="status">Your session expired. Sign in again to pick up where you left off.</div>
          )}

          {pending && (
            <div className="banner" role="status">{pending}</div>
          )}

          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" autoComplete="username" required />
          </label>
          
          <div>
            <PasswordField 
              label="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
            <div style={{ textAlign: 'right', marginTop: '0.4rem' }}>
              <Link 
                to="/forgot-password" 
                style={{ fontSize: '.85rem', color: 'var(--indigo-600)', fontWeight: 600 }}
              >
                Forgot password?
              </Link>
            </div>
          </div>

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