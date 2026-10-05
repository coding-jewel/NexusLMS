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

function Notice({ title, text }) {
  return (
    <div className="auth">
      <main className="auth__main" style={{ gridColumn: '1 / -1' }}>
        <div className="auth__card">
          <Logo />
          <h2>{title}</h2>
          <p className="auth__sub">{text}</p>
          <Link to="/" className="btn btn--ghost btn--block">Back to home</Link>
        </div>
      </main>
    </div>
  )
}

export default function Login() {
  const [params] = useSearchParams()
  const { status, tenant, subdomain } = useTenant()
  const { user, loading, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const expired = params.get('expired') === '1'

  if (status === 'none') return <SchoolAddressRequired />
  if (status === 'loading' || loading) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--slate-500)' }}>Loading…</div>
  }
  if (status === 'missing') return <Notice title="We can’t find that school" text={`There is no school at ${subdomain}.nexuslms.com. Check the address and try again.`} />
  if (status === 'error') return <Notice title="Can’t reach the server" text="Please check your connection and try again in a moment." />

  // Signed in (or just signed in): go to their dashboard, or back to the page they were on.
  if (user) return <Navigate to={destination(params.get('next'), user.role)} replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(subdomain, email, password) // on success this page re-renders and redirects
    } catch (err) {
      setError(err.message)
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
        <p>Teachers and students: use the email your school gave you.</p>
      </aside>

      <main className="auth__main">
        <form className="auth__card" onSubmit={handleSubmit}>
          <h2>Sign in</h2>
          <p className="auth__sub">to {tenant.name}</p>

          {expired && (
            <div className="banner" role="status">Your session expired. Sign in again to pick up where you left off.</div>
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