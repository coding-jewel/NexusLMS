import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import { getQuiz } from '../../api/quizzes'
import { listAttemptsByQuiz, gradeAttempt } from '../../api/quizAttempts'
import { getCoursePeople } from '../../api/courses'
import { listClassStudents } from '../../api/classes'
import '../../styles/teacher.css'

const fmtWhen = (v) => {
  if (!v) return '—'
  return new Date(v).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

const autoScore = (quiz, attempt) => {
  if (!quiz || !attempt) return 0
  let total = 0
  quiz.questions.forEach((q, i) => {
    if (q.type === 'MULTIPLE_CHOICE' && attempt.answers?.[String(i)] === q.correctAnswer) {
      total += q.marks ?? 1
    }
  })
  return total
}
const totalMarks = (quiz) => (quiz?.questions ?? []).reduce((n, q) => n + (q.marks ?? 1), 0)
const openMax = (quiz) => (quiz?.questions ?? []).filter((q) => q.type === 'OPEN_ENDED').reduce((n, q) => n + (q.marks ?? 1), 0)

export default function MarkQuiz() {
  const { qid: quizId } = useParams()
  const [quiz, setQuiz] = useState(null)
  const [attempts, setAttempts] = useState([])
  const [studentsById, setStudentsById] = useState({})
  const [selectedId, setSelectedId] = useState(null)
  const [extra, setExtra] = useState('')
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true
    setError('')
    Promise.all([getQuiz(quizId), listAttemptsByQuiz(quizId)])
      .then(async ([q, list]) => {
        if (!alive) return
        setQuiz(q)
        setAttempts(list)

        // Student names come from the topic's students (QUIZ) or the class's students (TEST / EXAM).
        let people = []
        try {
          if (q.category === 'QUIZ' && q.courseId) {
            const p = await getCoursePeople(q.courseId)
            people = p.students ?? []
          } else if (q.classId) {
            people = await listClassStudents(q.classId)
          }
        } catch {
          people = []
        }
        if (!alive) return
        const map = {}
        people.forEach((u) => { map[u.id] = u.name })
        setStudentsById(map)

        const first = list.find((a) => !a.graded) ?? list[0]
        if (first) {
          setSelectedId(first.id)
          setExtra(String(Math.max((first.score ?? 0) - autoScore(q, first), 0)))
        }
        setLoaded(true)
      })
      .catch((err) => alive && setError(err.message))
    return () => { alive = false }
  }, [quizId])

  const pick = (a) => {
    setSelectedId(a.id)
    setExtra(String(Math.max((a.score ?? 0) - autoScore(quiz, a), 0)))
    setSaveError('')
  }

  const save = async (e) => {
    e.preventDefault()
    setSaveError('')
    setBusy(true)
    try {
      const sel = attempts.find((a) => a.id === selectedId)
      const currentExtra = Math.max((sel.score ?? 0) - autoScore(quiz, sel), 0)
      const delta = Number(extra) - currentExtra
      const updated = await gradeAttempt(selectedId, { additionalScore: delta })
      setAttempts(attempts.map((a) => (a.id === selectedId ? updated : a)))
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (error) {
    return (
      <AppLayout role="teacher" title="Mark answers">
        <section className="panel">
          <div className="empty">
            <p className="field__error" role="alert">{error}</p>
            <Link to="/teacher/quizzes" className="btn btn--ghost">Back to tests & exams</Link>
          </div>
        </section>
      </AppLayout>
    )
  }

  if (!loaded || !quiz) {
    return (
      <AppLayout role="teacher" title="Mark answers">
        <section className="panel"><p className="empty">Loading attempts…</p></section>
      </AppLayout>
    )
  }

  const sel = attempts.find((a) => a.id === selectedId)
  const studentName = (id) => studentsById[id] ?? 'Student'
  const backTo = quiz.category === 'QUIZ' && quiz.courseId
    ? `/teacher/courses/${quiz.courseId}`
    : '/teacher/quizzes'

  return (
    <AppLayout role="teacher" title={`Mark: ${quiz.title}`}>
      <Link to={backTo} className="back">← Back</Link>

      <div className="grade-layout">
        <section className="panel">
          <div className="panel__head">
            <h2>Attempts</h2>
            <span className={`badge ${attempts.filter((a) => !a.graded).length > 0 ? 'badge--warn' : 'badge--live'}`}>
              {attempts.filter((a) => !a.graded).length} to mark
            </span>
          </div>
          {attempts.length === 0 ? (
            <p className="empty">No attempts yet.</p>
          ) : (
            <ul className="sub-list">
              {attempts.map((a) => (
                <li key={a.id}>
                  <button className={`sub-item ${a.id === selectedId ? 'is-active' : ''}`} onClick={() => pick(a)}>
                    <span>
                      <strong>{studentName(a.studentId)}</strong>
                      <small>Auto score {autoScore(quiz, a)}</small>
                    </span>
                    <span className={`badge ${a.graded ? 'badge--live' : 'badge--warn'}`}>
                      {a.graded ? `${a.score ?? 0}/${totalMarks(quiz)}` : 'To mark'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          {!sel ? (
            <p className="empty">Pick an attempt on the left.</p>
          ) : (
            <>
              <h2>{studentName(sel.studentId)}</h2>
              <p className="muted-text">Submitted {fmtWhen(sel.attemptedAt)}</p>
              <ol className="answers">
                {quiz.questions.map((q, i) => {
                  const ans = sel.answers?.[String(i)]
                  const right = q.type === 'MULTIPLE_CHOICE' && ans === q.correctAnswer
                  return (
                    <li key={i}>
                      <p><strong>{q.text}</strong> <small>({q.marks ?? 1} marks)</small></p>
                      {q.type === 'MULTIPLE_CHOICE' ? (
                        <p className={`ans ${right ? 'ans--right' : 'ans--wrong'}`}>
                          {ans ?? '—'} {right ? '✓ Correct' : `✗ Correct answer: ${q.correctAnswer}`}
                        </p>
                      ) : (
                        <p className="sub-text">{ans ?? <em>No answer</em>}</p>
                      )}
                    </li>
                  )
                })}
              </ol>
              <form className="modal__form" onSubmit={save}>
                <label className="field marks">
                  <span>Marks for open-ended (max {openMax(quiz)})</span>
                  <input
                    type="number"
                    min="0"
                    max={openMax(quiz)}
                    value={extra}
                    onChange={(e) => setExtra(e.target.value)}
                    required
                  />
                </label>
                <p className="hint">
                  Total = {autoScore(quiz, sel)} auto + {Number(extra) || 0} yours ={' '}
                  <strong>{autoScore(quiz, sel) + (Number(extra) || 0)}/{totalMarks(quiz)}</strong>
                </p>
                {saveError && <p className="field__error" role="alert">{saveError}</p>}
                <button className="btn btn--primary" type="submit" disabled={busy}>
                  {busy ? 'Saving…' : (sel.graded ? 'Update marks' : 'Save marks')}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </AppLayout>
  )
}