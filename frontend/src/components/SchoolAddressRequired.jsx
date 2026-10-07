import { useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from './Logo'
import { schoolUrl } from '../utils/tenant'
import '../styles/auth.css'

// Shown on the main site when a page needs to know which school the visitor belongs to.
// We check the address here, on the main site, before navigating — so a wrong address
// never ends up in the URL bar and never gets a place in the browser history.
export default function SchoolAddressRequired({ path = '/login', error = '' }) {
  const [value, setValue] = useState('')
  const [checkError, setCheckError] = useState('')
  const [busy, setBusy] = useState(false)
  const subdomain = value.trim()
  const joining = path === '/join'

  const shownError = checkError || error

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCheckError('')
    setBusy(true)
    try {
      const res = await fetch(`/api/public/tenants/${encodeURIComponent(subdomain)}`)
      if (res.status === 404) {
        setCheckError(`We couldn’t find “${subdomain}”. Check the address and try again.`)
        return
      }
      if (!res.ok) {
        setCheckError('We couldn’t reach the server. Check your connection and try again.')
        return
      }
      // The school exists. Now go to its own address.
      // The main site's Log in always asks for a proper sign-in, even if a session is saved there.
      const target = path === '/login' ? '/login?fresh=1' : path
      window.location.href = schoolUrl(subdomain, target)
    } catch {
      setCheckError('We couldn’t reach the server. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <main className="auth__main" style={{ gridColumn: '1 / -1' }}>
        <form className="auth__card" onSubmit={handleSubmit}>
          <Logo />
          <h2>{joining ? 'Which school are you joining?' : 'Which school are you signing in to?'}</h2>
          {shownError
            ? <div className="banner" role="alert">{shownError}</div>
            : <p className="auth__sub">Every school has its own address. Ask your school if you’re not sure what it is.</p>
          }

          <div className="subdomain">
            <span className="subdomain__label">Your school’s address</span>
            <div className="subdomain__edit">
              <input
                aria-label="School address"
                value={value}
                placeholder="lincoln"
                onChange={(e) => { setValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setCheckError('') }}
                disabled={busy}
              />
              <span>.nexuslms.com</span>
            </div>
          </div>

          <button className="btn btn--primary btn--block btn--lg" type="submit" disabled={!subdomain || busy}>
            {busy ? 'Checking…' : 'Continue'}
          </button>
          <p className="auth__foot"><Link to="/">Back to home</Link></p>
        </form>
      </main>
    </div>
  )
}