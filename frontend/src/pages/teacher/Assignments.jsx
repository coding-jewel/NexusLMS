import { useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import { teacherAssignments } from '../../data/mock'
import '../../styles/teacher.css'

export default function Assignments() {
  const [onlyToGrade, setOnlyToGrade] = useState(false)
  const list = onlyToGrade ? teacherAssignments.filter((a) => a.toGrade > 0) : teacherAssignments
  const waiting = teacherAssignments.reduce((n, a) => n + a.toGrade, 0)

  return (
    <AppLayout role="teacher" title="Assignments">
      <div className="page-head">
        <p><strong>{waiting}</strong> submissions are waiting for a grade across your courses.</p>
        <label className="check-inline"><input type="checkbox" checked={onlyToGrade} onChange={(e) => setOnlyToGrade(e.target.checked)} /> Only show items to grade</label>
      </div>
      <section className="panel">
        {list.length === 0 ? <p className="empty">Nothing to grade right now.</p> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Assignment</th><th>Course</th><th>Due</th><th>Submitted</th><th>Status</th><th /></tr></thead>
              <tbody>
                {list.map((a) => (
                  <tr key={`${a.courseId}-${a.id}`}>
                    <td><strong>{a.title}</strong></td>
                    <td>{a.course}<small className="sub">{a.className}</small></td>
                    <td>{a.due}</td>
                    <td>{a.submitted}/{a.total}</td>
                    <td>{a.toGrade > 0 ? <span className="badge badge--warn">{a.toGrade} to grade</span> : <span className="badge badge--live">All graded</span>}</td>
                    <td><Link to={`/teacher/courses/${a.courseId}/assignments/${a.id}/grade`} className="btn btn--ghost btn--sm">Review</Link></td>
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
