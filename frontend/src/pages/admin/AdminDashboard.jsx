import { Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import CopyButton from '../../components/CopyButton'
import { school, stats, classes, activity } from '../../data/mock'

export default function AdminDashboard() {
  const address = `${school.subdomain}.nexuslms.com`
  return (
    <AdminLayout title="Overview">
      <section className="address-card">
        <div>
          <span className="address-card__label">Your school’s address</span>
          <strong>{address}</strong>
          <p>Share this with teachers and students. It’s where everyone signs in.</p>
        </div>
        <CopyButton text={`https://${address}`} label="Copy address" className="btn btn--primary" />
      </section>

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
        <Link to="/admin/classes" className="btn btn--primary">Create class</Link>
        <Link to="/admin/teachers" className="btn btn--ghost">Add teacher</Link>
      </section>

      <div className="columns">
        <section className="panel">
          <h2>Classes</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Class</th><th>Teachers</th><th>Students</th><th>Courses</th><th>Join code</th></tr></thead>
              <tbody>
                {classes.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong></td><td>{c.teachers}</td><td>{c.students}</td><td>{c.courses}</td>
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
            {activity.map((a) => (<li key={a.id}><p>{a.text}</p><time>{a.time}</time></li>))}
          </ul>
        </section>
      </div>
    </AdminLayout>
  )
}
