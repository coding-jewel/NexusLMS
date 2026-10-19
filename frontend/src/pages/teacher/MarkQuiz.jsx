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

const totalMarks = (quiz) => quiz?.totalMarks ?? (quiz?.questions ?? []).reduce((n, q) => n + (q.marks ?? 1), 0)

export default function MarkQuiz() {
  const { qid: quizId } = useParams()
  const [quiz, setQuiz] = useState(null)
  const [attempts, setAttempts] = useState([])
  const [studentsById, setStudentsById] = useState({})
  const [selectedId, setSelectedId] = useState(null)
  
  const [extraMarks, setExtraMarks] = useState({})
  
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
          initExtraMarks(q, first)
        }
        setLoaded(true)
      })
      .catch((err) => alive && setError(err.message))
    return () => { alive = false }
  }, [quizId])

  const initExtraMarks = (q, attempt) => {
    const currentExtra = Math.max((attempt.score ?? 0) - autoScore(q, attempt), 0)
    let remaining = currentExtra
    const marks = {}
    q.questions.forEach((question, i) => {
      if (question.type === 'OPEN_ENDED') {
        const max = question.marks ?? 1
        const val = Math.min(remaining, max)
        marks[i] = val
        remaining -= val
      }
    })
    setExtraMarks(marks)
  }

  const pick = (a) => {
    setSelectedId(a.id)
    initExtraMarks(quiz, a)
    setSaveError('')
  }

  const handleMarkChange = (index, val, max) => {
    const num = Math.max(0, Math.min(Number(val) || 0, max))
    setExtraMarks({ ...extraMarks, [index]: num })
  }

  const save = async (e) => {
    e.preventDefault()
    setSaveError('')
    setBusy(true)
    try {
      const sel = attempts.find((a) => a.id === selectedId)
      const totalExtra = Object.values(extraMarks).reduce((a, b) => a + Number(b || 0), 0)
      const currentExtra = Math.max((sel.score ?? 0) - autoScore(quiz, sel), 0)
      const delta = totalExtra - currentExtra
      
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
              <div className="panel__head">
                <h2>{studentName(sel.studentId)}</h2>
                {quiz.resultsReleased && <span className="badge badge--live">Results released</span>}
              </div>
              <p className="muted-text">Submitted {fmtWhen(sel.attemptedAt)}</p>
              
              <ol className="answers">
                {quiz.questions.map((q, i) => {
                  const ans = sel.answers?.[String(i)]
                  const right = q.type === 'MULTIPLE_CHOICE' && ans === q.correctAnswer
                  const max = q.marks ?? 1
                  
                  return (
                    <li key={i} style={{ marginBottom: '1.5rem' }}>
                      <p><strong>{q.text}</strong> <small>({max} marks)</small></p>
                      
                      {q.type === 'MULTIPLE_CHOICE' ? (
                        <p className={`ans ${right ? 'ans--right' : 'ans--wrong'}`}>
                          {ans ?? '—'} {right ? '✓ Correct' : `✗ Correct answer: ${q.correctAnswer}`}
                        </p>
                      ) : (
                        <>
                          <p className="sub-text" style={{ marginBottom: '0.5rem' }}>{ans ?? <em>No answer</em>}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Marks:</label>
                            <input
                              type="number"
                              min="0"
                              max={max}
                              value={extraMarks[i] ?? ''}
                              onChange={(e) => handleMarkChange(i, e.target.value, max)}
                              disabled={quiz.resultsReleased || busy}
                              style={{ width: '80px', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--slate-200)' }}
                            />
                            <span style={{ fontSize: '0.9rem', color: 'var(--slate-500)' }}>out of {max}</span>
                          </div>
                        </>
                      )}
                    </li>
                  )
                })}
              </ol>

              <form className="modal__form" onSubmit={save}>
                <div className="hint" style={{ padding: '1rem', background: 'var(--slate-50)', borderRadius: '8px' }}>
                  <p style={{ marginBottom: '0.5rem' }}><strong>Summary</strong></p>
                  <p>Auto-marked (MCQs): {autoScore(quiz, sel)}</p>
                  <p>Manual marks: {Object.values(extraMarks).reduce((a, b) => a + Number(b || 0), 0)}</p>
                  <p style={{ marginTop: '0.5rem', fontWeight: 600 }}>
                    Total: {autoScore(quiz, sel) + Object.values(extraMarks).reduce((a, b) => a + Number(b || 0), 0)} / {totalMarks(quiz)}
                  </p>
                </div>
                
                {saveError && <p className="field__error" role="alert">{saveError}</p>}
                
                <button className="btn btn--primary" type="submit" disabled={busy || quiz.resultsReleased}>
                  {quiz.resultsReleased ? 'Results Released' : (busy ? 'Saving…' : (sel.graded ? 'Update marks' : 'Save marks'))}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </AppLayout>
  )
}