import { useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import { TypeBadge, StatusBadge } from '../../components/Badges'
import { teacherQuizzes } from '../../data/mock'
import '../../styles/teacher.css'

export default function Quizzes() {
  const [list, setList] = useState(teacherQuizzes)
  const toggle = (q) => setList(list.map((x) => (x === q ? { ...x, released: !x.released } : x)))

  return (
    <AppLayout role="teacher" title="Tests & Exams">
      <div className="page-head"><p>All your tests and exams. To create one, open a course and use its Tests &amp; Exams tab. Students can attempt each one once.</p></div>
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Title</th><th>Course</th><th>Type</th><th>Status</th><th>Attempts</th><th>Results</th><th /></tr></thead>
            <tbody>
              {list.map((q) => (
                <tr key={`${q.courseId}-${q.id}`}>
                  <td><strong>{q.title}</strong><small className="sub">{q.questions} questions · {q.minutes} min</small></td>
                  <td>{q.course}<small className="sub">{q.className}</small></td>
                  <td><TypeBadge category={q.category} /></td>
                  <td><StatusBadge status={q.status} />{q.toMark > 0 && <> <span className="badge badge--warn">{q.toMark} to mark</span></>}</td>
                  <td>{q.attempts}</td>
                  <td>
                    {q.attempts > 0
                      ? <button className="btn btn--ghost btn--sm" onClick={() => toggle(q)}>{q.released ? 'Hide results' : 'Release results'}</button>
                      : <span className="muted-text">—</span>}
                    {q.attempts > 0 && <small className="sub">{q.released ? 'Students can see scores' : 'Hidden from students'}</small>}
                  </td>
                  <td>{q.attempts > 0 && <Link to={`/teacher/courses/${q.courseId}/quizzes/${q.id}/mark`} className="btn btn--ghost btn--sm">Mark answers</Link>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppLayout>
  )
}
