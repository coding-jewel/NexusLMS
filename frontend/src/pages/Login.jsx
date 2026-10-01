import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Logo from '../components/Logo'
import { school } from '../data/mock'
import '../styles/auth.css'

// On a school subdomain this page shows that school's name.
// Add ?expired=1 to the URL to preview the session-expired state.
export default function Login() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const expired = params.get('expired') === '1'

  const handleSubmit = (e) => {
    e.preventDefault()
    navigate('/admin') // template only
  }

  return (
    <div className="auth">
      <aside className="auth__side">
        <Logo light />
        <div>
          <p className="auth__school">{school.subdomain}.nexuslms.com</p>
          <h1>Welcome to {school.name}.</h1>
        </div>
        <p>Teachers and students: use the email your school gave you.</p>
      </aside>

      <main className="auth__main">
        <form className="auth__card" onSubmit={handleSubmit}>
          <h2>Sign in</h2>
          <p className="auth__sub">to {school.name}</p>

          {expired && (
            <div className="banner" role="status">Your session expired. Sign in again to pick up where you left off.</div>
          )}

          <label className="field"><span>Email</span><input type="email" placeholder="you@school.edu" required /></label>
          <label className="field"><span>Password</span><input type="password" required /></label>

          <button className="btn btn--primary btn--block btn--lg" type="submit">Sign in</button>
          <p className="auth__foot">Have a class code? <Link to="/join">Join a class</Link></p>
        </form>
      </main>
    </div>
  )
}
