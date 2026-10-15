import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import { getAssignment } from '../../api/assignments'
import { listSubmissionsByAssignment, gradeSubmission } from '../../api/submissions'
import { getCourse, getCoursePeople } from '../../api/courses'
import '../../styles/teacher.css'

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

export default function GradeSubmissions() {
  const { id: courseId, aid: assignmentId } = useParams()
  const [assignment, setAssignment] = useState(null)
  const [subs, setSubs] = useState([])
  const [studentsById, setStudentsById] = useState({})
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState({ grade: '', feedback: '' })
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true
    setError('')
    Promise.all([
      getAssignment(assignmentId),
      getCourse(courseId),
      listSubmissionsByAssignment(assignmentId),
      getCoursePeople(courseId),
    ]).then(([a, c, list, people]) => {
      if (!alive) return
      setAssignment(a)
      setSubs(list)
      const map = {}
      ;(people.students ?? []).forEach((u) => { map[u.id] = u.name })
      setStudentsById(map)
      const first = list.find((s) => !s.graded) ?? list[0]
      if (first) {
        setSelectedId(first.id)
        setForm({ grade: first.grade ?? '', feedback: first.feedback ?? '' })
      }
      setLoaded(true)
    }).catch((err) => alive && setError(err.message))
    return () => { alive = false }
  }, [courseId, assignmentId])

  const pick = (s) => {
    setSelectedId(s.id)
    setForm({ grade: s.grade ?? '', feedback: s.feedback ?? '' })
    setSaveError('')
  }

  const save = async (e) => {
    e.preventDefault()
    setSaveError('')
    const g = Number(form.grade)
    if (!Number.isInteger(g) || g < 0 || g > assignment.totalMarks) {
      setSaveError(`Grade must be a whole number between 0 and ${assignment.totalMarks}.`)
      return
    }
    setBusy(true)
    try {
      const updated = await gradeSubmission(selectedId, {
        grade: g,
        feedback: form.feedback.trim() || null,
      })
      setSubs(subs.map((s) => (s.id === selectedId ? updated : s)))
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (error) {
    return (
      <AppLayout role="teacher" title="Grade submissions">
        <section className="panel">
          <div className="empty">
            <p className="field__error" role="alert">{error}</p>
            <Link to="/teacher/assignments" className="btn btn--ghost">Back to assignments</Link>
          </div>
        </section>
      </AppLayout>
    )
  }

  if (!loaded || !assignment) {
    return (
      <AppLayout role="teacher" title="Grade submissions">
        <section className="panel"><p className="empty">Loading submissions…</p></section>
      </AppLayout>
    )
  }

  const sel = subs.find((s) => s.id === selectedId)
  const left = subs.filter((s) => !s.graded).length
  const studentName = (id) => studentsById[id] ?? 'Student'
  const outOf = assignment.totalMarks

  return (
    <AppLayout role="teacher" title={assignment.title}>
      <Link to={`/teacher/courses/${courseId}`} className="back">← Back to topic</Link>

      <div className="grade-layout">
        <section className="panel">
          <div className="panel__head">
            <h2>Submissions</h2>
            <span className={`badge ${left > 0 ? 'badge--warn' : 'badge--live'}`}>{left} to grade</span>
          </div>
          {subs.length === 0 ? (
            <p className="empty">No submissions yet.</p>
          ) : (
            <ul className="sub-list">
              {subs.map((s) => (
                <li key={s.id}>
                  <button className={`sub-item ${s.id === selectedId ? 'is-active' : ''}`} onClick={() => pick(s)}>
                    <span>
                      <strong>{studentName(s.studentId)}</strong>
                      <small>{fmtWhen(s.submittedAt)}</small>
                    </span>
                    <span className={`badge ${s.graded ? 'badge--live' : 'badge--warn'}`}>
                      {s.graded ? `${s.grade}/${outOf}` : 'Ungraded'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          {!sel ? (
            <p className="empty">Pick a submission on the left.</p>
          ) : (
            <>
              <h2>{studentName(sel.studentId)}</h2>
              <p className="muted-text">Submitted {fmtWhen(sel.submittedAt)}</p>
              {sel.text && <p className="sub-text">{sel.text}</p>}
              {sel.fileUrls?.length > 0 && (
                <div className="files">
                  {sel.fileUrls.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="file-chip">{fileName(url)}</a>
                  ))}
                </div>
              )}
              <form className="modal__form" onSubmit={save}>
                <label className="field marks">
                  <span>Grade (out of {outOf})</span>
                  <input
                    type="number"
                    min="0"
                    max={outOf}
                    value={form.grade}
                    onChange={(e) => setForm({ ...form, grade: e.target.value })}
                    required
                  />
                </label>
                <label className="field">
                  <span>Feedback</span>
                  <textarea
                    className="select"
                    rows="4"
                    value={form.feedback}
                    onChange={(e) => setForm({ ...form, feedback: e.target.value })}
                    placeholder="What went well, what to improve"
                  />
                </label>
                {saveError && <p className="field__error" role="alert">{saveError}</p>}
                <button className="btn btn--primary" type="submit" disabled={busy}>
                  {busy ? 'Saving…' : (sel.graded ? 'Update grade' : 'Save grade')}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </AppLayout>
  )
}