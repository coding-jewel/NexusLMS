import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import Modal from '../../components/Modal'
import { listCourses, createCourse, deleteCourse } from '../../api/courses'
import { listClasses } from '../../api/classes'
import { useAuth } from '../../auth/AuthContext'
import '../../styles/teacher.css'

export default function TeacherCourses() {
  const { user } = useAuth()
  const [data, setData] = useState(null) // { courses, myClasses }
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', classId: '', description: '' })
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  const [confirm, setConfirm] = useState(null) // the course being deleted
  const [confirmError, setConfirmError] = useState('')

  const load = () => {
    setError('')
    setData(null)
    Promise.all([listCourses(), listClasses()])
      .then(([courses, classes]) => {
        const mine = new Set(user?.classIds ?? [])
        setData({ courses, myClasses: classes.filter((c) => mine.has(c.id)) })
      })
      .catch((err) => setError(err.message))
  }
  useEffect(() => { load() }, [])

  const openCreate = () => {
    setForm({ title: '', classId: data?.myClasses[0]?.id ?? '', description: '' })
    setFormError('')
    setOpen(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError('')
    setBusy(true)
    try {
      const created = await createCourse({
        classId: form.classId,
        title: form.title.trim(),
        description: form.description.trim() || null,
      })
      setData({ ...data, courses: [...data.courses, created] })
      setOpen(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const openConfirm = (course) => { setConfirmError(''); setConfirm(course) }

  const runDelete = async () => {
    setConfirmError('')
    setBusy(true)
    try {
      await deleteCourse(confirm.id)
      setData({ ...data, courses: data.courses.filter((c) => c.id !== confirm.id) })
      setConfirm(null)
    } catch (err) {
      setConfirmError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppLayout role="teacher" title="My topics">
      <div className="page-head">
        <p>Topics are the notes and materials you publish for a class.</p>
        <button className="btn btn--primary" onClick={openCreate} disabled={!data || data.myClasses.length === 0}>Create topic</button>
      </div>

      {error ? (
        <section className="panel">
          <div className="empty">
            <p className="field__error" role="alert">{error}</p>
            <button className="btn btn--ghost" onClick={load}>Try again</button>
          </div>
        </section>
      ) : data === null ? (
        <section className="panel"><p className="empty">Loading topics…</p></section>
      ) : data.myClasses.length === 0 ? (
        <section className="panel">
          <p className="empty">You aren’t assigned to any class yet. Ask your admin to add you before creating a topic.</p>
        </section>
      ) : data.courses.length === 0 ? (
        <section className="panel">
          <p className="empty">No topics yet. Create your first one to get started.</p>
        </section>
      ) : (
        <div className="course-grid">
          {data.courses.map((c, i) => (
            <div key={c.id} className="course-card">
              <Link to={`/teacher/courses/${c.id}`} className="course-card__link">
                <div className={`course-card__top tone-${i % 4}`}>
                  <h2>{c.title}</h2>
                  <span>{c.className}</span>
                </div>
              </Link>
              <div className="course-card__body">
                <p>
                  {c.assignmentCount} {c.assignmentCount === 1 ? 'assignment' : 'assignments'} ·{' '}
                  {c.quizCount} {c.quizCount === 1 ? 'quiz' : 'quizzes'}
                </p>
                <div className="row-actions">
                  <span className={`badge ${c.published ? 'badge--live' : ''}`}>{c.published ? 'Published' : 'Draft'}</span>
                  <button className="btn btn--ghost btn--sm btn--danger" onClick={() => openConfirm(c)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <Modal title="Create topic" onClose={() => setOpen(false)}>
          <form className="modal__form" onSubmit={handleCreate}>
            <label className="field">
              <span>Topic title</span>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Algebra Notes" required />
            </label>
            <label className="field">
              <span>Class</span>
              <select className="select" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} required>
                {data.myClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Description</span>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
            </label>
            <p className="hint">New topics start as drafts. Students see them once you publish.</p>
            {formError && <p className="field__error" role="alert">{formError}</p>}
            <button className="btn btn--primary btn--block" type="submit" disabled={busy || !form.title.trim()}>
              {busy ? 'Creating…' : 'Create topic'}
            </button>
          </form>
        </Modal>
      )}

      {confirm && (
        <Modal title="Delete this topic?" onClose={() => setConfirm(null)}>
          <div className="modal__form">
            <p>Delete <strong>{confirm.title}</strong>? Refused if it still has assignments or quizzes. Remove them first.</p>
            {confirmError && <p className="field__error" role="alert">{confirmError}</p>}
            <div className="confirm-actions">
              <button className="btn btn--ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn btn--danger-solid" onClick={runDelete} disabled={busy}>
                {busy ? 'Deleting…' : 'Delete topic'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AppLayout>
  )
}