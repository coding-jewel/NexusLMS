import { useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from './Logo'
import { schoolUrl } from '../utils/tenant'
import '../styles/auth.css'

// Shown on the main site when a page needs to know which school the visitor belongs to.
export default function SchoolAddressRequired({ path = '/login' }) {
  const [value, setValue] = useState('')
  const subdomain = value.trim()
  const joining = path === '/join'

  const handleSubmit = (e) => {
    e.preventDefault()
    window.location.href = schoolUrl(subdomain, path)
  }

  return (
    <div className="auth">
      <main className="auth__main" style={{ gridColumn: '1 / -1' }}>
        <form className="auth__card" onSubmit={handleSubmit}>
          <Logo />
          <h2>{joining ? 'Which school are you joining?' : 'Which school are you signing in to?'}</h2>
          <p className="auth__sub">Every school has its own address. Ask your school if you’re not sure what it is.</p>

          <div className="subdomain">
            <span className="subdomain__label">Your school’s address</span>
            <div className="subdomain__edit">
              <input
                aria-label="School address"
                value={value}
                placeholder="lincoln"
                onChange={(e) => setValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              />
              <span>.nexuslms.com</span>
            </div>
          </div>

          <button className="btn btn--primary btn--block btn--lg" type="submit" disabled={!subdomain}>Continue</button>
          <p className="auth__foot"><Link to="/">Back to home</Link></p>
        </form>
      </main>
    </div>
  )
}