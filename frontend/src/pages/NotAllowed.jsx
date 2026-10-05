import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import { useAuth } from '../auth/AuthContext'
import { homeFor } from '../utils/roles'
import '../styles/student.css'

export default function NotAllowed() {
  const { user } = useAuth()
  return (
    <div className="notfound">
      <Logo />
      <h1>You don’t have access to this page</h1>
      <p>This page is for a different kind of account.</p>
      <Link to={homeFor(user?.role)} className="btn btn--primary">Go to your dashboard</Link>
    </div>
  )
}