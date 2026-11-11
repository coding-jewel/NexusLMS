import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Logo from '../components/Logo'
import PasswordField from '../components/PasswordField'
import { resetPassword } from '../api/auth'
import { useAuth } from '../auth/AuthContext'
import { PASSWORD_REGEX, PASSWORD_HINT } from '../utils/password'
import '../styles/auth.css'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const { logout } = useAuth()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // FIXED: Empty dependency array to prevent infinite render loops
  useEffect(() => {
    logout()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const mismatch = confirm !== '' && confirm !== password
  const strongPw = PASSWORD_REGEX.test(password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await resetPassword(token, password)
      
      // FIXED: Force a hard reload to the login page to clear all React state
      window.location.href = '/login?reset=1'
      
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  if (!token) {
    return (
      <div className="auth">
        <main className="auth__main" style={{ gridColumn: '1 / -1' }}>
          <div className="auth__card">
            <Logo />
            <h2>Invalid Link</h2>
            <p className="auth__sub">This password reset link is missing a token. Please request a new one.</p>
            <Link to="/forgot-password" className="btn btn--primary btn--block">Request new link</Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="auth">
      <main className="auth__main" style={{ gridColumn: '1 / -1' }}>
        <form className="auth__card" onSubmit={handleSubmit}>
          <Logo />
          <h2>Set a new password</h2>
          <p className="auth__sub">Choose a strong password you haven't used before.</p>

          <PasswordField
            label="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={PASSWORD_HINT}
            autoComplete="new-password"
            minLength={8}
            error={password.length > 0 && !strongPw ? PASSWORD_HINT : ''}
          />
          <PasswordField
            label="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Type it again"
            autoComplete="new-password"
            error={mismatch ? 'Passwords don’t match' : ''}
          />

          {error && <p className="field__error" role="alert">{error}</p>}
          <button
            className="btn btn--primary btn--block btn--lg"
            type="submit"
            disabled={busy || !strongPw || password !== confirm}
          >
            {busy ? 'Saving…' : 'Reset password'}
          </button>
        </form>
      </main>
    </div>
  )
}