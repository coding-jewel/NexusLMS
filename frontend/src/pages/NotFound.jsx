import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import '../styles/student.css'

export default function NotFound() {
  return (
    <div className="notfound">
      <Logo />
      <h1>We can’t find that page</h1>
      <p>The link may be wrong, or the page may have moved.</p>
      <Link to="/" className="btn btn--primary">Go to the home page</Link>
    </div>
  )
}
