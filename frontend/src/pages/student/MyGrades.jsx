import { useEffect, useMemo, useState } from 'react'
import AppLayout from '../../components/AppLayout'
import { getMyGrades } from '../../api/student'
import '../../styles/teacher.css'
import '../../styles/student.css'

const pct = (a, b) => (b > 0 ? `${Math.round((a / b) * 100)}%` : '—')

export default function MyGrades() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [itemTab, setItemTab] = useState('ALL') // ALL | ASSIGNMENT | QUIZ
  const [classTab, setClassTab] = useState('ALL') // ALL | TEST | EXAM

  const load = () => {
    setError('')
    setData(null)
    getMyGrades().then(setData).catch((err) => setError(err.message))
  }
  useEffect(() => { load() }, [])

  const coursesWithFilteredItems = useMemo(() => {
    if (!data) return []
    return data.courses
      .map((c) => ({
        ...c,
        items: itemTab === 'ALL' ? c.items : c.items.filter((it) => it.kind === itemTab),
      }))
      .filter((c) => c.items.length > 0)
  }, [data, itemTab])

  const filteredClassResults = useMemo(() => {
    if (!data) return []
    return classTab === 'ALL'
      ? data.testsAndExams
      : data.testsAndExams.filter((t) => t.category === classTab)
  }, [data, classTab])

  const hasAnyCourseItems = (data?.courses ?? []).some((c) => c.items.length > 0)
  const hasAnyClassResults = (data?.testsAndExams ?? []).length > 0

  return (
    <AppLayout role="student" title="My grades">
      <div className="page-head">
        <p>Your scores on graded work. Your teachers work out the overall.</p>
      </div>

      {error ? (
        <section className="panel">
          <div className="empty">
            <p className="field__error" role="alert">{error}</p>
            <button className="btn btn--ghost" onClick={load}>Try again</button>
          </div>
        </section>
      ) : data === null ? (
        <section className="panel"><p className="empty">Loading grades…</p></section>
      ) : !hasAnyCourseItems && !hasAnyClassResults ? (
        <section className="panel"><p className="empty">Nothing graded yet. Check back once your teachers have marked your work.</p></section>
      ) : (
        <>
          {hasAnyCourseItems && (
            <>
              <h2 className="class-heading">Classwork</h2>
              <div className="filters">
                <div className="seg" role="group" aria-label="Filter classwork">
                  <button className={itemTab === 'ALL' ? 'is-active' : ''} onClick={() => setItemTab('ALL')}>All</button>
                  <button className={itemTab === 'ASSIGNMENT' ? 'is-active' : ''} onClick={() => setItemTab('ASSIGNMENT')}>Assignments</button>
                  <button className={itemTab === 'QUIZ' ? 'is-active' : ''} onClick={() => setItemTab('QUIZ')}>Quizzes</button>
                </div>
              </div>

              {coursesWithFilteredItems.length === 0 ? (
                <section className="panel"><p className="empty">No {itemTab === 'QUIZ' ? 'quizzes' : 'assignments'} graded yet.</p></section>
              ) : coursesWithFilteredItems.map((c) => {
                const graded = c.items.filter((x) => x.score != null)
                const earned = graded.reduce((n, x) => n + x.score, 0)
                const possible = graded.reduce((n, x) => n + x.totalMarks, 0)
                return (
                  <section key={c.courseId} className="panel grade-course">
                    <div className="panel__head">
                      <h2>{c.courseName}</h2>
                      <span className="muted-text">{c.className}</span>
                    </div>
                    <ul className="rows">
                      {c.items.map((x) => (
                        <li key={x.itemId}>
                          <div>
                            <strong>{x.title}</strong>
                            <small>{x.kind === 'QUIZ' ? 'Quiz' : 'Assignment'}</small>
                          </div>
                          <div className="rows__end">
                            <span>{x.score}/{x.totalMarks} · {pct(x.score, x.totalMarks)}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                    {possible > 0 && (
                      <div className="subtotal">
                        <span>Total on graded work</span>
                        <strong>{earned}/{possible} · {pct(earned, possible)}</strong>
                      </div>
                    )}
                  </section>
                )
              })}
            </>
          )}

          {hasAnyClassResults && (
            <>
              <h2 className="class-heading" style={{ marginTop: hasAnyCourseItems ? '2rem' : 0 }}>Tests &amp; Exams</h2>
              <div className="filters">
                <div className="seg" role="group" aria-label="Filter tests and exams">
                  <button className={classTab === 'ALL' ? 'is-active' : ''} onClick={() => setClassTab('ALL')}>All</button>
                  <button className={classTab === 'TEST' ? 'is-active' : ''} onClick={() => setClassTab('TEST')}>Tests</button>
                  <button className={classTab === 'EXAM' ? 'is-active' : ''} onClick={() => setClassTab('EXAM')}>Exams</button>
                </div>
              </div>

              <section className="panel">
                {filteredClassResults.length === 0 ? (
                  <p className="empty">No {classTab === 'EXAM' ? 'exams' : 'tests'} recorded yet.</p>
                ) : (
                  <ul className="rows">
                    {filteredClassResults.map((t) => (
                      <li key={t.quizId}>
                        <div>
                          <strong>{t.title}</strong>
                          <small>{t.className} · {t.category === 'EXAM' ? 'Exam' : 'Test'}</small>
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
              </section>
            </>
          )}
        </>
      )}
    </AppLayout>
  )
}