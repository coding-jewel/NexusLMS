import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import { listMyAssessments } from '../../api/student'
import { TypeBadge } from '../../components/Badges'
import '../../styles/teacher.css'
import '../../styles/student.css'

export default function StudentAssessments() {
  const [list, setList] = useState(null)
  const [error, setError] = useState('')

  const load = () => {
    setError('')
    setList(null)
    listMyAssessments().then(setList).catch((err) => setError(err.message))
  }
  useEffect(() => { load() }, [])

  return (
    <AppLayout role="student" title="Tests & Exams">
      <div className="page-head">
        <p>Class-wide tests and exams. Each one can only be attempted once.</p>
      </div>

      <section className="panel">
        {error ? (
          <div className="empty">
            <p className="field__error" role="alert">{error}</p>
            <button className="btn btn--ghost" onClick={load}>Try again</button>
          </div>
        ) : list === null ? (
          <p className="empty">Loading…</p>
        ) : list.length === 0 ? (
          <p className="empty">No tests or exams scheduled yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Title</th><th>Class</th><th>Type</th><th>Marks</th><th>Time</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {list.map((a) => (
                  <tr key={a.quizId}>
                    <td><strong>{a.title}</strong></td>
                    <td>{a.className}</td>
                    <td><TypeBadge category={a.category} /></td>
                    <td>{a.totalMarks}</td>
                    <td>{a.timeLimitMinutes ? `${a.timeLimitMinutes} min` : '—'}</td>
                    <td>
                      {a.attempted
                        ? <span className="badge badge--live">Attempted</span>
                        : <span className="badge">Available</span>}
                    </td>
                    <td>
                      <Link to={`/student/quizzes/${a.quizId}/take`} className="btn btn--ghost btn--sm">
                        {a.attempted ? 'View result' : 'Start'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppLayout>
  )
}