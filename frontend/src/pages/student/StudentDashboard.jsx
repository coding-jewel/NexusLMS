import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import Modal from '../../components/Modal'
import { getMyTodo, listMyTopics, joinClass } from '../../api/student'
import { useAuth } from '../../auth/AuthContext'
import '../../styles/student.css'

const fmtDue = (v) => {
  if (!v) return ''
  return new Date(v).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

export default function StudentDashboard() {
  const { user, refreshUser } = useAuth()
  const [data, setData] = useState(null) // { todo, topics }
  const [error, setError] = useState('')

  const [joinOpen, setJoinOpen] = useState(false)
  const [code, setCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => {
    setError('')
    setData(null)
    Promise.all([getMyTodo(), listMyTopics()])
      .then(([todo, topics]) => setData({ todo, topics }))
      .catch((err) => setError(err.message))
  }
  useEffect(() => { load() }, [])

  const handleJoin = async (e) => {
    e.preventDefault()
    setJoinError('')
    setBusy(true)
    try {
      await joinClass(code.trim())
      await refreshUser()
      setJoinOpen(false)
      load()
    } catch (err) {
      setJoinError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const classCount = user?.classIds?.length ?? 0
  const topicCount = data?.topics?.length ?? 0

  return (
    <AppLayout role="student" title="Overview">
      <div className="page-head">
        <p>Welcome back, {user?.name?.split(' ')[0]}.</p>
        <button className="btn btn--primary" onClick={() => { setCode(''); setJoinError(''); setJoinOpen(true) }}>
          Join another class
        </button>
      </div>

      {error ? (
        <section className="panel">
          <div className="empty">
            <p className="field__error" role="alert">{error}</p>
            <button className="btn btn--ghost" onClick={load}>Try again</button>
          </div>
        </section>
      ) : !data ? (
        <section className="panel"><p className="empty">Loading dashboard…</p></section>
      ) : (
        <>
          <section className="stats" aria-label="Your totals">
            <div className="stat">
              <span className="stat__label">Classes</span>
              <span className="stat__value">{classCount}</span>
            </div>
            <div className="stat">
              <span className="stat__label">Topics</span>
              <span className="stat__value">{topicCount}</span>
            </div>
            <div className="stat">
              <span className="stat__label">To do</span>
              <span className={`stat__value ${data.todo.length > 0 ? 'stat__value--warn' : ''}`}>
                {data.todo.length}
              </span>
            </div>
          </section>

          <div className="student-home">
            {/* Left column: recent topics */}
            <div className="class-sections">
              {data.topics.length === 0 ? (
                <section className="panel">
                  <p className="empty">You aren’t enrolled in any topics yet.</p>
                </section>
              ) : (
                <>
                  <div className="panel__head">
                    <h2>Recent topics</h2>
                    <Link to="/student/topics" className="btn btn--ghost btn--sm">View all</Link>
                  </div>
                  <div className="course-grid">
                    {data.topics.slice(0, 4).map((t, i) => (
                      <Link key={t.id} to={`/student/courses/${t.id}`} className="course-card">
                        <div className={`course-card__top tone-${i % 4}`}>
                          <h2>{t.title}</h2>
                          <span>{t.teacherName}</span>
                        </div>
                        <div className="course-card__body">
                          <p>{t.className}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Right column: To do list */}
            <aside className="panel due">
              <h2>To do</h2>
              {data.todo.length === 0 ? (
                <p className="empty">You’re all caught up.</p>
              ) : (
                <ul className="due__list">
                  {data.todo.map((item) => {
                    const to = item.kind === 'ASSIGNMENT'
                      ? `/student/courses/${item.courseId}/assignments/${item.id}`
                      : `/student/quizzes/${item.id}/take`
                    return (
                      <li key={`${item.kind}-${item.id}`}>
                        <Link to={to}>
                          <strong>{item.title}</strong>
                          <small className={item.overdue ? 'late' : ''}>
                            {item.kind === 'ASSIGNMENT' && item.dueDate && `Due ${fmtDue(item.dueDate)}`}
                            {item.kind === 'ASSIGNMENT' && !item.dueDate && 'No due date'}
                            {item.kind !== 'ASSIGNMENT' && `${item.kind === 'QUIZ' ? 'Quiz' : item.kind === 'TEST' ? 'Test' : 'Exam'} · ${item.className}`}
                          </small>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </aside>
          </div>
        </>
      )}

      {joinOpen && (
        <Modal title="Join another class" onClose={() => setJoinOpen(false)}>
          <form className="modal__form" onSubmit={handleJoin}>
            <label className="field">
              <span>Class code</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                placeholder="JSS-4K7Q"
                required
              />
            </label>
            <p className="hint">Ask your teacher for the class code if you don't have it.</p>
            {joinError && <p className="field__error" role="alert">{joinError}</p>}
            <button className="btn btn--primary btn--block" type="submit" disabled={busy || !code.trim()}>
              {busy ? 'Joining…' : 'Join class'}
            </button>
          </form>
        </Modal>
      )}
    </AppLayout>
  )
}