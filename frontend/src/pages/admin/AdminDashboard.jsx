import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import CopyButton from '../../components/CopyButton'
import { useTenant } from '../../tenant/TenantContext'
import { schoolUrl } from '../../utils/tenant'
import { getStats } from '../../api/stats'
import { listUsers, approveUser } from '../../api/users'
import { getTeacherCode } from '../../api/admin'
import '../../styles/admin.css'

const CARDS = [
  ['classes', 'Classes'],
  ['teachers', 'Teachers'],
  ['students', 'Students'],
]

export default function AdminDashboard() {
  const { subdomain } = useTenant() 
  const [stats, setStats] = useState(null)
  const [pendingTeachers, setPendingTeachers] = useState([])
  const [teacherCode, setTeacherCode] = useState('') 
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setError('')
    setStats(null)
    
    // Fetch stats, pending teachers, and the secure teacher code in parallel
    Promise.all([
      getStats(),
      listUsers({ role: 'TEACHER' }),
      getTeacherCode() 
    ])
      .then(([statsData, teachers, codeData]) => {
        setStats(statsData)
        setPendingTeachers(teachers.filter(t => !t.approved))
        setTeacherCode(codeData.code) 
      })
      .catch((err) => setError(err.message))
  }

  useEffect(() => { load() }, [])

  const handleApprove = async (id) => {
    setBusyId(id)
    try {
      await approveUser(id)
      // Remove them from the pending list locally
      setPendingTeachers(pendingTeachers.filter(t => t.id !== id))
      // Refresh stats to update the teacher count
      const newStats = await getStats()
      setStats(newStats)
    } catch (err) {
      alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

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

      <div className="columns">
        
        {/* Left Column: Pending Approvals */}
        <section className="panel">
          <div className="panel__head">
            <h2>Pending Approvals</h2>
            {pendingTeachers.length > 0 && <span className="badge badge--warn">{pendingTeachers.length}</span>}
          </div>
          
          {pendingTeachers.length === 0 ? (
            <p className="empty">No teachers are waiting for approval.</p>
          ) : (
            <ul className="rows">
              {pendingTeachers.map((t) => (
                <li key={t.id}>
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.email}</span>
                  </div>
                  <div className="rows__end">
                    <button 
                      className="btn btn--primary btn--sm" 
                      onClick={() => handleApprove(t.id)}
                      disabled={busyId === t.id}
                    >
                      {busyId === t.id ? 'Approving…' : 'Approve'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Right Column: Staff Join Code & Quick Actions */}
        <section className="panel">
          <div className="panel__head">
            <h2>Staff Onboarding</h2>
          </div>
          <p className="hint mb-1">
            Share this code with new teachers. They will use it to register and then wait for your approval.
          </p>
          
          <div className="code-box">
            <code>{teacherCode || 'LOADING...'}</code>
            {teacherCode && (
              <CopyButton text={teacherCode} label="Copy" className="btn btn--primary btn--sm" />
            )}
          </div>

          <div className="quick-actions">
            <h3 className="subhead">Quick Actions</h3>
            <div className="quick-actions__buttons">
              <Link to="/admin/classes" className="btn btn--primary btn--sm">Create Class</Link>
              <Link to="/admin/teachers" className="btn btn--ghost btn--sm">Manage Teachers</Link>
              <Link to="/admin/students" className="btn btn--ghost btn--sm">Manage Students</Link>
            </div>
          </div>
        </section>

      </div>
    </AdminLayout>
  )
}