import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import { getMyGrades } from '../../api/student'
import { TypeBadge } from '../../components/Badges'
import '../../styles/teacher.css'
import '../../styles/student.css'

const pct = (a, b) => (b > 0 ? `${Math.round((a / b) * 100)}%` : '—')
const fmtPct = (a) => (a != null ? `${Math.round(a)}%` : '—')

export default function StudentGradeDetail() {
  const { classId } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')
    getMyGrades().then(setData).catch((err) => setError(err.message))
  }, [])

  if (error) {
    return (
      <AppLayout role="student" title="Grade Details">
        <section className="panel">
          <div className="empty">
            <p className="field__error" role="alert">{error}</p>
            <Link to="/student/grades" className="btn btn--ghost">Back to My Grades</Link>
          </div>
        </section>
      </AppLayout>
    )
  }

  if (!data) {
    return (
      <AppLayout role="student" title="Grade Details">
        <section className="panel"><p className="empty">Loading grades…</p></section>
      </AppLayout>
    )
  }

  const classSummary = data.classes?.find(c => c.classId === classId)
  const classCourses = (data.courses ?? []).filter(c => c.className?.toLowerCase() === classSummary?.className?.toLowerCase())
  const classExams = (data.testsAndExams ?? []).filter(t => t.className?.toLowerCase() === classSummary?.className?.toLowerCase())

  const assignments = []
  const quizzes = []
  
  classCourses.forEach(course => {
    course.items.forEach(item => {
      if (item.kind === 'ASSIGNMENT') {
        assignments.push({ ...item, topicName: course.courseName })
      } else if (item.kind === 'QUIZ') {
        quizzes.push({ ...item, topicName: course.courseName })
      }
    })
  })

  if (!classSummary) {
    return (
      <AppLayout role="student" title="Grade Details">
        <section className="panel">
          <div className="empty">
            <p className="field__error">Class not found or you are no longer enrolled.</p>
            <Link to="/student/grades" className="btn btn--ghost">Back to My Grades</Link>
          </div>
        </section>
      </AppLayout>
    )
  }

  return (
    <AppLayout role="student" title={classSummary.className}>
      <Link to="/student/grades" className="back">← Back to My Grades</Link>

      {/* FIXED: Using clean CSS classes instead of inline styles */}
      <div className="grade-summary-bar">
        <div className="grade-stat">
          <span className="grade-stat__label">Assignments</span>
          <strong className="grade-stat__value grade-stat--indigo">{fmtPct(classSummary.assignmentPct)}</strong>
        </div>
        <div className="grade-stat">
          <span className="grade-stat__label">Quizzes</span>
          <strong className="grade-stat__value grade-stat--indigo">{fmtPct(classSummary.quizPct)}</strong>
        </div>
        <div className="grade-stat">
          <span className="grade-stat__label">Exams</span>
          <strong className="grade-stat__value grade-stat--teal">{fmtPct(classSummary.examPct)}</strong>
        </div>
        <div className="grade-stat grade-stat--overall">
          <span className="grade-stat__label">Overall</span>
          <strong className="grade-stat__value">{fmtPct(classSummary.overall)}</strong>
        </div>
      </div>

      <div className="panel">
        <h3 className="subhead subhead--assignments">Assignments ({assignments.length})</h3>
        {assignments.length === 0 ? (
          <p className="empty">No assignments have been graded yet.</p>
        ) : (
          <ul className="rows">
            {assignments.map(a => (
              <li key={a.itemId}>
                <div>
                  <strong>{a.title}</strong>
                  <small>{a.topicName}</small>
                </div>
                <div className="rows__end">
                  <span>{a.score}/{a.totalMarks} · {pct(a.score, a.totalMarks)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}

        <h3 className="subhead subhead--quizzes">Quizzes ({quizzes.length})</h3>
        {quizzes.length === 0 ? (
          <p className="empty">No quizzes have been graded yet.</p>
        ) : (
          <ul className="rows">
            {quizzes.map(q => (
              <li key={q.itemId}>
                <div>
                  <strong>{q.title}</strong>
                  <small>{q.topicName}</small>
                </div>
                <div className="rows__end">
                  <span>{q.score}/{q.totalMarks} · {pct(q.score, q.totalMarks)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}

        <h3 className="subhead subhead--exams">Exams ({classExams.length})</h3>
        {classExams.length === 0 ? (
          <p className="empty">No exams have been released yet.</p>
        ) : (
          <ul className="rows">
            {classExams.map(t => (
              <li key={t.quizId}>
                <div>
                  <strong>{t.title}</strong>
                  <small>Class Exam</small>
                </div>
                <div className="rows__end">
                  {t.released && t.score != null
                    ? <span>{t.score}/{t.totalMarks} · {pct(t.score, t.totalMarks)}</span>
                    : <span className="badge">Awaiting release</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  )
}