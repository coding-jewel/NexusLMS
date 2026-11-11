import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import { listCourses } from '../../api/courses'
import { listClasses } from '../../api/classes'
import { useAuth } from '../../auth/AuthContext'
import '../../styles/teacher.css'

// The palette: Bright Purple, Teal, Dark Navy, Red, Brown
const CARD_COLORS = [
  '#4000ff', 
  '#0f766e', 
  '#1e1b4b', 
  '#dc2626', 
  '#92400e', 
]

export default function TeacherClasses() {
  const { user } = useAuth()
  const [data, setData] = useState(null) // { courses, classes }
  const [error, setError] = useState('')

  const load = () => {
    setError('')
    setData(null)
    Promise.all([listCourses(), listClasses()])
      .then(([courses, classes]) => setData({ courses, classes }))
      .catch((err) => setError(err.message))
  }
  useEffect(() => { load() }, [])

  const groups = useMemo(() => {
    if (!data) return []
    const mine = new Set(user?.classIds ?? [])
    const relevant = data.classes.filter(
      (c) => mine.has(c.id) || data.courses.some((co) => co.classId === c.id)
    )
    return relevant
      .map((c) => ({
        ...c,
        courses: data.courses.filter((co) => co.classId === c.id),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  }, [data, user])

  return (
    <AppLayout role="teacher" title="My Classes">
      <div className="page-head">
        <p>Select a class to view its topics, gradebook, and people.</p>
      </div>

      {error ? (
        <section className="panel">
          <div className="empty">
            <p className="field__error" role="alert">{error}</p>
            <button className="btn btn--ghost" onClick={load}>Try again</button>
          </div>
        </section>
      ) : data === null ? (
        <section className="panel"><p className="empty">Loading classes…</p></section>
      ) : groups.length === 0 ? (
        <section className="panel">
          <p className="empty">You aren't assigned to any class yet. Ask your admin to add you.</p>
        </section>
      ) : (
        <div className="class-grid">
          {/* FIXED: Added `i` to the map function and used the modulo operator */}
          {groups.map((g, i) => (
            <Link key={g.id} to={`/teacher/classes/${g.id}`} className="class-card">
              <div 
                className="class-card__top" 
                style={{ backgroundColor: CARD_COLORS[i % CARD_COLORS.length] }}
              >
                <h2>{g.name}</h2>
              </div>
              <div className="class-card__body">
                <span>{g.studentCount ?? 0} {g.studentCount === 1 ? 'student' : 'students'}</span>
                <span>{g.courses.length} {g.courses.length === 1 ? 'topic' : 'topics'}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  )
}