import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import { listMyClasses } from '../../api/student'
import '../../styles/student.css'

export default function StudentTopics() {
  const [classes, setClasses] = useState(null)
  const [error, setError] = useState('')

  const load = () => {
    setError('')
    setClasses(null)
    listMyClasses().then(setClasses).catch((err) => setError(err.message))
  }
  useEffect(() => { load() }, [])

  return (
    <AppLayout role="student" title="My topics">
      <div className="page-head">
        <p>Your classes and topics.</p>
      </div>

      {error ? (
        <section className="panel">
          <div className="empty">
            <p className="field__error" role="alert">{error}</p>
            <button className="btn btn--ghost" onClick={load}>Try again</button>
          </div>
        </section>
      ) : classes === null ? (
        <section className="panel"><p className="empty">Loading classes…</p></section>
      ) : classes.length === 0 ? (
        <section className="panel">
          <p className="empty">
            You aren’t enrolled in any classes yet. Ask your teacher for a class code, then join from your dashboard.
          </p>
        </section>
      ) : (
        <div className="class-sections">
          {classes.map((cls) => (
            <section key={cls.id}>
              <h2 className="class-heading">{cls.name}</h2>
              {cls.topics.length === 0 ? (
                <p className="muted-text" style={{ padding: '0 0 1rem' }}>No topics published yet.</p>
              ) : (
                <div className="course-grid">
                  {cls.topics.map((t, i) => (
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
            </section>
          ))}
        </div>
      )}
    </AppLayout>
  )
}