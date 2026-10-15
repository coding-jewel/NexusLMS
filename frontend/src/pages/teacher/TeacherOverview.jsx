import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import { getTeacherStats } from '../../api/teacher'
import '../../styles/teacher.css'

const CARDS = [
  ['classes', 'Classes'],
  ['courses', 'Topics'],
  ['assignments', 'Assignments'],
  ['quizzes', 'Tests & Exams'],
]

export default function TeacherOverview() {
  const [stats, setStats] = useState(null) // null while loading
  const [error, setError] = useState('')

  const load = () => {
    setError('')
    setStats(null)
    getTeacherStats().then(setStats).catch((err) => setError(err.message))
  }
  useEffect(() => { load() }, [])

  const gradeTo = (item) =>
    item.kind === 'assignment'
      ? `/teacher/courses/${item.courseId}/assignments/${item.itemId}/grade`
      : `/teacher/courses/${item.courseId}/quizzes/${item.itemId}/mark`

  return (
    <AppLayout role="teacher" title="Overview">
      {error ? (
        <section className="panel">
          <div className="empty">
            <p className="field__error" role="alert">{error}</p>
            <button className="btn btn--ghost" onClick={load}>Try again</button>
          </div>
        </section>
      ) : (
        <>
          <section className="stats" aria-label="Your totals">
            {CARDS.map(([key, label]) => (
              <div key={key} className="stat">
                <span className="stat__label">{label}</span>
                <span className="stat__value">{stats ? stats[key] : '…'}</span>
              </div>
            ))}
          </section>

          <section className="panel">
            <div className="panel__head">
              <h2>Waiting to be graded</h2>
              {stats && stats.toGrade.length > 0 && <span className="badge badge--warn">{stats.toGrade.length}</span>}
            </div>
            {!stats ? (
              <p className="empty">Loading…</p>
            ) : stats.toGrade.length === 0 ? (
              <p className="empty">Nothing waiting. You're all caught up.</p>
            ) : (
              <ul className="rows">
                {stats.toGrade.map((item) => (
                  <li key={`${item.kind}-${item.itemId}`}>
                    <div>
                      <strong>{item.itemName}</strong>
                      <small>{item.courseName}</small>
                    </div>
                    <div className="rows__end">
                      <span className="badge badge--warn">{item.count} to grade</span>
                      <Link to={gradeTo(item)} className="btn btn--ghost btn--sm">Open</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="actions">
            <Link to="/teacher/courses" className="btn btn--primary">My Topics</Link>
            <Link to="/teacher/classes" className="btn btn--ghost">My Classes</Link>
            <Link to="/teacher/assignments" className="btn btn--ghost">All Assignments</Link>
          </section>
        </>
      )}
    </AppLayout>
  )
}