import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import { quizSample as quiz } from '../../data/mock'
import '../../styles/teacher.css'

const openMax = quiz.questions.filter((q) => q.type === 'OPEN_ENDED').reduce((n, q) => n + q.marks, 0)
const totalMarks = quiz.questions.reduce((n, q) => n + q.marks, 0)
const autoScore = (a) => quiz.questions.reduce((n, q, i) => (q.type === 'MULTIPLE_CHOICE' && a.answers[i] === q.correct ? n + q.marks : n), 0)

export default function MarkQuiz() {
  const { id } = useParams()
  const [attempts, setAttempts] = useState(quiz.attempts)
  const [selId, setSelId] = useState(attempts.find((a) => !a.graded)?.id ?? attempts[0].id)
  const sel = attempts.find((a) => a.id === selId)
  const [extra, setExtra] = useState(sel.extra)

  const pick = (a) => { setSelId(a.id); setExtra(a.extra) }
  const save = (e) => { e.preventDefault(); setAttempts(attempts.map((a) => (a.id === selId ? { ...a, extra, graded: true } : a))) }
  const score = (a) => autoScore(a) + (Number(a.extra) || 0)

  return (
    <AppLayout role="teacher" title="Mark quiz answers">
      <Link to={`/teacher/courses/${id}`} className="back">← Back to course</Link>
      <div className="grade-layout">
        <section className="panel">
          <div className="panel__head"><h2>Attempts</h2><span className="badge badge--warn">{attempts.filter((a) => !a.graded).length} to mark</span></div>
          <ul className="sub-list">
            {attempts.map((a) => (
              <li key={a.id}>
                <button className={`sub-item ${a.id === selId ? 'is-active' : ''}`} onClick={() => pick(a)}>
                  <span><strong>{a.student}</strong><small>Auto score {autoScore(a)}{a.leftPage > 0 && <> · <span className="flag">left page {a.leftPage}×</span></>}</small></span>
                  <span className={`badge ${a.graded ? 'badge--live' : 'badge--warn'}`}>{a.graded ? `${score(a)}/${totalMarks}` : 'To mark'}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2>{sel.student}</h2>
          {sel.leftPage > 0 && (
            <p className="flag-note">
              Left the test page {sel.leftPage} {sel.leftPage === 1 ? 'time' : 'times'}{sel.autoSubmitted ? ' and was submitted automatically' : ''}. This is a record, not proof of cheating.
            </p>
          )}
          <ol className="answers">
            {quiz.questions.map((q, i) => {
              const ans = sel.answers[i]
              const right = q.type === 'MULTIPLE_CHOICE' && ans === q.correct
              return (
                <li key={i}>
                  <p><strong>{q.text}</strong> <small>({q.marks} marks)</small></p>
                  {q.type === 'MULTIPLE_CHOICE' ? (
                    <p className={right ? 'ans ans--right' : 'ans ans--wrong'}>
                      {q.options[ans]} {right ? '✓ Correct' : `✗ Correct answer: ${q.options[q.correct]}`}
                    </p>
                  ) : (
                    <p className="sub-text">{ans}</p>
                  )}
                </li>
              )
            })}
          </ol>
          <form className="modal__form" onSubmit={save}>
            <label className="field marks">
              <span>Marks for open-ended (max {openMax})</span>
              <input type="number" min="0" max={openMax} value={extra} onChange={(e) => setExtra(e.target.value)} required />
            </label>
            <p className="hint">Total = {autoScore(sel)} auto + {Number(extra) || 0} yours = <strong>{autoScore(sel) + (Number(extra) || 0)}/{totalMarks}</strong></p>
            <button className="btn btn--primary" type="submit">{sel.graded ? 'Update marks' : 'Save marks'}</button>
          </form>
        </section>
      </div>
    </AppLayout>
  )
}
