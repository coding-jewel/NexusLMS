import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Modal from '../../components/Modal'
import { getQuizForTake } from '../../api/quizzes'
import { getMyAttempt, submitAttempt } from '../../api/quizAttempts'
import '../../styles/teacher.css'
import '../../styles/student.css'

const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export default function TakeTest() {
  const { qid } = useParams()
  const [quiz, setQuiz] = useState(null)
  const [existing, setExisting] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [stage, setStage] = useState('rules')
  const [agreed, setAgreed] = useState(false)
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState({})
  const [remaining, setRemaining] = useState(0)
  const [notice, setNotice] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [reason, setReason] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [busy, setBusy] = useState(false)

  const leftRef = useRef(0)
  const lastLeaveRef = useRef(0)
  const submittingRef = useRef(false)

  useEffect(() => {
    let alive = true
    setLoadError('')
    Promise.all([getQuizForTake(qid), getMyAttempt(qid)])
      .then(([q, at]) => {
        if (!alive) return
        setQuiz(q)
        setExisting(at)
        setLoaded(true)
      })
      .catch((err) => alive && setLoadError(err.message))
    return () => { alive = false }
  }, [qid])

  useEffect(() => {
    if (stage !== 'taking') return
    const t = setInterval(() => setRemaining((r) => r - 1), 1000)
    return () => clearInterval(t)
  }, [stage])

  useEffect(() => {
    if (stage === 'taking' && remaining <= 0 && !submittingRef.current) {
      finish('Time ran out, so your answers were submitted automatically.')
    }
  }, [remaining, stage])

  useEffect(() => {
    if (stage !== 'taking' || !quiz) return
    const mode = quiz.guardMode || 'RECORD'
    const limit = quiz.guardLimit || 3
    if (mode === 'OFF') return

    const record = () => {
      const now = Date.now()
      if (now - lastLeaveRef.current < 2000) return
      lastLeaveRef.current = now
      leftRef.current += 1

      if (mode === 'AUTO' && leftRef.current >= limit) {
        finish(`You left the test page ${limit} times, so it was submitted automatically.`)
        return
      }
      setNotice(
        `You left the test page. This has been recorded${mode === 'AUTO' ? ` (${leftRef.current} of ${limit}). At ${limit}, the test is submitted automatically.` : '.'}`
      )
    }
    const onVis = () => document.hidden && record()
    const onBlur = () => record()
    const onUnload = (e) => { e.preventDefault(); e.returnValue = '' }

    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('blur', onBlur)
    window.addEventListener('beforeunload', onUnload)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('beforeunload', onUnload)
    }
  }, [stage, quiz])

  const start = () => {
    const seconds = (quiz.timeLimitMinutes || 30) * 60
    setRemaining(seconds)
    setStage('taking')
  }

  const answered = (k) => answers[String(k)] !== undefined && String(answers[String(k)]).trim() !== ''

  const finish = async (why = '') => {
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitError('')
    setConfirm(false)
    setBusy(true)
    try {
      const data = await submitAttempt({
        quizId: qid,
        answers,
        leftPage: leftRef.current,
      })
      setExisting(data)
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
            <Link to="/student" className="btn btn--ghost">Back to my topics</Link>
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

  const submitted = existing && stage !== 'taking'

  if (submitted) {
    // Determine what message to show based on grading state and release state.
    const isFullyGraded = existing.graded
    const isReleased = quiz.category === 'QUIZ' || quiz.resultsReleased

    return (
      <div className="test-page">
        <header className="test-top">
          <div className="test-top__title"><strong>{quiz.title}</strong></div>
        </header>
        <main className="test-main">
          <section className="panel test-card">
            <h1>You’ve already submitted this quiz</h1>
            <p className="muted-text">Each quiz can only be attempted once.</p>
            {reason && <p className="flag-note">{reason}</p>}

            {isFullyGraded ? (
              isReleased ? (
                <p className="result">
                  Your score: <strong>{existing.score}/{quiz.totalMarks}</strong>
                </p>
              ) : (
                <p className="hint">Your score will appear on My grades once your teacher releases the results.</p>
              )
            ) : (
              <p className="hint">Your teacher still has to mark the written answers. Your result will appear on My grades once it’s released.</p>
            )}

            <Link to="/student/grades" className="btn btn--primary">Go to My grades</Link>
          </section>
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
              <li>The clock starts when you press Start. Keep this tab open until you submit.</li>
              <li>Your answers are only sent when you press Submit.</li>
              {quiz.guardMode !== 'OFF' && (
                <li>Leaving the page (switching tabs, minimising) is recorded and your teacher can see it.</li>
              )}
              {quiz.guardMode === 'AUTO' && (
                <li>If you leave the page {quiz.guardLimit} times, the quiz is submitted automatically.</li>
              )}
            </ul>
            <label className="agree">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              I understand and I’m ready to start.
            </label>
            <div className="test-actions">
              <Link to="/student" className="btn btn--ghost">Back</Link>
              <button className="btn btn--primary btn--lg" disabled={!agreed} onClick={start}>
                Start quiz
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
        <span className={`timer ${remaining < 300 ? 'timer--low' : ''}`} role="timer" aria-label="Time remaining">
          {fmtTime(Math.max(remaining, 0))}
        </span>
      </header>
      <main className="test-main">
        {notice && (
          <p className="flag-note" role="alert">
            {notice} <button className="link-btn" onClick={() => setNotice('')}>Dismiss</button>
          </p>
        )}
        <div className="take-layout">
          <aside className="panel">
            <h2>Questions</h2>
            <div className="nav-grid">
              {quiz.questions.map((_, k) => (
                <button
                  key={k}
                  className={`nav-q ${k === i ? 'is-current' : ''} ${answered(k) ? 'is-done' : ''}`}
                  onClick={() => setI(k)}
                  aria-label={`Question ${k + 1}${answered(k) ? ', answered' : ''}`}
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
              <div className="q-options" role="radiogroup" aria-label="Answer options">
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
                aria-label="Your answer"
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