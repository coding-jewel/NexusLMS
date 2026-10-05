import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import PasswordField from '../components/PasswordField'
import { generateSubdomain, fullSlug } from '../utils/subdomain'
import { schoolUrl } from '../utils/tenant'
import { checkSubdomain, startRegistration, verifyRegistration, resendCode } from '../api/registration'
import '../styles/auth.css'

export default function Register() {
  const [step, setStep] = useState('form') // form | code | done
  const [schoolName, setSchoolName] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [edited, setEdited] = useState(false)
  const [editing, setEditing] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [check, setCheck] = useState({ state: 'idle' }) // idle | checking | available | unavailable | error
  const [suggestion, setSuggestion] = useState(null)
  const [code, setCode] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const slug = edited ? subdomain : generateSubdomain(schoolName)

  // Live check: waits half a second after typing stops, and only the latest answer is used.
  useEffect(() => {
    if (!slug) { setCheck({ state: 'idle' }); return }
    setCheck({ state: 'checking' })
    let current = true
    const timer = setTimeout(async () => {
      try {
        const r = await checkSubdomain(slug)
        if (current) setCheck({ state: r.available ? 'available' : 'unavailable', reason: r.reason })
      } catch {
        if (current) setCheck({ state: 'error' })
      }
    }, 500)
    return () => { current = false; clearTimeout(timer) }
  }, [slug])

  // If the short address is taken, offer the full school name when that one is free.
  useEffect(() => {
    setSuggestion(null)
    if (check.state !== 'unavailable' || edited) return
    const full = fullSlug(schoolName)
    if (!full || full === slug) return
    let current = true
    checkSubdomain(full).then((r) => { if (current && r.available) setSuggestion(full) }).catch(() => {})
    return () => { current = false }
  }, [check.state, slug, edited, schoolName])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const useAddress = (value) => { setEdited(true); setSubdomain(value) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const r = await startRegistration({ schoolName, subdomain: slug, email, password })
      setCooldown(r.resendAfterSeconds)
      setCode('')
      setStep('code')
    } catch (err) {
      setError(err.message)
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
      const r = await verifyRegistration({ subdomain: slug, code })
      setStep('done')
      setTimeout(() => { window.location.href = schoolUrl(r.subdomain, '/login') }, 1500)
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
      const r = await resendCode(slug)
      setCooldown(r.resendAfterSeconds)
      setInfo('A new code is on its way.')
    } catch (err) {
      setError(err.message)
    }
  }

  const mismatch = confirm !== '' && confirm !== password
  const canSubmit = !busy && check.state === 'available' && schoolName.trim() && email && password.length >= 8 && password === confirm

  return (
    <div className="auth">
      <aside className="auth__side">
        <Logo light />
        <div>
          <h1>Set up your school in a few minutes.</h1>
          <ul>
            <li>Your own address for teachers and students</li>
            <li>Create classes and add teachers right away</li>
            <li>Students join with a class code</li>
          </ul>
        </div>
        <p>Already registered? Sign in at your school’s address.</p>
      </aside>

      <main className="auth__main">
        {step === 'form' && (
          <form className="auth__card" onSubmit={handleSubmit}>
            <h2>Register your school</h2>
            <p className="auth__sub">You’ll be the school’s admin.</p>

            <label className="field">
              <span>School name</span>
              <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="Lincoln High School" required />
            </label>

            <div className="subdomain">
              <span className="subdomain__label">Your school’s address</span>
              {editing ? (
                <div className="subdomain__edit">
                  <input
                    aria-label="Subdomain"
                    value={slug}
                    onChange={(e) => useAddress(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  />
                  <span>.nexuslms.com</span>
                  <button type="button" onClick={() => setEditing(false)}>Done</button>
                </div>
              ) : (
                <div className="subdomain__view">
                  <strong className={slug ? '' : 'muted'}>{slug || 'yourschool'}</strong>.nexuslms.com
                  {slug && <button type="button" onClick={() => setEditing(true)}>Edit</button>}
                </div>
              )}

              <p className={`avail avail--${check.state}`} aria-live="polite">
                {check.state === 'checking' && 'Checking…'}
                {check.state === 'available' && 'Subdomain available'}
                {check.state === 'unavailable' && <>Subdomain not available. <span>{check.reason}</span></>}
                {check.state === 'error' && 'Couldn’t check the address. Is the server running?'}
              </p>
              {suggestion && (
                <button type="button" className="auth__link" onClick={() => useAddress(suggestion)}>
                  Use {suggestion}
                </button>
              )}
            </div>

            <label className="field">
              <span>School email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" required />
            </label>
            <PasswordField
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
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
            <button className="btn btn--primary btn--block btn--lg" type="submit" disabled={!canSubmit}>
              {busy ? 'Sending code…' : 'Create school'}
            </button>
            <p className="auth__foot"><Link to="/">Back to home</Link></p>
          </form>
        )}

        {step === 'code' && (
          <form className="auth__card" onSubmit={handleVerify}>
            <h2>Check your email</h2>
            <p className="auth__sub">We sent a 6-digit code to <strong>{email}</strong>. It expires in 15 minutes.</p>
            {import.meta.env.DEV && <p className="auth__note">Development: the code is printed in the backend console.</p>}

            <label className="field">
              <span>Verification code</span>
              <input
                className="code-input"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                required
              />
            </label>

            {error && <p className="field__error" role="alert">{error}</p>}
            {info && <p className="auth__info" role="status">{info}</p>}
            <button className="btn btn--primary btn--block btn--lg" type="submit" disabled={busy || code.length !== 6}>
              {busy ? 'Checking…' : 'Verify and create school'}
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

        {step === 'done' && (
          <div className="auth__card">
            <h2>Your school is ready</h2>
            <p className="auth__sub">Taking you to {slug}.nexuslms.com to sign in…</p>
          </div>
        )}
      </main>
    </div>
  )
}