import { Link, NavLink } from 'react-router-dom'
import Logo from './Logo'
import { school, admin, teacher } from '../data/mock'
import '../styles/admin.css'

// Add each page here as it gets built.
const NAV = {
  admin: [['Overview', '/admin'], ['Classes', '/admin/classes'], ['Teachers', '/admin/teachers'], ['Students', '/admin/students'], ['Courses', '/admin/courses']],
  teacher: [['My courses', '/teacher'], ['Assignments', '/teacher/assignments'], ['Quizzes', '/teacher/quizzes'], ['Gradebook', '/teacher/gradebook']],
}
const USERS = { admin: { ...admin, label: 'Admin' }, teacher: { ...teacher, label: 'Teacher' } }

export default function AppLayout({ role, title, children }) {
  const user = USERS[role]
  const initials = user.name.replace(/^(Mr|Mrs|Ms)\.\s/, '').split(' ').map((n) => n[0]).join('')
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar__brand"><Logo /></div>
        <nav aria-label={user.label}>
          {NAV[role].map(([label, to], i) => (
            <NavLink key={to} to={to} end={i === 0} className={({ isActive }) => `sidebar__link ${isActive ? 'is-active' : ''}`}>{label}</NavLink>
          ))}
        </nav>
        <div className="sidebar__school">
          <strong>{school.name}</strong>
          <span>{school.subdomain}.nexuslms.com</span>
        </div>
      </aside>
      <div className="shell__main">
        <header className="topbar">
          <h1>{title}</h1>
          <div className="topbar__user">
            <div><strong>{user.name}</strong><span>{user.label}</span></div>
            <span className="avatar" aria-hidden="true">{initials}</span>
            <Link to="/login" className="btn btn--ghost">Sign out</Link>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  )
}
