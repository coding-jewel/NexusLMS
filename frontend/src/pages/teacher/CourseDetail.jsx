import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import Modal from '../../components/Modal'
import FilePicker from '../../components/FilePicker'
import {
  getCourse,
  publishCourse,
  unpublishCourse,
  getCoursePeople,
  uploadCourseAttachment,
  removeCourseAttachment,
} from '../../api/courses'
import {
  listAssignmentsByCourse,
  createAssignment,
  uploadAssignmentAttachment,
  deleteAssignment,
} from '../../api/assignments'
import { listQuizzesByCourse, deleteQuiz } from '../../api/quizzes'
import { getCourseGradebook } from '../../api/gradebook'
import '../../styles/teacher.css'

const TABS = ['Materials', 'Assignments', 'Quizzes', 'Gradebook', 'People']

const fmtDue = (v) => {
  if (!v) return '—'
  return new Date(v).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

const fileName = (url) => {
  try {
    const parts = decodeURIComponent(url).split('/')
    return parts[parts.length - 1]
  } catch {
    return url
  }
}

const minDueLocal = () => {
  const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
  return d.toISOString().slice(0, 16)
}

function GradebookView({ gb }) {
  if (!gb) return <p className="empty">Loading gradebook…</p>
  if (gb.rows.length === 0) return <p className="empty">No students in this class yet.</p>

  const totalItems = gb.groups.reduce((n, g) => n + g.items.length, 0)
  if (totalItems === 0) return <p className="empty">No assignments or quizzes yet. Add one to start recording grades.</p>

  return (
    <>
      <div className="panel__head">
        <h2>Gradebook</h2>
        <span className="muted-text">{gb.rows.length} {gb.rows.length === 1 ? 'student' : 'students'}</span>
      </div>
      <div className="table-wrap">
        <table className="gb">
          <thead>
            <tr>
              <th rowSpan={2}>Student</th>
              {gb.groups.map((g) => (
                <th key={g.key} colSpan={g.items.length + 1} className="gb__group">{g.label}</th>
              ))}
            </tr>
            <tr>
              {gb.groups.flatMap((g) => [
                ...g.items.map((it) => (
                  <th key={it.id}>{it.title}<small>/{it.totalMarks}</small></th>
                )),
                <th key={`${g.key}-sub`} className="gb__sub">Subtotal</th>,
              ])}
            </tr>
          </thead>
          <tbody>
            {gb.rows.map((r) => (
              <tr key={r.studentId}>
                <td><strong>{r.studentName}</strong></td>
                {gb.groups.flatMap((g) => [
                  ...g.items.map((it) => {
                    const v = r.scores[it.id]
                    return (
                      <td key={it.id} className={v === undefined ? 'gb__empty' : ''}>
                        {v ?? '—'}
                      </td>
                    )
                  }),
                  <td key={`${g.key}-sub`} className="gb__sub">
                    {r.subtotals[g.key] != null ? `${Math.round(r.subtotals[g.key])}%` : '—'}
                  </td>,
                ])}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="gb-note">Scores recorded per item. Subtotals count only the items that have been graded.</p>
    </>
  )
}

export default function CourseDetail() {
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [people, setPeople] = useState(null)
  const [gradebook, setGradebook] = useState(null)
  const [tab, setTab] = useState('Materials')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [assignOpen, setAssignOpen] = useState(false)
  const [assignForm, setAssignForm] = useState({ title: '', description: '', due: '', totalMarks: '100' })
  const [assignFiles, setAssignFiles] = useState([])
  const [assignError, setAssignError] = useState('')

  const [materialOpen, setMaterialOpen] = useState(false)
  const [materialFiles, setMaterialFiles] = useState([])
  const [materialError, setMaterialError] = useState('')

  const [confirm, setConfirm] = useState(null)
  const [confirmError, setConfirmError] = useState('')

  const [viewAssignment, setViewAssignment] = useState(null)

  const load = async () => {
    setError('')
    try {
      const c = await getCourse(id)
      setCourse(c)
    } catch (err) {
      setError(err.message)
      return
    }
    listAssignmentsByCourse(id).then(setAssignments).catch(() => setAssignments([]))
    listQuizzesByCourse(id).then(setQuizzes).catch(() => setQuizzes([]))
    getCoursePeople(id).then(setPeople).catch(() => setPeople({ teacher: null, students: [] }))
    getCourseGradebook(id).then(setGradebook).catch(() => setGradebook(null))
  }
  useEffect(() => { load() }, [id])

  const togglePublished = async () => {
    setBusy(true)
    try {
      const updated = course.published
        ? await unpublishCourse(course.id)
        : await publishCourse(course.id)
      setCourse(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const openAssign = () => {
    setAssignForm({ title: '', description: '', due: '', totalMarks: '100' })
    setAssignFiles([])
    setAssignError('')
    setAssignOpen(true)
  }

  const handleCreateAssignment = async (e) => {
    e.preventDefault()
    setAssignError('')
    if (!assignForm.due || new Date(assignForm.due) <= new Date()) {
      setAssignError('Due date can’t be in the past.')
      return
    }
    const marks = Number(assignForm.totalMarks)
    if (!Number.isInteger(marks) || marks < 1 || marks > 1000) {
      setAssignError('Total marks must be a whole number between 1 and 1000.')
      return
    }
    setBusy(true)
    try {
      let created = await createAssignment({
        courseId: course.id,
        title: assignForm.title.trim(),
        description: assignForm.description.trim() || null,
        dueDate: assignForm.due,
        totalMarks: marks,
      })
      for (const f of assignFiles) {
        created = await uploadAssignmentAttachment(created.id, f)
      }
      setAssignments([created, ...assignments])
      setAssignOpen(false)
    } catch (err) {
      setAssignError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const openMaterial = () => {
    setMaterialFiles([])
    setMaterialError('')
    setMaterialOpen(true)
  }

  const saveMaterial = async () => {
    if (materialFiles.length === 0) {
      setMaterialError('Choose at least one file.')
      return
    }
    setMaterialError('')
    setBusy(true)
    try {
      let latest = course
      for (const f of materialFiles) {
        latest = await uploadCourseAttachment(course.id, f)
      }
      setCourse(latest)
      setMaterialOpen(false)
    } catch (err) {
      setMaterialError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const openConfirm = (kind, item) => {
    setConfirmError('')
    setConfirm({ kind, item })
  }

  const runConfirm = async () => {
    setConfirmError('')
    setBusy(true)
    try {
      if (confirm.kind === 'material') {
        const updated = await removeCourseAttachment(course.id, confirm.item)
        setCourse(updated)
      } else if (confirm.kind === 'assignment') {
        await deleteAssignment(confirm.item.id)
        setAssignments(assignments.filter((a) => a.id !== confirm.item.id))
      } else if (confirm.kind === 'quiz') {
        await deleteQuiz(confirm.item.id)
        setQuizzes(quizzes.filter((q) => q.id !== confirm.item.id))
      }
      setConfirm(null)
    } catch (err) {
      setConfirmError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const confirmTitle = () => {
    if (!confirm) return ''
    if (confirm.kind === 'material') return 'Remove this file?'
    if (confirm.kind === 'assignment') return 'Delete this assignment?'
    return 'Delete this quiz?'
  }
  const confirmLabel = () => {
    if (!confirm) return ''
    if (confirm.kind === 'material') return 'Remove file'
    if (confirm.kind === 'assignment') return 'Delete assignment'
    return 'Delete quiz'
  }
  const confirmBody = () => {
    if (!confirm) return null
    if (confirm.kind === 'material') {
      return <p>Remove <strong>{fileName(confirm.item)}</strong> from this topic’s materials? The file stays in Cloudinary but students won’t see it here.</p>
    }
    if (confirm.kind === 'assignment') {
      return <p>Delete <strong>{confirm.item.title}</strong>? Refused if any student has already submitted.</p>
    }
    return <p>Delete <strong>{confirm.item.title}</strong>? Refused if any student has already attempted it.</p>
  }

  if (error) {
    return (
      <AppLayout role="teacher" title="Topic">
        <section className="panel">
          <div className="empty">
            <p className="field__error" role="alert">{error}</p>
            <Link to="/teacher/courses" className="btn btn--ghost">Back to topics</Link>
          </div>
        </section>
      </AppLayout>
    )
  }

  if (!course) {
    return (
      <AppLayout role="teacher" title="Topic">
        <section className="panel"><p className="empty">Loading topic…</p></section>
      </AppLayout>
    )
  }

  const materials = course.attachmentUrls ?? []
  const studentCount = people?.students?.length ?? 0

  return (
    <AppLayout role="teacher" title={course.title}>
      <Link to="/teacher/courses" className="back">← My topics</Link>

      <div className="page-head">
        <p>{course.className} · {studentCount} {studentCount === 1 ? 'student' : 'students'}</p>
        <button
          className={`btn ${course.published ? 'btn--ghost' : 'btn--primary'}`}
          onClick={togglePublished}
          disabled={busy}
        >
          {busy ? 'Working…' : (course.published ? 'Unpublish' : 'Publish topic')}
        </button>
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
        {tab === 'Materials' && (
          <>
            <div className="panel__head">
              <h2>Materials</h2>
              <button className="btn btn--primary btn--sm" onClick={openMaterial}>Add material</button>
            </div>
            {course.description && <p className="sub-text">{course.description}</p>}
            {materials.length === 0 ? (
              <p className="empty">No materials yet. Add a PDF, slide deck, or image for your students.</p>
            ) : (
              <ul className="rows">
                {materials.map((url) => (
                  <li key={url}>
                    <div><strong>{fileName(url)}</strong></div>
                    <div className="rows__end">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--sm">Open</a>
                      <button className="btn btn--ghost btn--sm btn--danger" onClick={() => openConfirm('material', url)}>Remove</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {tab === 'Assignments' && (
          <>
            <div className="panel__head">
              <h2>Assignments</h2>
              <button className="btn btn--primary btn--sm" onClick={openAssign}>New assignment</button>
            </div>
            {assignments.length === 0 ? (
              <p className="empty">No assignments yet.</p>
            ) : (
              <ul className="rows">
                {assignments.map((a) => (
                  <li key={a.id}>
                    <div>
                      <button
                        type="button"
                        className="link-btn link-btn--strong"
                        onClick={() => setViewAssignment(a)}
                      >{a.title}</button>
                      <small>
                        Due {fmtDue(a.dueDate)} · {a.totalMarks} {a.totalMarks === 1 ? 'mark' : 'marks'}
                        {a.attachmentUrls?.length > 0 && ` · ${a.attachmentUrls.length} ${a.attachmentUrls.length === 1 ? 'attachment' : 'attachments'}`}
                      </small>
                    </div>
                    <div className="rows__end">
                      <button className="btn btn--ghost btn--sm" onClick={() => setViewAssignment(a)}>View</button>
                      <Link to={`/teacher/courses/${course.id}/assignments/${a.id}/grade`} className="btn btn--ghost btn--sm">Review</Link>
                      <button className="btn btn--ghost btn--sm btn--danger" onClick={() => openConfirm('assignment', a)}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {tab === 'Quizzes' && (
          <>
            <div className="panel__head">
              <h2>Quizzes</h2>
              <Link to={`/teacher/quizzes/new?course=${course.id}`} className="btn btn--primary btn--sm">New quiz</Link>
            </div>
            {quizzes.length === 0 ? (
              <p className="empty">No quizzes yet.</p>
            ) : (
              <ul className="rows">
                {quizzes.map((q) => (
                  <li key={q.id}>
                    <div>
                      <strong>{q.title}</strong>
                      <small>
                        {q.questions?.length ?? 0} questions
                        {q.timeLimitMinutes ? ` · ${q.timeLimitMinutes} min` : ''}
                      </small>
                    </div>
                    <div className="rows__end">
                      <span className={`badge ${q.published ? 'badge--live' : ''}`}>{q.published ? 'Published' : 'Draft'}</span>
                      <Link to={`/teacher/quizzes/${q.id}/edit`} className="btn btn--ghost btn--sm">Edit</Link>
                      <Link to={`/teacher/quizzes/${q.id}/mark`} className="btn btn--ghost btn--sm">Mark answers</Link>
                      <button className="btn btn--ghost btn--sm btn--danger" onClick={() => openConfirm('quiz', q)}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {tab === 'Gradebook' && <GradebookView gb={gradebook} />}

        {tab === 'People' && (
          <>
            <div className="panel__head"><h2>People</h2></div>
            <h3 className="subhead">Teacher</h3>
            {people?.teacher ? (
              <ul className="rows">
                <li>
                  <strong>{people.teacher.name}</strong>
                  <span>{people.teacher.email}</span>
                </li>
              </ul>
            ) : (
              <p className="empty">Couldn’t load the teacher.</p>
            )}
            <h3 className="subhead">Students ({studentCount})</h3>
            {studentCount === 0 ? (
              <p className="empty">No students in this class yet.</p>
            ) : (
              <ul className="rows">
                {people.students.map((s) => (
                  <li key={s.id}>
                    <strong>{s.name}</strong>
                    <span>{s.email}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      {viewAssignment && (
        <Modal title={viewAssignment.title} onClose={() => setViewAssignment(null)}>
          <div className="modal__form">
            <p className="muted-text">
              Due {fmtDue(viewAssignment.dueDate)} · out of {viewAssignment.totalMarks}
            </p>
            {viewAssignment.description
              ? <p className="sub-text">{viewAssignment.description}</p>
              : <p className="hint">No instructions were written for this assignment.</p>
            }
            {(viewAssignment.attachmentUrls?.length ?? 0) > 0 && (
              <>
                <h3 className="subhead">Attachments</h3>
                <div className="files">
                  {viewAssignment.attachmentUrls.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="file-chip">
                      {fileName(url)}
                    </a>
                  ))}
                </div>
              </>
            )}
            <div className="confirm-actions">
              <button className="btn btn--ghost" onClick={() => setViewAssignment(null)}>Close</button>
              <Link
                to={`/teacher/courses/${course.id}/assignments/${viewAssignment.id}/grade`}
                className="btn btn--primary"
                onClick={() => setViewAssignment(null)}
              >Review submissions</Link>
            </div>
          </div>
        </Modal>
      )}

      {assignOpen && (
        <Modal title="New assignment" onClose={() => setAssignOpen(false)}>
          <form className="modal__form" onSubmit={handleCreateAssignment}>
            <label className="field">
              <span>Title</span>
              <input
                value={assignForm.title}
                onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })}
                placeholder="Word problems set B"
                required
              />
            </label>
            <label className="field">
              <span>Instructions</span>
              <textarea
                className="select"
                rows="4"
                value={assignForm.description}
                onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })}
                placeholder="What should students do?"
              />
            </label>
            <div className="field-row">
              <label className="field">
                <span>Due date and time</span>
                <input
                  type="datetime-local"
                  value={assignForm.due}
                  min={minDueLocal()}
                  onChange={(e) => setAssignForm({ ...assignForm, due: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                <span>Total marks</span>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={assignForm.totalMarks}
                  onChange={(e) => setAssignForm({ ...assignForm, totalMarks: e.target.value })}
                  required
                />
              </label>
            </div>
            <FilePicker label="Attachments" onChange={setAssignFiles} />
            {assignError && <p className="field__error" role="alert">{assignError}</p>}
            <button
              className="btn btn--primary btn--block"
              type="submit"
              disabled={busy || !assignForm.title.trim() || !assignForm.due}
            >
              {busy ? 'Creating…' : 'Create assignment'}
            </button>
          </form>
        </Modal>
      )}

      {materialOpen && (
        <Modal title="Add material" onClose={() => setMaterialOpen(false)}>
          <div className="modal__form">
            <FilePicker label="Files" onChange={setMaterialFiles} />
            {materialError && <p className="field__error" role="alert">{materialError}</p>}
            <div className="confirm-actions">
              <button className="btn btn--ghost" onClick={() => setMaterialOpen(false)}>Cancel</button>
              <button
                className="btn btn--primary"
                onClick={saveMaterial}
                disabled={busy || materialFiles.length === 0}
              >
                {busy ? 'Uploading…' : 'Add to materials'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {confirm && (
        <Modal title={confirmTitle()} onClose={() => setConfirm(null)}>
          <div className="modal__form">
            {confirmBody()}
            {confirmError && <p className="field__error" role="alert">{confirmError}</p>}
            <div className="confirm-actions">
              <button className="btn btn--ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn btn--danger-solid" onClick={runConfirm} disabled={busy}>
                {busy ? 'Working…' : confirmLabel()}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AppLayout>
  )
}