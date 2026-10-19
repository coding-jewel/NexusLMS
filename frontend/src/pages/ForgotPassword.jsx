import { useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import { useTenant } from '../tenant/TenantContext'
import { forgotPassword } from '../api/auth'
import '../styles/auth.css'

export default function ForgotPassword() {
  const { subdomain } = useTenant()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await forgotPassword(email.trim())
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <aside className="auth__side">
        <Logo light />
        <div>
          <p className="auth__school">{subdomain}.nexuslms.com</p>
          <h1>Reset your password.</h1>
        </div>
      </aside>

      <main className="auth__main">
        {sent ? (
          <div className="auth__card">
            <h2>Check your email</h2>
            <p className="auth__sub">
              If an account exists for <strong>{email}</strong>, we've sent a link to reset your password. Check your inbox.
            </p>
            <Link to="/login" className="btn btn--primary btn--block">Back to sign in</Link>
          </div>
        ) : (
          <form className="auth__card" onSubmit={handleSubmit}>
            <h2>Forgot password</h2>
            <p className="auth__sub">Enter your email address and we'll send you a link to reset your password.</p>
            
            <label className="field">
              <span>Email</span>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="you@school.edu"
                required 
              />
            </label>
            
            {error && <p className="field__error" role="alert">{error}</p>}
            
            <button className="btn btn--primary btn--block" type="submit" disabled={busy || !email.trim()}>
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
            
            <p className="auth__foot"><Link to="/login">Back to sign in</Link></p>
          </form>
        )}
      </main>
    </div>
  )
}