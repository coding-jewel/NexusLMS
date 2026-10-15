import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import { listCourses } from '../../api/courses'
import { listClasses } from '../../api/classes'
import { useAuth } from '../../auth/AuthContext'
import '../../styles/teacher.css'

// Groups the teacher's courses under the classes they teach. A class the teacher is assigned
// to but has no courses in still appears, with a prompt to create one.
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
    // Show any class I'm assigned to, plus any class I have a course in (in case I was removed later).
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
        <p>Each class you teach, with the topics you've created in it.</p>
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
        groups.map((g) => (
          <section key={g.id} className="panel">
            <div className="panel__head">
              <h2>{g.name}</h2>
              <span className="muted-text">{g.studentCount ?? 0} {g.studentCount === 1 ? 'student' : 'students'}</span>
            </div>
            {g.courses.length === 0 ? (
              <p className="empty">No courses yet. <Link to="/teacher/courses">Create one</Link>.</p>
            ) : (
              <ul className="rows">
                {g.courses.map((c) => (
                  <li key={c.id}>
                    <div>
                      <strong>{c.title}</strong>
                      <small>{c.assignmentCount} {c.assignmentCount === 1 ? 'assignment' : 'assignments'} · {c.quizCount} {c.quizCount === 1 ? 'test' : 'tests'}</small>
                    </div>
                    <div className="rows__end">
                      <span className={`badge ${c.published ? 'badge--live' : ''}`}>{c.published ? 'Published' : 'Draft'}</span>
                      <Link to={`/teacher/courses/${c.id}`} className="btn btn--ghost btn--sm">Open</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))
      )}
    </AppLayout>
  )
}