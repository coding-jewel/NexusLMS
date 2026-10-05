import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Modal from '../../components/Modal'
import { TypeBadge } from '../../components/Badges'
import { studentCourseDetail as d, studentTest as quiz } from '../../data/mock'
import '../../styles/teacher.css'
import '../../styles/student.css'

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export default function TakeTest() {
  const { id, tid } = useParams()
  const test = d.tests.find((t) => String(t.id) === tid) || d.tests[0]
  const { mode, limit } = quiz.guard
  const n = quiz.questions.length

  const [stage, setStage] = useState('rules') // rules | taking | done
  const [agreed, setAgreed] = useState(false)
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState({}) // keyed by question number, like the API
  const [notice, setNotice] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [reason, setReason] = useState('')
  const [remaining, setRemaining] = useState(test.minutes * 60)
  const leftCount = useRef(0)
  const lastLeave = useRef(0)

  const finish = (why = '') => { setReason(why); setConfirm(false); setStage('done') }
  const answered = (k) => answers[k] !== undefined && String(answers[k]).trim() !== ''

  useEffect(() => {
    if (stage !== 'taking') return
    const timer = setInterval(() => setRemaining((r) => r - 1), 1000)
    return () => clearInterval(timer)
  }, [stage])

  useEffect(() => {
    if (stage === 'taking' && remaining <= 0) finish('Time ran out, so your answers were submitted automatically.')
  }, [remaining, stage])

  // Leaving the page is recorded. Switching tabs can fire two events at once, so count once per 2 seconds.
  useEffect(() => {
    if (stage !== 'taking') return
    const record = () => {
      const now = Date.now()
      if (now - lastLeave.current < 2000) return
      lastLeave.current = now
      leftCount.current += 1
      if (mode === 'AUTO' && leftCount.current >= limit) return finish(`You left the test page ${limit} times, so it was submitted automatically.`)
      if (mode !== 'OFF') {
        setNotice(`You left the test page. This has been recorded${mode === 'AUTO' ? ` (${leftCount.current} of ${limit}). At ${limit}, the test is submitted automatically.` : '.'}`)
      }
    }
    const onVisibility = () => document.hidden && record()
    const onUnload = (e) => { e.preventDefault(); e.returnValue = '' }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', record)
    window.addEventListener('beforeunload', onUnload)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', record)
      window.removeEventListener('beforeunload', onUnload)
    }
  }, [stage])

  const back = <Link to={`/student/courses/${id}`} className="btn btn--ghost">Back to course</Link>
  const hasWritten = quiz.questions.some((q) => q.type === 'OPEN_ENDED')
  const unanswered = quiz.questions.filter((_, k) => !answered(k)).length
  const q = quiz.questions[i]

  let body
  if (test.state === 'SUBMITTED') {
    body = (
      <section className="panel test-card">
        <h1>You’ve already submitted this {test.category === 'EXAM' ? 'exam' : 'test'}</h1>
        <p className="muted-text">Each test and exam can only be attempted once.</p>
        {test.released
          ? <p className="result">Your result: <strong>{test.score}/{test.total}</strong></p>
          : <p className="hint">Your result will appear on your My grades page once your teacher releases it.</p>}
        {back}
      </section>
    )
  } else if (test.state === 'UPCOMING') {
    body = (
      <section className="panel test-card">
        <h1>This {test.category === 'EXAM' ? 'exam' : 'test'} isn’t open yet</h1>
        <p className="muted-text">It opens {test.opens}.</p>
        {back}
      </section>
    )
  } else if (stage === 'rules') {
    body = (
      <section className="panel test-card">
        <h1>Before you start</h1>
        <dl className="facts">
          <div><dt>Questions</dt><dd>{n}</dd></div>
          <div><dt>Time limit</dt><dd>{test.minutes} minutes</dd></div>
          <div><dt>Attempts</dt><dd>One</dd></div>
        </dl>
        <ul className="rules">
          <li>The clock starts when you press Start, and it keeps running if you close the page.</li>
          <li>Your answers are saved as you go.</li>
          {mode !== 'OFF' && <li>Leaving this page, for example by switching tabs, is recorded and your teacher can see it.</li>}
          {mode === 'AUTO' && <li>If you leave the page {limit} times, the test is submitted automatically.</li>}
          {hasWritten && <li>Written answers are marked by your teacher, so your full result comes later.</li>}
        </ul>
        <label className="agree">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          I understand and I’m ready to start.
        </label>
        <div className="test-actions">
          {back}
          <button className="btn btn--primary btn--lg" disabled={!agreed} onClick={() => setStage('taking')}>Start {test.category === 'EXAM' ? 'exam' : 'test'}</button>
        </div>
      </section>
    )
  } else if (stage === 'taking') {
    body = (
      <>
        {notice && <p className="flag-note" role="alert">{notice} <button className="link-btn" onClick={() => setNotice('')}>Dismiss</button></p>}
        <div className="take-layout">
          <aside className="panel">
            <h2>Questions</h2>
            <div className="nav-grid">
              {quiz.questions.map((_, k) => (
                <button key={k} className={`nav-q ${k === i ? 'is-current' : ''} ${answered(k) ? 'is-done' : ''}`} onClick={() => setI(k)} aria-label={`Question ${k + 1}${answered(k) ? ', answered' : ''}`}>{k + 1}</button>
              ))}
            </div>
            <p className="hint">{n - unanswered} of {n} answered. Saved automatically.</p>
            <button className="btn btn--primary btn--block" onClick={() => setConfirm(true)}>Submit</button>
          </aside>

          <section className="panel">
            <p className="muted-text">Question {i + 1} of {n} · {q.marks} marks</p>
            <h2 className="q-text">{q.text}</h2>
            {q.type === 'MULTIPLE_CHOICE' ? (
              <div className="q-options" role="radiogroup" aria-label="Answer options">
                {q.options.map((o, j) => (
                  <label key={j} className={`q-opt ${answers[i] === j ? 'is-picked' : ''}`}>
                    <input type="radio" name={`q${i}`} checked={answers[i] === j} onChange={() => setAnswers({ ...answers, [i]: j })} />
                    {o}
                  </label>
                ))}
              </div>
            ) : (
              <textarea className="select" rows="8" value={answers[i] || ''} onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })} placeholder="Type your answer" aria-label="Your answer" />
            )}
            <div className="test-actions">
              <button className="btn btn--ghost" disabled={i === 0} onClick={() => setI(i - 1)}>Previous</button>
              {i < n - 1
                ? <button className="btn btn--primary" onClick={() => setI(i + 1)}>Next</button>
                : <button className="btn btn--primary" onClick={() => setConfirm(true)}>Review and submit</button>}
            </div>
          </section>
        </div>

        {confirm && (
          <Modal title="Submit your answers?" onClose={() => setConfirm(false)}>
            <div className="modal__form">
              <p>{unanswered > 0 ? `You have ${unanswered} unanswered ${unanswered === 1 ? 'question' : 'questions'}.` : 'You’ve answered every question.'} You can’t change your answers after submitting.</p>
              <button className="btn btn--primary btn--block" onClick={() => finish()}>Submit now</button>
              <button className="btn btn--ghost btn--block" onClick={() => setConfirm(false)}>Keep working</button>
            </div>
          </Modal>
        )}
      </>
    )
  } else {
    body = (
      <section className="panel test-card">
        <h1>Submitted</h1>
        {reason && <p className="flag-note">{reason}</p>}
        <p>Your answers have been received.</p>
        {hasWritten && <p className="hint">Pending review: your teacher still has to mark your written answers.</p>}
        <p className="hint">Your result will appear on your My grades page once your teacher releases it.</p>
        <div className="test-actions">{back}<Link to="/student/grades" className="btn btn--primary">Go to My grades</Link></div>
      </section>
    )
  }

  return (
    <div className="test-page">
      <header className="test-top">
        <div className="test-top__title"><strong>{test.title}</strong><TypeBadge category={test.category} /></div>
        {stage === 'taking' && <span className={`timer ${remaining < 300 ? 'timer--low' : ''}`} role="timer" aria-label="Time remaining">{fmt(Math.max(remaining, 0))}</span>}
      </header>
      <main className="test-main">{body}</main>
    </div>
  )
}
