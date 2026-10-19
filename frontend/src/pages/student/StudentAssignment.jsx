import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import Modal from '../../components/Modal'
import FilePicker from '../../components/FilePicker'
import { getCourse } from '../../api/courses'
import { getAssignment } from '../../api/assignments'
import {
  getMySubmission,
  createSubmission,
  uploadSubmissionFile,
  unsubmit,
} from '../../api/submissions'
import '../../styles/teacher.css'
import '../../styles/student.css'

const fmtWhen = (v) => {
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

export default function StudentAssignment() {
  const { id: courseId, aid: assignmentId } = useParams()
  const [course, setCourse] = useState(null)
  const [assignment, setAssignment] = useState(null)
  const [submission, setSubmission] = useState(null) // null = no submission yet
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')

  const [text, setText] = useState('')
  const [files, setFiles] = useState([])
  const [sendError, setSendError] = useState('')
  const [busy, setBusy] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmError, setConfirmError] = useState('')

  useEffect(() => {
    let alive = true
    setError('')
    Promise.all([
      getCourse(courseId),
      getAssignment(assignmentId),
      getMySubmission(assignmentId),
    ])
      .then(([c, a, sub]) => {
        if (!alive) return
        setCourse(c)
        setAssignment(a)
        setSubmission(sub)
        setLoaded(true)
      })
      .catch((err) => alive && setError(err.message))
    return () => { alive = false }
  }, [courseId, assignmentId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSendError('')
    setBusy(true)
    try {
      let created = await createSubmission({
        assignmentId,
        text: text.trim() || null,
      })
      for (const f of files) {
        created = await uploadSubmissionFile(created.id, f)
      }
      setSubmission(created)
      setText('')
      setFiles([])
    } catch (err) {
      setSendError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const runUnsubmit = async () => {
    setConfirmError('')
    setBusy(true)
    try {
      await unsubmit(assignmentId)
      setSubmission(null)
      setConfirmOpen(false)
    } catch (err) {
      setConfirmError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (error) {
    return (
      <AppLayout role="student" title="Assignment">
        <section className="panel">
          <div className="empty">
            <p className="field__error" role="alert">{error}</p>
            <Link to={`/student/courses/${courseId}`} className="btn btn--ghost">Back to topic</Link>
          </div>
        </section>
      </AppLayout>
    )
  }

  if (!loaded) {
    return (
      <AppLayout role="student" title="Assignment">
        <section className="panel"><p className="empty">Loading…</p></section>
      </AppLayout>
    )
  }

  const overdue = assignment.dueDate && new Date(assignment.dueDate) < new Date()
  const graded = submission?.graded
  const maxMarks = assignment.totalMarks

  return (
    <AppLayout role="student" title={assignment.title}>
      <Link to={`/student/courses/${courseId}`} className="back">← Back to {course?.title ?? 'topic'}</Link>

      <div className="grade-layout">
        <section className="panel">
          <div className="panel__head">
            <h2>Instructions</h2>
            {overdue && !submission ? <span className="badge badge--warn">Past due</span> : null}
          </div>
          <p className={overdue && !submission ? 'late' : 'muted-text'}>
            Due {fmtWhen(assignment.dueDate)} · out of {maxMarks}
          </p>
          {assignment.description
            ? <p className="sub-text">{assignment.description}</p>
            : <p className="hint">No instructions were written for this assignment.</p>
          }
          {(assignment.attachmentUrls?.length ?? 0) > 0 && (
            <>
              <h3 className="subhead">From your teacher</h3>
              <div className="files">
                {assignment.attachmentUrls.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="file-chip">{fileName(url)}</a>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="panel">
          {submission ? (
            <>
              <div className="panel__head">
                <h2>Your work</h2>
                <span className={`badge ${graded ? 'badge--live' : 'badge--test'}`}>
                  {graded ? `${submission.grade}/${maxMarks}` : 'Submitted'}
                </span>
              </div>
              <p className="muted-text">
                Submitted {fmtWhen(submission.submittedAt)}
                {submission.late && <span className="late"> · Late</span>}
              </p>
              {submission.text && <p className="sub-text">{submission.text}</p>}
              {(submission.fileUrls?.length ?? 0) > 0 && (
                <div className="files">
                  {submission.fileUrls.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="file-chip">{fileName(url)}</a>
                  ))}
                </div>
              )}
              {graded ? (
                <div className="feedback">
                  <strong>Feedback from your teacher</strong>
                  <p>{submission.feedback || 'No written feedback.'}</p>
                </div>
              ) : (
                <>
                  <p className="hint">Your teacher hasn’t graded this yet. You can unsubmit to make changes.</p>
                  <div className="row-actions">
                    <button className="btn btn--ghost btn--danger" onClick={() => { setConfirmError(''); setConfirmOpen(true) }}>
                      Unsubmit
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <form className="modal__form" onSubmit={handleSubmit}>
              <h2>Your work</h2>
              {overdue && (
                <p className="late">
                  This was due {fmtWhen(assignment.dueDate)}. You can still hand it in, but it will show as late.
                </p>
              )}
              <label className="field">
                <span>Notes for your teacher</span>
                <textarea
                  className="select"
                  rows="5"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type your answer or add a note"
                />
              </label>
              <FilePicker label="Your files" onChange={setFiles} />
              {sendError && <p className="field__error" role="alert">{sendError}</p>}
              <button
                className="btn btn--primary btn--lg"
                type="submit"
                disabled={busy || (!text.trim() && files.length === 0)}
              >
                {busy ? 'Handing in…' : 'Hand in'}
              </button>
            </form>
          )}
        </section>
      </div>

      {confirmOpen && (
        <Modal title="Unsubmit this assignment?" onClose={() => setConfirmOpen(false)}>
          <div className="modal__form">
            <p>
              Your submission and any files you attached will be removed, so you can hand in
              a fresh version. This only works while your teacher hasn’t graded it yet.
            </p>
            {confirmError && <p className="field__error" role="alert">{confirmError}</p>}
            <div className="confirm-actions">
              <button className="btn btn--ghost" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className="btn btn--danger-solid" onClick={runUnsubmit} disabled={busy}>
                {busy ? 'Unsubmitting…' : 'Unsubmit'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AppLayout>
  )
}