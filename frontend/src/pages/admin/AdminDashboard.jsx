import { Link } from 'react-router-dom'
import Logo from '../../components/Logo'
import { school, admin, stats, classes, activity } from '../../data/mock'
import '../../styles/admin.css'

const nav = ['Overview', 'Classes', 'Teachers', 'Students', 'Courses']

export default function AdminDashboard() {
  const initials = admin.name.split(' ').map((n) => n[0]).join('')

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar__brand"><Logo /></div>
        <nav aria-label="Admin">
          {nav.map((item, i) => (
            <a key={item} href="#" className={`sidebar__link ${i === 0 ? 'is-active' : ''}`} aria-current={i === 0 ? 'page' : undefined}>
              {item}
            </a>
          ))}
        </nav>
        <div className="sidebar__school">
          <strong>{school.name}</strong>
          <span>{school.subdomain}.nexuslms.com</span>
        </div>
      </aside>

      <div className="shell__main">
        <header className="topbar">
          <h1>Overview</h1>
          <div className="topbar__user">
            <div><strong>{admin.name}</strong><span>Admin</span></div>
            <span className="avatar" aria-hidden="true">{initials}</span>
            <Link to="/login" className="btn btn--ghost">Sign out</Link>
          </div>
        </header>

        <main className="content">
          <section className="stats" aria-label="School totals">
            {stats.map((s) => (
              <div key={s.label} className="stat">
                <span className="stat__label">{s.label}</span>
                <span className="stat__value">{s.value}</span>
                <span className="stat__note">{s.note}</span>
              </div>
            ))}
          </section>

          <section className="actions">
            <button className="btn btn--primary">Create class</button>
            <button className="btn btn--ghost">Add teacher</button>
          </section>

          <div className="columns">
            <section className="panel">
              <h2>Classes</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Class</th><th>Teachers</th><th>Students</th><th>Courses</th><th>Join code</th></tr>
                  </thead>
                  <tbody>
                    {classes.map((c) => (
                      <tr key={c.id}>
                        <td><strong>{c.name}</strong></td>
                        <td>{c.teachers}</td>
                        <td>{c.students}</td>
                        <td>{c.courses}</td>
                        <td><code className="code">{c.code}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="panel">
              <h2>Recent activity</h2>
              <ul className="activity">
                {activity.map((a) => (
                  <li key={a.id}><p>{a.text}</p><time>{a.time}</time></li>
                ))}
              </ul>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
