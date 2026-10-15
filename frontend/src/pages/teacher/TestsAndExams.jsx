import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import Modal from '../../components/Modal'
import { TypeBadge } from '../../components/Badges'
import { listMyTestsAndExams, setQuizReleased, deleteQuiz } from '../../api/quizzes'
import { listClasses } from '../../api/classes'
import '../../styles/teacher.css'

export default function TestsAndExams() {
  const [list, setList] = useState(null)
  const [classes, setClasses] = useState([])
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [filter, setFilter] = useState('ALL') // ALL | TEST | EXAM

  const [confirm, setConfirm] = useState(null) // the quiz being deleted
  const [confirmError, setConfirmError] = useState('')

  const load = () => {
    setError('')
    setList(null)
    Promise.all([listMyTestsAndExams(), listClasses()])
      .then(([quizzes, cls]) => { setList(quizzes); setClasses(cls) })
      .catch((err) => setError(err.message))
  }
  useEffect(() => { load() }, [])

  const className = (id) => classes.find((c) => c.id === id)?.name ?? 'Class'
  const visible = (list ?? []).filter((q) => filter === 'ALL' || q.category === filter)

  const toggleRelease = async (q) => {
    setBusyId(q.id)
    try {
      const updated = await setQuizReleased(q.id, !q.resultsReleased)
      setList(list.map((x) => (x.id === q.id ? updated : x)))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const openConfirm = (q) => { setConfirmError(''); setConfirm(q) }

  const runDelete = async () => {
    setConfirmError('')
    setBusyId(confirm.id)
    try {
      await deleteQuiz(confirm.id)
      setList(list.filter((x) => x.id !== confirm.id))
      setConfirm(null)
    } catch (err) {
      setConfirmError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <AppLayout role="teacher" title="Tests & Exams">
      <div className="page-head">
        <p>Tests and exams cover the whole class. Release results when you’re ready for students to see them.</p>
        <Link to="/teacher/quizzes/new" className="btn btn--primary">New test or exam</Link>
      </div>

      <section className="panel">
        {error ? (
          <div className="empty">
            <p className="field__error" role="alert">{error}</p>
            <button className="btn btn--ghost" onClick={load}>Try again</button>
          </div>
        ) : list === null ? (
          <p className="empty">Loading…</p>
        ) : list.length === 0 ? (
          <p className="empty">No tests or exams yet. Create your first one.</p>
        ) : (
          <>
            <div className="filters">
              <div className="seg" role="group" aria-label="Filter">
                <button className={filter === 'ALL' ? 'is-active' : ''} onClick={() => setFilter('ALL')}>All</button>
                <button className={filter === 'TEST' ? 'is-active' : ''} onClick={() => setFilter('TEST')}>Tests</button>
                <button className={filter === 'EXAM' ? 'is-active' : ''} onClick={() => setFilter('EXAM')}>Exams</button>
              </div>
              <span className="filters__count">
                {visible.length} {visible.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {visible.length === 0 ? (
              <p className="empty">No {filter === 'TEST' ? 'tests' : 'exams'} yet.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Title</th><th>Type</th><th>Class</th><th>Questions</th><th>Time</th><th>Status</th><th>Results</th><th /></tr>
                  </thead>
                  <tbody>
                    {visible.map((q) => (
                      <tr key={q.id}>
                        <td><strong>{q.title}</strong></td>
                        <td><TypeBadge category={q.category} /></td>
                        <td>{className(q.classId)}</td>
                        <td>{q.questions?.length ?? 0}</td>
                        <td>{q.timeLimitMinutes ? `${q.timeLimitMinutes} min` : '—'}</td>
                        <td>
                          <span className={`badge ${q.published ? 'badge--live' : ''}`}>
                            {q.published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="cell-wrap">
                          <button
                            className="btn btn--ghost btn--sm"
                            onClick={() => toggleRelease(q)}
                            disabled={busyId === q.id}
                          >
                            {q.resultsReleased ? 'Hide results' : 'Release results'}
                          </button>
                          <small className="sub">
                            {q.resultsReleased ? 'Students can see scores' : 'Hidden from students'}
                          </small>
                        </td>
                        <td className="cell-wrap">
                          <div className="row-actions">
                            <Link to={`/teacher/quizzes/${q.id}/edit`} className="btn btn--ghost btn--sm">Edit</Link>
                            <Link to={`/teacher/quizzes/${q.id}/mark`} className="btn btn--ghost btn--sm">Mark</Link>
                            <button className="btn btn--ghost btn--sm btn--danger" onClick={() => openConfirm(q)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>

      {confirm && (
        <Modal title="Delete this quiz?" onClose={() => setConfirm(null)}>
          <div className="modal__form">
            <p>Delete <strong>{confirm.title}</strong>? Refused if any student has already attempted it.</p>
            {confirmError && <p className="field__error" role="alert">{confirmError}</p>}
            <div className="confirm-actions">
              <button className="btn btn--ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn btn--danger-solid" onClick={runDelete} disabled={busyId === confirm.id}>
                {busyId === confirm.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AppLayout>
  )
}