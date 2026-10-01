import { Link } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import { teacherQuizzes } from '../../data/mock'
import '../../styles/teacher.css'

export default function Quizzes() {
  return (
    <AppLayout role="teacher" title="Quizzes">
      <div className="page-head"><p>All your quizzes. To create one, open a course and use its Quizzes tab.</p></div>
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Quiz</th><th>Course</th><th>Questions</th><th>Attempts</th><th>Status</th><th /></tr></thead>
            <tbody>
              {teacherQuizzes.map((q) => (
                <tr key={`${q.courseId}-${q.id}`}>
                  <td><strong>{q.title}</strong><small className="sub">{q.minutes} min</small></td>
                  <td>{q.course}<small className="sub">{q.className}</small></td>
                  <td>{q.questions}</td>
                  <td>{q.attempts}</td>
                  <td>
                    <span className={`badge ${q.published ? 'badge--live' : ''}`}>{q.published ? 'Published' : 'Draft'}</span>{' '}
                    {q.toMark > 0 && <span className="badge badge--warn">{q.toMark} to mark</span>}
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
