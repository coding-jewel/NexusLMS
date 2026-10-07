import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import CopyButton from '../../components/CopyButton'
import { useTenant } from '../../tenant/TenantContext'
import { schoolUrl } from '../../utils/tenant'
import { getStats } from '../../api/stats'

const CARDS = [
  ['classes', 'Classes'],
  ['teachers', 'Teachers'],
  ['students', 'Students'],
  ['courses', 'Courses'],
]

export default function AdminDashboard() {
  const { subdomain } = useTenant()
  const [stats, setStats] = useState(null) // null while loading
  const [error, setError] = useState('')

  const load = () => {
    setError('')
    setStats(null)
    getStats().then(setStats).catch((err) => setError(err.message))
  }
  useEffect(() => { load() }, [])

  // The sign-in link: lincoln.localhost:5173/login while developing, lincoln.nexuslms.com/login once deployed.
  const loginUrl = schoolUrl(subdomain, '/login')
  const address = new URL(loginUrl).host

  return (
    <AdminLayout title="Overview">
      <section className="address-card">
        <div>
          <span className="address-card__label">Your school’s address</span>
          <strong>{address}</strong>
          <p>Share this with teachers and students. It’s where everyone signs in.</p>
        </div>
        <div className="row-actions">
          <a href={loginUrl} target="_blank" rel="noopener noreferrer" className="btn btn--light">Open sign-in page</a>
          <CopyButton text={loginUrl} label="Copy sign-in link" className="btn btn--primary" />
        </div>
      </section>

      {error ? (
        <section className="panel">
          <div className="empty">
            <p className="field__error" role="alert">{error}</p>
            <button className="btn btn--ghost" onClick={load}>Try again</button>
          </div>
        </section>
      ) : (
        <section className="stats" aria-label="School totals">
          {CARDS.map(([key, label]) => (
            <div key={key} className="stat">
              <span className="stat__label">{label}</span>
              <span className="stat__value">{stats ? stats[key] : '…'}</span>
              {key === 'teachers' && stats?.teachersPending > 0 && (
                <span className="stat__note stat__note--warn">{stats.teachersPending} pending</span>
              )}
            </div>
          ))}
        </section>
      )}

      <section className="actions">
        <Link to="/admin/classes" className="btn btn--primary">Create class</Link>
        <Link to="/admin/teachers" className="btn btn--ghost">Add teacher</Link>
      </section>
    </AdminLayout>
  )
}