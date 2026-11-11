import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import { listMyClasses } from '../../api/student'
import { getClassPeople } from '../../api/classes'
import { listPublishedTestsAndExamsByClass } from '../../api/quizzes'
import { listMyAttempts } from '../../api/quizAttempts'
import { TypeBadge } from '../../components/Badges'
import '../../styles/student.css'

const TABS = ['Topics', 'Exams', 'People']

export default function StudentClassDetail() {
  const { classId } = useParams()
  const [classData, setClassData] = useState(null)
  const [people, setPeople] = useState(null)
  const [tab, setTab] = useState('Topics')
  const [error, setError] = useState('')

  const [assessments, setAssessments] = useState(null)
  const [myAttempts, setMyAttempts] = useState({})

  useEffect(() => {
    setError('')
    Promise.all([
      listMyClasses(),
      getClassPeople(classId)
    ])
      .then(([classes, classPeople]) => {
        const found = classes.find(c => c.id === classId)
        if (!found) throw new Error("Class not found or you are no longer enrolled.")
        
        setClassData(found)
        setPeople(classPeople)
      })
      .catch(err => setError(err.message))
  }, [classId])

  useEffect(() => {
    if (tab === 'Exams') {
      Promise.all([listPublishedTestsAndExamsByClass(classId), listMyAttempts()])
        .then(([list, attempts]) => {
          setAssessments(list)
          const attemptMap = {}
          attempts.forEach(a => { attemptMap[a.quizId] = a })
          setMyAttempts(attemptMap)
        })
        .catch(console.error)
    }
  }, [tab, classId])

  if (error) {
    return (
      <AppLayout role="student" title="Class">
        <section className="panel">
          <div className="empty">
            <p className="field__error" role="alert">{error}</p>
            <Link to="/student/classes" className="btn btn--ghost">Back to classes</Link>
          </div>
        </section>
      </AppLayout>
    )
  }

  if (!classData) {
    return (
      <AppLayout role="student" title="Class">
        <section className="panel"><p className="empty">Loading class…</p></section>
      </AppLayout>
    )
  }

  const topics = classData.topics || []
  const studentCount = people?.students?.length ?? 0
  const teacherCount = people?.teachers?.length ?? 0

  return (
    <AppLayout role="student" title={classData.name}>
      <Link to="/student/classes" className="back">← My classes</Link>

      <div className="page-head">
        <p>{topics.length} {topics.length === 1 ? 'topic' : 'topics'} published · {studentCount} {studentCount === 1 ? 'student' : 'students'}</p>
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
        {tab === 'Topics' && (
          <>
            <div className="panel__head"><h2>Topics</h2></div>
            {topics.length === 0 ? (
              <p className="empty">No topics have been published for this class yet.</p>
            ) : (
              <div className="course-grid" style={{ marginTop: '1rem' }}>
                {topics.map((t, i) => (
                  <Link key={t.id} to={`/student/courses/${t.id}`} className="course-card">
                    <div className={`course-card__top tone-${i % 4}`}>
                      <h2>{t.title}</h2>
                      <span>{t.teacherName}</span>
                    </div>
                    <div className="course-card__body">
                      <p>
                        {t.assignmentCount} {t.assignmentCount === 1 ? 'assignment' : 'assignments'} ·{' '}
                        {t.quizCount} {t.quizCount === 1 ? 'quiz' : 'quizzes'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'Exams' && (
          <>
            <div className="panel__head"><h2>Exams</h2></div>
            {assessments === null ? (
              <p className="empty">Loading assessments…</p>
            ) : assessments.length === 0 ? (
              <p className="empty">No exams have been published for this class yet.</p>
            ) : (
              <div className="table-wrap">
                {/* FIXED: Added className="table-exams" */}
                <table className="table-exams">
                  <thead>
                    <tr><th>Title</th><th>Type</th><th>Questions</th><th>Time</th><th>Status</th><th /></tr>
                  </thead>
                  <tbody>
                    {assessments.map((q) => {
                      const my = myAttempts[q.id]
                      const attempted = Boolean(my)
                      return (
                        <tr key={q.id}>
                          <td><strong>{q.title}</strong></td>
                          <td><TypeBadge category={q.category} /></td>
                          <td>{q.questions?.length ?? 0}</td>
                          <td>{q.timeLimitMinutes ? `${q.timeLimitMinutes} min` : '—'}</td>
                          <td>
                            {attempted && my.graded && q.resultsReleased ? (
                              <span className="badge badge--live">{my.score}/{q.totalMarks}</span>
                            ) : attempted ? (
                              <span className="badge">Awaiting grade</span>
                            ) : (
                              <span className="badge">Not attempted</span>
                            )}
                          </td>
                          <td>
                            <Link to={`/student/quizzes/${q.id}/take`} className="btn btn--ghost btn--sm">
                              {attempted ? 'View' : 'Open'}
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === 'People' && (
          <>
            <div className="panel__head"><h2>People</h2></div>
            
            <h3 className="subhead">Teachers ({teacherCount})</h3>
            {teacherCount > 0 ? (
              <ul className="rows">
                {people.teachers.map((t) => (
                  <li key={t.id}><strong>{t.name}</strong><span>{t.email}</span></li>
                ))}
              </ul>
            ) : (
              <p className="empty">No teacher in this class yet.</p>
            )}
            
            <h3 className="subhead">Students ({studentCount})</h3>
            {studentCount === 0 ? (
              <p className="empty">No students in this class yet.</p>
            ) : (
              <ul className="rows">
                {people.students.map((s) => (
                  <li key={s.id}><strong>{s.name}</strong><span>{s.email}</span></li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </AppLayout>
  )
}