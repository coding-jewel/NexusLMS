import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Modal from '../../components/Modal'
import { getQuizForTake } from '../../api/quizzes'
import { getMyAttempt, startQuizAttempt, submitQuizAttempt, abandonQuizAttempt } from '../../api/quizAttempts'
import '../../styles/teacher.css'
import '../../styles/student.css'

const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

const parseExpiry = (expiresAt) => {
  if (!expiresAt) return Date.now() + 30 * 60 * 1000
  
  let str = String(expiresAt)
  
  if (!str.endsWith('Z') && !str.includes('+') && !str.match(/-\d{2}:\d{2}$/)) {
    str = str + 'Z'
  }
  
  const parsed = new Date(str).getTime()
  return isNaN(parsed) ? Date.now() + 30 * 60 * 1000 : parsed
}

export default function TakeTest() {
  const { qid } = useParams()
  const [quiz, setQuiz] = useState(null)
  const [attempt, setAttempt] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [stage, setStage] = useState('rules')
  const [agreed, setAgreed] = useState(false)
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState({})
  const [remaining, setRemaining] = useState(0)
  const [endTime, setEndTime] = useState(null)
  const [confirm, setConfirm] = useState(false)
  const [reason, setReason] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [busy, setBusy] = useState(false)

  const submittingRef = useRef(false)
  const answersRef = useRef(answers)

  useEffect(() => { answersRef.current = answers }, [answers])

  useEffect(() => {
    let alive = true
    setLoadError('')
    Promise.all([getQuizForTake(qid), getMyAttempt(qid).catch(() => null)])
      .then(([q, at]) => {
        if (!alive) return
        setQuiz(q)
        setAttempt(at)

        if (at && (at.submitted || at.graded)) {
          setStage('done')
          setAnswers(at.answers || {})
        } else if (at && at.expiresAt) {
          setEndTime(parseExpiry(at.expiresAt)) // FIXED
          setAnswers(at.answers || {})
          setStage('taking')
        }
        setLoaded(true)
      })
      .catch((err) => alive && setLoadError(err.message))
    return () => { alive = false }
  }, [qid])

  useEffect(() => {
    if (stage !== 'taking' || !endTime) return
    const tick = () => {
      const secsLeft = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
      setRemaining(secsLeft)
      if (secsLeft <= 0 && !submittingRef.current) {
        finish('Time ran out, so your answers were submitted automatically.')
      }
    }
    tick()
    const t = setInterval(tick, 500)
    return () => clearInterval(t)
  }, [stage, endTime])

  useEffect(() => {
    if (stage !== 'taking' || !attempt) return

    const warn = (e) => {
      abandonQuizAttempt(attempt.id)
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [stage, attempt])

  const start = async () => {
    setBusy(true)
    try {
      const at = await startQuizAttempt(qid)
      setAttempt(at)
      
      const expiryTime = parseExpiry(at.expiresAt) // FIXED
      
      setEndTime(expiryTime)
      setRemaining(Math.max(0, Math.ceil((expiryTime - Date.now()) / 1000)))
      setStage('taking')
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const answered = (k) => answers[String(k)] !== undefined && String(answers[String(k)]).trim() !== ''

  const finish = async (why = '') => {
    if (submittingRef.current || !attempt) return
    submittingRef.current = true
    setSubmitError('')
    setConfirm(false)
    setBusy(true)
    try {
      const data = await submitQuizAttempt(attempt.id, answersRef.current)
      setAttempt(data)
      setReason(why)
      setStage('done')
    } catch (err) {
      submittingRef.current = false
      setSubmitError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (loadError) {
    return (
      <div className="test-page">
        <header className="test-top"><div className="test-top__title"><strong>Quiz</strong></div></header>
        <main className="test-main">
          <section className="panel test-card">
            <h1>We can’t open this quiz</h1>
            <p className="muted-text">{loadError}</p>
            <Link to="/student/classes" className="btn btn--ghost">Back to my classes</Link>
          </section>
        </main>
      </div>
    )
  }

  if (!loaded) {
    return (
      <div className="test-page">
        <header className="test-top"><div className="test-top__title"><strong>Loading…</strong></div></header>
        <main className="test-main"><section className="panel test-card"><p className="muted-text">Loading quiz…</p></section></main>
      </div>
    )
  }

  if (stage === 'done' && attempt) {
    const isFullyGraded = attempt.graded
    const isReleased = quiz.category === 'QUIZ' || quiz.resultsReleased

    return (
      <div className="test-page">
        <header className="test-top">
          <div className="test-top__title"><strong>{quiz.title}</strong></div>
        </header>
        <main className="test-main">
          <section className="panel test-card review-success-card">
            <h1>You’ve already submitted this quiz</h1>
            <p className="muted-text">Each quiz can only be attempted once.</p>
            {reason && <p className="flag-note">{reason}</p>}

            {isFullyGraded ? (
              isReleased ? (
                <p className="result">Your score: <strong>{attempt.score}/{quiz.totalMarks}</strong></p>
              ) : (
                <p className="hint">Your score will appear on My grades once your teacher releases the results.</p>
              )
            ) : (
              <p className="hint">Your teacher still has to mark the written answers.</p>
            )}

            <Link to="/student/grades" className="btn btn--primary mt-1">Go to My grades</Link>
          </section>

          {isReleased && (
            <section className="panel">
              <h2 className="review-heading">Review your answers</h2>
              {quiz.questions.map((q, idx) => {
                const studentAns = answers[String(idx)]
                const isCorrect = q.type === 'MULTIPLE_CHOICE' && studentAns === q.correctAnswer
                
                return (
                  <div key={idx} className="review-item">
                    <p className="review-question-meta">
                      Question {idx + 1} · {q.marks ?? 1} marks
                    </p>
                    <h3 className="review-question-text">{q.text}</h3>
                    
                    <div className="review-answer-box">
                      <p className="review-answer-label">Your answer:</p>
                      <p className={`review-answer-text ${studentAns ? (q.type === 'MULTIPLE_CHOICE' ? (isCorrect ? 'review-answer-text--right' : 'review-answer-text--wrong') : '') : 'review-answer-text--empty'}`}>
                        {studentAns || 'No answer provided'}
                      </p>
                      {q.type === 'MULTIPLE_CHOICE' && (
                        <p className="review-correct-answer">
                          Correct answer: {q.correctAnswer}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </section>
          )}
        </main>
      </div>
    )
  }

  if (stage === 'rules') {
    return (
      <div className="test-page">
        <header className="test-top">
          <div className="test-top__title"><strong>{quiz.title}</strong></div>
        </header>
        <main className="test-main">
          <section className="panel test-card">
            <h1>Before you start</h1>
            <dl className="facts">
              <div><dt>Questions</dt><dd>{quiz.questions.length}</dd></div>
              <div><dt>Total marks</dt><dd>{quiz.totalMarks}</dd></div>
              <div><dt>Time limit</dt><dd>{quiz.timeLimitMinutes ?? 30} minutes</dd></div>
              <div><dt>Attempts</dt><dd>One</dd></div>
            </dl>
            <ul className="rules">
              <li>The clock starts the moment you press Start, even if you close the tab.</li>
              <li>If you close the tab and don’t come back, your quiz will be submitted automatically so your teacher can grade it.</li>
            </ul>
            <label className="agree">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              I understand and I’m ready to start.
            </label>
            <div className="test-actions">
              <Link to="/student/classes" className="btn btn--ghost">Back</Link>
              <button className="btn btn--primary btn--lg" disabled={!agreed || busy} onClick={start}>
                {busy ? 'Starting…' : 'Start quiz'}
              </button>
            </div>
          </section>
        </main>
      </div>
    )
  }

  const q = quiz.questions[i]
  const unanswered = quiz.questions.filter((_, k) => !answered(k)).length

  return (
    <div className="test-page">
      <header className="test-top">
        <div className="test-top__title"><strong>{quiz.title}</strong></div>
        <span className={`timer ${remaining < 300 ? 'timer--low' : ''}`} role="timer">
          {fmtTime(Math.max(remaining, 0))}
        </span>
      </header>
      <main className="test-main">
        <div className="take-layout">
          <aside className="panel">
            <h2>Questions</h2>
            <div className="nav-grid">
              {quiz.questions.map((_, k) => (
                <button
                  key={k}
                  className={`nav-q ${k === i ? 'is-current' : ''} ${answered(k) ? 'is-done' : ''}`}
                  onClick={() => setI(k)}
                >{k + 1}</button>
              ))}
            </div>
            <p className="hint">{quiz.questions.length - unanswered} of {quiz.questions.length} answered · {quiz.totalMarks} marks</p>
            <button className="btn btn--primary btn--block" onClick={() => setConfirm(true)}>Submit</button>
          </aside>

          <section className="panel">
            <p className="muted-text">Question {i + 1} of {quiz.questions.length} · {q.marks ?? 1} marks</p>
            <h2 className="q-text">{q.text}</h2>
            {q.type === 'MULTIPLE_CHOICE' ? (
              <div className="q-options" role="radiogroup">
                {q.options.map((o, j) => (
                  <label key={j} className={`q-opt ${answers[String(i)] === o ? 'is-picked' : ''}`}>
                    <input
                      type="radio"
                      name={`q${i}`}
                      checked={answers[String(i)] === o}
                      onChange={() => setAnswers({ ...answers, [String(i)]: o })}
                    />
                    {o}
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                className="select"
                rows="8"
                value={answers[String(i)] || ''}
                onChange={(e) => setAnswers({ ...answers, [String(i)]: e.target.value })}
                placeholder="Type your answer"
              />
            )}
            <div className="test-actions">
              <button className="btn btn--ghost" disabled={i === 0} onClick={() => setI(i - 1)}>Previous</button>
              {i < quiz.questions.length - 1
                ? <button className="btn btn--primary" onClick={() => setI(i + 1)}>Next</button>
                : <button className="btn btn--primary" onClick={() => setConfirm(true)}>Review and submit</button>}
            </div>
          </section>
        </div>

        {confirm && (
          <Modal title="Submit your answers?" onClose={() => setConfirm(false)}>
            <div className="modal__form">
              <p>
                {unanswered > 0
                  ? `You have ${unanswered} unanswered ${unanswered === 1 ? 'question' : 'questions'}.`
                  : 'You’ve answered every question.'} You can’t change your answers after submitting.
              </p>
              {submitError && <p className="field__error" role="alert">{submitError}</p>}
              <button className="btn btn--primary btn--block" onClick={() => finish()} disabled={busy}>
                {busy ? 'Submitting…' : 'Submit now'}
              </button>
              <button className="btn btn--ghost btn--block" onClick={() => setConfirm(false)}>Keep working</button>
            </div>
          </Modal>
        )}
      </main>
    </div>
  )
}