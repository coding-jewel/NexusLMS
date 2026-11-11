import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import { getMyGrades } from '../../api/student'
import '../../styles/teacher.css'
import '../../styles/student.css'

const pct = (a) => (a != null ? `${Math.round(a)}%` : '—')

export default function MyGrades() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const load = () => {
    setError('')
    setData(null)
    getMyGrades().then(setData).catch((err) => setError(err.message))
  }
  useEffect(() => { load() }, [])

  return (
    <AppLayout role="student" title="My grades">
      <div className="page-head">
        <p>Your overall performance across all classes.</p>
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
      ) : (data.classes ?? []).length === 0 ? (
        <section className="panel">
          <p className="empty">You aren't enrolled in any classes yet.</p>
        </section>
      ) : (
        <div className="class-grid">
          {data.classes.map((cls, i) => (
            <div key={cls.classId} className="class-card">
              <div className={`class-card__top tone-${i % 4}`}>
                <h2>{cls.className}</h2>
              </div>
              
              {/* FIXED: Using clean CSS classes */}
              <div className="grade-card-body">
                
                <div className="grade-card-summary">
                  <span className="muted-text">Overall</span>
                  <span className="grade-card-summary__value">{pct(cls.overall)}</span>
                </div>

                <div className="grade-card-stats">
                  <div>
                    <span className="grade-stat__label">Assign</span>
                    <strong className="grade-stat--indigo">{pct(cls.assignmentPct)}</strong>
                  </div>
                  <div>
                    <span className="grade-stat__label">Quizzes</span>
                    <strong className="grade-stat--indigo">{pct(cls.quizPct)}</strong>
                  </div>
                  <div>
                    <span className="grade-stat__label">Exams</span>
                    <strong className="grade-stat--teal">{pct(cls.examPct)}</strong>
                  </div>
                </div>

                <div className="grade-card-method">
                  {cls.gradingMethod === 'WEIGHTED' 
                    ? `Grading: Weighted (${cls.assignmentWeight}% / ${cls.quizWeight}% / ${cls.examWeight}%)`
                    : 'Grading: Raw Points'}
                </div>

                <Link to={`/student/grades/${cls.classId}`} className="btn btn--ghost btn--block">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}