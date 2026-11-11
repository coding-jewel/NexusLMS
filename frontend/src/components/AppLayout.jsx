import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import Logo from './Logo'
import { useAuth } from '../auth/AuthContext'
import { useTenant } from '../tenant/TenantContext'
import '../styles/admin.css'

const Icons = {
  Overview: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>,
  Classes: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
  Teachers: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
  Students: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>,
  'My Classes': <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" /></svg>,
  'My grades': <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" /></svg>,
  Settings: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
}

const NAV = {
  admin: [
    ['Overview', '/admin'],
    ['Teachers', '/admin/teachers'],
    ['Students', '/admin/students'],
    ['Classes', '/admin/classes'],
    ['Settings', '/settings'],
  ],
  teacher: [
    ['Overview', '/teacher'],
    ['My Classes', '/teacher/classes'],
    ['Settings', '/settings'],
  ],
  student: [
    ['Overview', '/student'],
    ['My Classes', '/student/classes'], 
    ['My grades', '/student/grades'],
    ['Settings', '/settings'],
  ],
}
const LABELS = { admin: 'Admin', teacher: 'Teacher', student: 'Student' }

export default function AppLayout({ role, title, children }) {
  const { user, logout } = useAuth()
  const { tenant, subdomain } = useTenant()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const name = user?.name || LABELS[role]
  const initials = name.replace(/^(Mr|Mrs|Ms)\.\s/, '').split(' ').map((n) => n[0]).join('').slice(0, 2)
  const signOut = () => { logout(); navigate('/login') }

  return (
    <div className="shell">
      {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />}

      <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
        <div className="sidebar__brand">
          <Logo />
          <button className="sidebar__close" onClick={() => setMenuOpen(false)}>&times;</button>
        </div>
        
        <nav aria-label={LABELS[role]}>
          {NAV[role].map(([label, to], i) => (
            <NavLink 
              key={to} 
              to={to} 
              end={i === 0} 
              className={({ isActive }) => {
                let active = isActive
                
                if (role === 'admin' && to === '/admin/classes' && location.pathname.startsWith('/admin/classes/')) {
                  active = true
                }

                if (role === 'teacher' && to === '/teacher/classes') {
                  // Keep "My Classes" active for Topics, Exams, and Marking
                  if (location.pathname.startsWith('/teacher/courses') || location.pathname.startsWith('/teacher/quizzes')) {
                    active = true
                  }
                }

                if (role === 'student') {
                  if (to === '/student/classes' && (location.pathname.startsWith('/student/courses') || location.pathname.startsWith('/student/classes') || location.pathname.startsWith('/student/quizzes'))) {
                    active = true
                  }
                }

                return `sidebar__link ${active ? 'is-active' : ''}`
              }}
              onClick={() => setMenuOpen(false)}
            >
              {Icons[label]}
              {label}
            </NavLink>
          ))}
        </nav>
        
        <div className="sidebar__school">
          <strong>{tenant?.name}</strong>
          <span>{subdomain}.nexuslms.com</span>
        </div>
      </aside>

      <div className="shell__main">
        <header className="topbar">
          <div className="topbar__title">
            <button className="menu-toggle" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1>{title}</h1>
          </div>
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