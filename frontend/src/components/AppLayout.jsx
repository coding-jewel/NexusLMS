import { NavLink, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import { useAuth } from '../auth/AuthContext'
import { useTenant } from '../tenant/TenantContext'
import '../styles/admin.css'

// Add each page here as it gets built.
const NAV = {
  admin: [['Overview', '/admin'], ['Classes', '/admin/classes'], ['Teachers', '/admin/teachers'], ['Students', '/admin/students'], ['Courses', '/admin/courses'], ['Grading', '/admin/grading']],
  student: [['My courses', '/student'], ['My grades', '/student/grades']],
  teacher: [['My courses', '/teacher'], ['Assignments', '/teacher/assignments'], ['Tests & Exams', '/teacher/quizzes'], ['Gradebook', '/teacher/gradebook']],
}
const LABELS = { admin: 'Admin', teacher: 'Teacher', student: 'Student' }

export default function AppLayout({ role, title, children }) {
  const { user, logout } = useAuth()
  const { tenant, subdomain } = useTenant()
  const navigate = useNavigate()

  const name = user?.name || LABELS[role]
  const initials = name.replace(/^(Mr|Mrs|Ms)\.\s/, '').split(' ').map((n) => n[0]).join('').slice(0, 2)
  const signOut = () => { logout(); navigate('/login') }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar__brand"><Logo /></div>
        <nav aria-label={LABELS[role]}>
          {NAV[role].map(([label, to], i) => (
            <NavLink key={to} to={to} end={i === 0} className={({ isActive }) => `sidebar__link ${isActive ? 'is-active' : ''}`}>{label}</NavLink>
          ))}
        </nav>
        <div className="sidebar__school">
          <strong>{tenant?.name}</strong>
          <span>{subdomain}.nexuslms.com</span>
        </div>
      </aside>
      <div className="shell__main">
        <header className="topbar">
          <h1>{title}</h1>
          <div className="topbar__user">
            <div><strong>{name}</strong><span>{LABELS[role]}</span></div>
            <span className="avatar" aria-hidden="true">{initials}</span>
            <button type="button" className="btn btn--ghost" onClick={signOut}>Sign out</button>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  )
}