import { Link } from 'react-router-dom'
import '../styles/Logo.css'

export default function Logo({ light = false }) {
  return (
    <Link to="/" className={`logo ${light ? 'logo--light' : ''}`} aria-label="NexusLMS home">
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <line x1="14" y1="14" x2="5" y2="6" stroke="currentColor" strokeWidth="2" />
        <line x1="14" y1="14" x2="23" y2="7" stroke="currentColor" strokeWidth="2" />
        <line x1="14" y1="14" x2="14" y2="24" stroke="currentColor" strokeWidth="2" />
        <circle cx="14" cy="14" r="5" fill="#14b8a6" />
        <circle cx="5" cy="6" r="3" fill="currentColor" />
        <circle cx="23" cy="7" r="3" fill="currentColor" />
        <circle cx="14" cy="24" r="3" fill="currentColor" />
      </svg>
      <span>NexusLMS</span>
    </Link>
  )
}
