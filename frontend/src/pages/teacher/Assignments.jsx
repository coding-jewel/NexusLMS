import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import { listMyAssignments } from '../../api/assignments'
import '../../styles/teacher.css'

const fmtDue = (v) => {
  if (!v) return '—'
  return new Date(v).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

// The status badge says what the teacher should do next:
//   no submissions yet     -> "No submissions yet" (grey)
//   some ungraded          -> "N to grade" (warn)
//   all submissions graded -> "All graded" (live)
function Status({ a }) {
  if (a.submittedCount === 0) return <span className="badge">No submissions yet</span>
  if (a.toGradeCount > 0) return <span className="badge badge--warn">{a.toGradeCount} to grade</span>
  return <span className="badge badge--live">All graded</span>
}

export default function Assignments() {
  const [list, setList] = useState(null)
  const [error, setError] = useState('')
  const [onlyToGrade, setOnlyToGrade] = useState(false)

  const load = () => {
    setError('')
    setList(null)
    listMyAssignments().then(setList).catch((err) => setError(err.message))
  }
  useEffect(() => { load() }, [])

  const visible = (list ?? []).filter((a) => !onlyToGrade || a.toGradeCount > 0)
  const totalWaiting = (list ?? []).reduce((n, a) => n + a.toGradeCount, 0)

  return (
    <AppLayout role="teacher" title="Assignments">
      <div className="page-head">
        <p><strong>{totalWaiting}</strong> {totalWaiting === 1 ? 'submission is' : 'submissions are'} waiting for a grade across your courses.</p>
        <label className="check-inline">
          <input type="checkbox" checked={onlyToGrade} onChange={(e) => setOnlyToGrade(e.target.checked)} />
          Only show items to grade
        </label>
      </div>

      <section className="panel">
        {error ? (
          <div className="empty">
            <p className="field__error" role="alert">{error}</p>
            <button className="btn btn--ghost" onClick={load}>Try again</button>
          </div>
        ) : list === null ? (
          <p className="empty">Loading assignments…</p>
        ) : list.length === 0 ? (
          <p className="empty">No assignments yet. Create one from a course.</p>
        ) : visible.length === 0 ? (
          <p className="empty">Nothing to grade right now.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Assignment</th><th>Course</th><th>Due</th><th>Submitted</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {visible.map((a) => (
                  <tr key={a.id}>
                    <td><strong>{a.title}</strong></td>
                    <td>{a.courseName}<small className="sub">{a.className}</small></td>
                    <td>{fmtDue(a.dueDate)}</td>
                    <td>{a.submittedCount}/{a.totalStudents}</td>
                    <td><Status a={a} /></td>
                    <td>
                      <Link to={`/teacher/courses/${a.courseId}/assignments/${a.id}/grade`} className="btn btn--ghost btn--sm">Review</Link>
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