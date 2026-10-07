import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Logo from '../components/Logo'
import PasswordField from '../components/PasswordField'
import { useTenant } from '../tenant/TenantContext'
import { useAuth } from '../auth/AuthContext'
import { startJoin, verifyJoin, resendJoinCode } from '../api/join'
import { homeFor } from '../utils/roles'
import '../styles/auth.css'

// Reached from an invite link like /join?code=GLD-4K7Q or /join?code=STAFF-ABC123.
// Step 1: fill in the form and get a code by email.
// Step 2: enter the code. Students are signed in straight away; teachers wait for admin approval.
export default function Join() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { tenant, subdomain } = useTenant()
  const { setSession, logout } = useAuth()

  const [step, setStep] = useState('form') // form | code | waiting
  const [form, setForm] = useState({
    code: params.get('code') || '',
    name: '',
    email: '',
    password: '',
  })
  const [otp, setOtp] = useState('')
  const [codeError, setCodeError] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [waitingSubdomain, setWaitingSubdomain] = useState(subdomain)

  const address = subdomain ? `${subdomain}.nexuslms.com` : 'NexusLMS'
  const heading = tenant ? `Join ${tenant.name}.` : 'Join your school.'

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const changeCode = (e) => {
    setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') })
    setCodeError('')
  }
  const change = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const handleStart = async (e) => {
    e.preventDefault()
    setCodeError('')
    setError('')
    setBusy(true)
    try {
      const data = await startJoin({
        code: form.code.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      setCooldown(data.resendAfterSeconds)
      setOtp('')
      setStep('code')
    } catch (err) {
      if (err.code === 'INVALID_CODE') {
        setCodeError('Invalid code')
      } else {
        setError(err.message)
      }
    } finally {
      setBusy(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    try {
      const data = await verifyJoin({ email: form.email.trim(), code: otp })
      if (data.token) {
        // Student: the account is ready and the server signed them in.
        setSession({ token: data.token, user: data.user })
        navigate(homeFor(data.user.role))
      } else {
        // Teacher: waiting for the school admin to approve. Any session that's still open
        // belongs to someone else, so clear it first — otherwise "Back to sign in" would
        // send them to that other person's dashboard.
        logout()
        setWaitingSubdomain(data.subdomain)
        setStep('waiting')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setInfo('')
    try {
      const data = await resendJoinCode(form.email.trim())
      setCooldown(data.resendAfterSeconds)
      setInfo('A new code is on its way.')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="auth">
      <aside className="auth__side">
        <Logo light />
        <div>
          <p className="auth__school">{address}</p>
          <h1>{heading}</h1>
        </div>
        <p>Your teacher or school admin shared the code with you.</p>
      </aside>

      <main className="auth__main">
        {step === 'form' && (
          <form className="auth__card" onSubmit={handleStart}>
            <h2>Join with a code</h2>
            <p className="auth__sub">Teachers and students both use this page.</p>

            <label className="field">
              <span>Your code</span>
              <input
                value={form.code}
                onChange={changeCode}
                placeholder="STAFF-ABC123 or JSS-4K7Q"
                autoCapitalize="characters"
                autoComplete="off"
                required
              />
              {codeError && <p className="field__error" role="alert">{codeError}</p>}
            </label>

            <label className="field">
              <span>Your name</span>
              <input value={form.name} onChange={change('name')} placeholder="Ngozi Eze" autoComplete="name" required />
            </label>

            <label className="field">
              <span>Email</span>
              <input type="email" value={form.email} onChange={change('email')} placeholder="you@mail.com" autoComplete="email" required />
            </label>

            <PasswordField
              label="Password"
              value={form.password}
              onChange={change('password')}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
            />

            {error && <p className="field__error" role="alert">{error}</p>}
            <button className="btn btn--primary btn--block btn--lg" type="submit" disabled={busy}>
              {busy ? 'Sending code…' : 'Continue'}
            </button>
            <p className="auth__foot">Already have an account? <Link to="/login">Sign in</Link>.</p>
          </form>
        )}

        {step === 'code' && (
          <form className="auth__card" onSubmit={handleVerify}>
            <h2>Check your email</h2>
            <p className="auth__sub">We sent a 6-digit code to <strong>{form.email}</strong>. It expires in 15 minutes.</p>
            {import.meta.env.DEV && <p className="auth__note">Development: the code is printed in the backend console.</p>}

            <label className="field">
              <span>Verification code</span>
              <input
                className="code-input"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                required
              />
            </label>

            {error && <p className="field__error" role="alert">{error}</p>}
            {info && <p className="auth__info" role="status">{info}</p>}
            <button className="btn btn--primary btn--block btn--lg" type="submit" disabled={busy || otp.length !== 6}>
              {busy ? 'Checking…' : 'Verify and join'}
            </button>
            <div className="auth__row">
              <button type="button" className="auth__link" onClick={handleResend} disabled={cooldown > 0 || busy}>
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
              </button>
              <button type="button" className="auth__link" onClick={() => { setStep('form'); setError(''); setInfo('') }}>
                Use a different email
              </button>
            </div>
          </form>
        )}

        {step === 'waiting' && (
          <div className="auth__card">
            <h2>Your request is in.</h2>
            <p className="auth__sub">Your school admin needs to approve your account before you can sign in.</p>
            <p>Once they do, sign in at <strong>{waitingSubdomain}.nexuslms.com</strong> with the email and password you just chose.</p>
            <Link to="/login" className="btn btn--ghost btn--block">Back to sign in</Link>
          </div>
        )}
      </main>
    </div>
  )
}