import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import { getCourse } from '../../api/courses'
import { listAssignmentsByCourse } from '../../api/assignments'
import { listPublishedQuizzesByCourse } from '../../api/quizzes'
import { getMySubmission } from '../../api/submissions'
import { getMyGrades } from '../../api/student'
import { useAuth } from '../../auth/AuthContext'
import '../../styles/teacher.css'
import '../../styles/student.css'

const TABS = ['Materials', 'Assignments', 'Quizzes']

const fmtDue = (v) => {
  if (!v) return '—'
  return new Date(v).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

const fileName = (url) => {
  try {
    const parts = decodeURIComponent(url).split('/')
    return parts[parts.length - 1]
  } catch {
    return url
  }
}

export default function StudentCourse() {
  const { id } = useParams()
  const { user } = useAuth()
  const [course, setCourse] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [mySubmissions, setMySubmissions] = useState({}) // assignmentId -> submission
  const [myAttempts, setMyAttempts] = useState({}) // quizId -> grade item
  const [tab, setTab] = useState('Materials')
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    setError('')
    Promise.all([
      getCourse(id),
      listAssignmentsByCourse(id),
      listPublishedQuizzesByCourse(id),
      getMyGrades(),
    ])
      .then(async ([c, asg, qs, grades]) => {
        if (!alive) return
        setCourse(c)
        setAssignments(asg)
        setQuizzes(qs)

        // Fetch the student's own submission for each assignment (parallel).
        const subResults = await Promise.all(
          asg.map((a) => getMySubmission(a.id).catch(() => null))
        )
        if (!alive) return
        const subMap = {}
        asg.forEach((a, i) => { if (subResults[i]) subMap[a.id] = subResults[i] })
        setMySubmissions(subMap)

        // Pull quiz summaries from the grades payload.
        const courseGrades = (grades.courses ?? []).find((g) => g.courseId === id)
        const attemptMap = {}
        ;(courseGrades?.items ?? []).forEach((it) => {
          if (it.kind === 'QUIZ') attemptMap[it.itemId] = it
        })
        setMyAttempts(attemptMap)
      })
      .catch((err) => alive && setError(err.message))
    return () => { alive = false }
  }, [id, user])

  if (error) {
    return (
      <AppLayout role="student" title="Topic">
        <section className="panel">
          <div className="empty">
            <p className="field__error" role="alert">{error}</p>
            <Link to="/student" className="btn btn--ghost">Back to my topics</Link>
          </div>
        </section>
      </AppLayout>
    )
  }

  if (!course) {
    return (
      <AppLayout role="student" title="Topic">
        <section className="panel"><p className="empty">Loading topic…</p></section>
      </AppLayout>
    )
  }

  const materials = course.attachmentUrls ?? []

  return (
    <AppLayout role="student" title={course.title}>
      <Link to="/student" className="back">← My topics</Link>

      <div className="page-head">
        <p>{course.className}{course.teacherName ? ` · ${course.teacherName}` : ''}</p>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`tabs__tab ${tab === t ? 'is-active' : ''}`}
            onClick={() => setTab(t)}
          >{t}</button>
        ))}
      </div>

      <section className="panel" role="tabpanel">
        {tab === 'Materials' && (
          <>
            <div className="panel__head"><h2>Materials</h2></div>
            {course.description && <p className="sub-text">{course.description}</p>}
            {materials.length === 0 ? (
              <p className="empty">No materials yet.</p>
            ) : (
              <ul className="rows">
                {materials.map((url) => (
                  <li key={url}>
                    <div><strong>{fileName(url)}</strong></div>
                    <div className="rows__end">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--sm">Open</a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {tab === 'Assignments' && (
          <>
            <div className="panel__head"><h2>Assignments</h2></div>
            {assignments.length === 0 ? (
              <p className="empty">No assignments yet.</p>
            ) : (
              <ul className="rows">
                {assignments.map((a) => {
                  const sub = mySubmissions[a.id]
                  const overdue = a.dueDate && new Date(a.dueDate) < new Date()
                  return (
                    <li key={a.id}>
                      <div>
                        <strong>{a.title}</strong>
                        <small className={overdue && !sub ? 'late' : ''}>
                          Due {fmtDue(a.dueDate)} · {a.totalMarks} marks
                        </small>
                      </div>
                      <div className="rows__end">
                        {sub?.graded ? (
                          <span className="badge badge--live">{sub.grade}/{a.totalMarks}</span>
                        ) : sub ? (
                          <span className="badge badge--test">Submitted</span>
                        ) : overdue ? (
                          <span className="badge badge--warn">Past due</span>
                        ) : (
                          <span className="badge">To do</span>
                        )}
                        <Link to={`/student/courses/${course.id}/assignments/${a.id}`} className="btn btn--ghost btn--sm">
                          {sub?.graded ? 'View' : sub ? 'View / edit' : 'Open'}
                        </Link>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        )}

        {tab === 'Quizzes' && (
          <>
            <div className="panel__head"><h2>Quizzes</h2></div>
            {quizzes.length === 0 ? (
              <p className="empty">No quizzes yet.</p>
            ) : (
              <ul className="rows">
                {quizzes.map((q) => {
                  const my = myAttempts[q.id]
                  const attempted = Boolean(my)
                  return (
                    <li key={q.id}>
                      <div>
                        <strong>{q.title}</strong>
                        <small>
                          {q.questions?.length ?? 0} questions
                          {q.timeLimitMinutes ? ` · ${q.timeLimitMinutes} min` : ''}
                        </small>
                      </div>
                      <div className="rows__end">
                        {attempted && my.score != null ? (
                          <span className="badge badge--live">{my.score}/{my.totalMarks}</span>
                        ) : attempted ? (
                          <span className="badge">Awaiting grade</span>
                        ) : (
                          <span className="badge">Not attempted</span>
                        )}
                        <Link
                          to={`/student/quizzes/${q.id}/take`}
                          className="btn btn--ghost btn--sm">
                          {attempted ? 'View' : 'Open'}
                        </Link>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        )}
      </section>
    </AppLayout>
  )
}