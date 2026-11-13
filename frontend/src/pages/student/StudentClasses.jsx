import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import { listMyClasses } from '../../api/student'
import '../../styles/student.css'

// Using the same color palette as the teacher side
const CARD_COLORS = [
  '#4000ff', 
  '#0f766e', 
  '#1e1b4b', 
  '#dc2626', 
  '#92400e',
]

const getCardColor = (name) => {
  if (!name) return CARD_COLORS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length]
}

export default function StudentClasses() {
  const [classes, setClasses] = useState(null)
  const [error, setError] = useState('')

  const load = () => {
    setError('')
    setClasses(null)
    listMyClasses().then(setClasses).catch((err) => setError(err.message))
  }
  useEffect(() => { load() }, [])

  return (
    <AppLayout role="student" title="My Classes">
      <div className="page-head">
        <p>Select a class to see your topics and assignments.</p>
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
            You aren’t enrolled in any classes yet. Ask your school for a class code, then join from your Overview page.
          </p>
        </section>
      ) : (
        <div className="class-grid">
          {classes.map((cls) => (
            <Link key={cls.id} to={`/student/classes/${cls.id}`} className="class-card">
              <div 
                className="class-card__top" 
                style={{ backgroundColor: getCardColor(cls.name) }}
              >
                <h2>{cls.name}</h2>
              </div>
              <div className="class-card__body">
                <span>{cls.topics?.length ?? 0} {cls.topics?.length === 1 ? 'topic' : 'topics'}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  )
}