import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { generateSubdomain, RESERVED } from '../utils/subdomain'
import '../styles/auth.css'

export default function Register() {
  const navigate = useNavigate()
  const [schoolName, setSchoolName] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [edited, setEdited] = useState(false)
  const [editing, setEditing] = useState(false)

  const slug = edited ? subdomain : generateSubdomain(schoolName)
  const reserved = RESERVED.includes(slug)

  const handleSubmit = (e) => {
    e.preventDefault()
    navigate('/login') // template only: real flow will create the tenant, then redirect to the school's own /login
  }

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
        <form className="auth__card" onSubmit={handleSubmit}>
          <h2>Register your school</h2>
          <p className="auth__sub">You’ll be the school’s first admin.</p>

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
                  onChange={(e) => { setEdited(true); setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')) }}
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
            {reserved && <p className="field__error">“{slug}” is reserved. Choose another address.</p>}
          </div>

          <div className="field-row">
            <label className="field"><span>Your name</span><input placeholder="Amara Okafor" required /></label>
            <label className="field"><span>Email</span><input type="email" placeholder="you@school.edu" required /></label>
          </div>
          <label className="field">
            <span>Password</span>
            <input type="password" placeholder="At least 8 characters" minLength={8} required />
          </label>

          <button className="btn btn--primary btn--block btn--lg" type="submit" disabled={!slug || reserved}>
            Create school
          </button>
          <p className="auth__foot"><Link to="/">Back to home</Link></p>
        </form>
      </main>
    </div>
  )
}
