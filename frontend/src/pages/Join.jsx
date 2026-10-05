import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Logo from '../components/Logo'
import { school } from '../data/mock'
import '../styles/auth.css'

// Reached from an invite link like /join?code=GLD-4K7Q. The code fills in automatically.
export default function Join() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const handleSubmit = (e) => {
    e.preventDefault()
    navigate('/login') // template only: real flow creates the STUDENT account and signs them in
  }

  return (
    <div className="auth">
      <aside className="auth__side">
        <Logo light />
        <div>
          <p className="auth__school">{school.subdomain}.nexuslms.com</p>
          <h1>Join your class at {school.name}.</h1>
        </div>
        <p>Your teacher or school admin shared the class code with you.</p>
      </aside>
      <main className="auth__main">
        <form className="auth__card" onSubmit={handleSubmit}>
          <h2>Join a class</h2>
          <p className="auth__sub">Create your student account.</p>
          <label className="field"><span>Class code</span><input defaultValue={params.get('code') || ''} placeholder="GLD-4K7Q" required /></label>
          <label className="field"><span>Your name</span><input placeholder="Ngozi Eze" required /></label>
          <label className="field"><span>Email</span><input type="email" placeholder="you@mail.com" required /></label>
          <label className="field"><span>Password</span><input type="password" placeholder="At least 8 characters" minLength={8} required /></label>
          <button className="btn btn--primary btn--block btn--lg" type="submit">Join class</button>
          <p className="auth__foot">Already have an account? <Link to="/login">Sign in</Link>, then use “Join another class” on your dashboard.</p>
        </form>
      </main>
    </div>
  )
}
