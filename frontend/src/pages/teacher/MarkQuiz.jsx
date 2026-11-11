import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import { getQuiz } from '../../api/quizzes'
import { listAttemptsByQuiz, gradeAttempt } from '../../api/quizAttempts'
import { getCourse } from '../../api/courses'
import { listClassStudents } from '../../api/classes' 
import '../../styles/teacher.css'

const fmtWhen = (v) => {
  if (!v) return '—'
  return new Date(v).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

const totalMarks = (quiz) => quiz?.totalMarks ?? (quiz?.questions ?? []).reduce((n, q) => n + (q.marks ?? 1), 0)

export default function MarkQuiz() {
  const { qid: quizId } = useParams()
  const [quiz, setQuiz] = useState(null)
  const [attempts, setAttempts] = useState([])
  const [studentsById, setStudentsById] = useState({})
  const [selectedId, setSelectedId] = useState(null)
  
  const [questionScores, setQuestionScores] = useState({})
  
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
            const course = await getCourse(q.courseId)
            people = await listClassStudents(course.classId)
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
          initQuestionScores(q, first)
        }
        setLoaded(true)
      })
      .catch((err) => alive && setError(err.message))
    return () => { alive = false }
  }, [quizId])

  const initQuestionScores = (q, attempt) => {
    const scores = {}
    const total = attempt.score ?? 0
    
    let autoTotal = 0
    q.questions.forEach((question, i) => {
      if (question.type === 'MULTIPLE_CHOICE' && attempt.answers?.[String(i)] === question.correctAnswer) {
        autoTotal += question.marks ?? 1
      }
    })
    
    let extraToDistribute = total - autoTotal
    
    q.questions.forEach((question, i) => {
      const max = question.marks ?? 1
      const isCorrect = question.type === 'MULTIPLE_CHOICE' && attempt.answers?.[String(i)] === question.correctAnswer
      
      if (question.type === 'OPEN_ENDED') {
        const val = Math.min(Math.max(extraToDistribute, 0), max)
        scores[i] = val
        extraToDistribute -= val
      } else {
        scores[i] = isCorrect ? max : 0
      }
    })

    setQuestionScores(scores)
  }

  const pick = (a) => {
    setSelectedId(a.id)
    initQuestionScores(quiz, a)
    setSaveError('')
  }

  const handleMarkChange = (index, val, max) => {
    const num = Math.max(0, Math.min(Number(val) || 0, max))
    setQuestionScores({ ...questionScores, [index]: num })
  }

  const save = async (e) => {
    e.preventDefault()
    setSaveError('')
    setBusy(true)
    try {
      const sel = attempts.find((a) => a.id === selectedId)
      const newTotal = Object.values(questionScores).reduce((a, b) => a + Number(b || 0), 0)
      const delta = newTotal - (sel.score ?? 0)
      
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
            <Link to="/teacher/classes" className="btn btn--ghost">Back to classes</Link>
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
    : `/teacher/classes/${quiz.classId}`

  const isReleased = (quiz.category === 'TEST' || quiz.category === 'EXAM') && quiz.resultsReleased

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
                      <small>Current: {a.score ?? 0}</small>
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
                {isReleased && <span className="badge badge--live">Results released</span>}
              </div>
              <p className="muted-text">Submitted {fmtWhen(sel.submittedAt || sel.attemptedAt)}</p>
              
              <ol className="answers">
                {quiz.questions.map((q, i) => {
                  const ans = sel.answers?.[String(i)]
                  const right = q.type === 'MULTIPLE_CHOICE' && ans === q.correctAnswer
                  const max = q.marks ?? 1
                  
                  return (
                    <li key={i} style={{ marginBottom: '1.5rem' }}>
                      <p><strong>{q.text}</strong> <small>({max} marks)</small></p>
                      
                      {q.type === 'MULTIPLE_CHOICE' ? (
                        <div style={{ 
                          background: 'var(--slate-50)', 
                          padding: '1rem', 
                          borderRadius: 'var(--radius-md)', 
                          border: '1px solid var(--slate-200)' 
                        }}>
                          <p className={`ans ${right ? 'ans--right' : 'ans--wrong'}`} style={{ marginTop: 0, marginBottom: '0.5rem' }}>
                            {right ? '✓ Correct' : '✗ Incorrect'}
                          </p>
                          <p style={{ margin: '0.2rem 0', fontSize: '0.95rem' }}>
                            Student's answer: <strong>{ans ?? 'No answer'}</strong>
                          </p>
                          {!right && (
                            <p style={{ margin: '0.2rem 0', fontSize: '0.95rem', color: 'var(--teal-700)' }}>
                              Correct answer: <strong>{q.correctAnswer}</strong>
                            </p>
                          )}
                          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                            Auto-awarded: {questionScores[i] ?? 0} / {max}
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="sub-text" style={{ marginBottom: '0.5rem' }}>{ans ?? <em>No answer</em>}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Marks:</label>
                            <input
                              type="number"
                              min="0"
                              max={max}
                              value={questionScores[i] ?? ''}
                              onChange={(e) => handleMarkChange(i, e.target.value, max)}
                              disabled={isReleased || busy}
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
                  <p style={{ marginTop: '0.5rem', fontWeight: 600 }}>
                    Total: {Object.values(questionScores).reduce((a, b) => a + Number(b || 0), 0)} / {totalMarks(quiz)}
                  </p>
                </div>
                
                {saveError && <p className="field__error" role="alert">{saveError}</p>}
                
                <button className="btn btn--primary" type="submit" disabled={busy || isReleased}>
                  {isReleased ? 'Results Released' : (busy ? 'Saving…' : (sel.graded ? 'Update marks' : 'Save marks'))}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </AppLayout>
  )
}