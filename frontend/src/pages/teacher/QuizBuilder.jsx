import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import '../../styles/teacher.css'

let nextId = 1
const blank = (type) => ({ id: nextId++, type, text: '', marks: 1, options: ['', ''], correct: 0 })

export default function QuizBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [minutes, setMinutes] = useState(30)
  const [category, setCategory] = useState('TEST')
  const [guard, setGuard] = useState('RECORD')
  const [limit, setLimit] = useState(3)
  const [questions, setQuestions] = useState([blank('MULTIPLE_CHOICE')])

  const update = (qid, patch) => setQuestions((qs) => qs.map((q) => (q.id === qid ? { ...q, ...patch } : q)))
  const remove = (qid) => setQuestions((qs) => qs.filter((q) => q.id !== qid))
  const setOption = (q, j, v) => update(q.id, { options: q.options.map((o, k) => (k === j ? v : o)) })
  const addOption = (q) => update(q.id, { options: [...q.options, ''] })
  const removeOption = (q, j) => update(q.id, { options: q.options.filter((_, k) => k !== j), correct: q.correct >= j && q.correct > 0 ? q.correct - 1 : q.correct })

  const total = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0)
  const done = () => navigate(`/teacher/courses/${id}`) // template only: real flow saves the quiz first

  return (
    <AppLayout role="teacher" title="New test or exam">
      <Link to={`/teacher/courses/${id}`} className="back">← Back to course</Link>

      <section className="panel quiz-meta">
        <label className="field"><span>Title</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Term 1 Mathematics Test" /></label>
        <label className="field">
          <span>Type</span>
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="TEST">Test</option>
            <option value="EXAM">Exam</option>
          </select>
        </label>
        <label className="field"><span>Opens</span><input type="datetime-local" /></label>
        <label className="field"><span>Closes</span><input type="datetime-local" /></label>
        <label className="field"><span>Time limit (minutes)</span><input type="number" min="1" value={minutes} onChange={(e) => setMinutes(e.target.value)} /></label>
        <label className="field"><span>Instructions</span><input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" /></label>
        <div className="quiz-meta__wide guard">
          <label className="field">
            <span>If a student leaves the test page</span>
            <select className="select" value={guard} onChange={(e) => setGuard(e.target.value)}>
              <option value="OFF">Do nothing</option>
              <option value="RECORD">Record it and show it to me</option>
              <option value="AUTO">Record it and auto-submit after a set number of times</option>
            </select>
          </label>
          {guard === 'AUTO' && (
            <label className="field marks"><span>Submit after</span><input type="number" min="1" max="10" value={limit} onChange={(e) => setLimit(e.target.value)} /></label>
          )}
        </div>
        <p className="hint quiz-meta__wide">Students get one attempt. The clock starts when they press Start, and answers are saved as they go. Leaving the page is only a record, not proof of cheating.</p>
      </section>

      {questions.map((q, i) => (
        <section key={q.id} className="panel q-card">
          <div className="q-card__head">
            <strong>Question {i + 1}</strong>
            <span className="badge">{q.type === 'MULTIPLE_CHOICE' ? 'Multiple choice' : 'Open-ended'}</span>
            <button type="button" className="link-btn" onClick={() => remove(q.id)} disabled={questions.length === 1}>Remove</button>
          </div>
          <label className="field"><span>Question</span><input value={q.text} onChange={(e) => update(q.id, { text: e.target.value })} placeholder="Type the question" /></label>

          {q.type === 'MULTIPLE_CHOICE' ? (
            <fieldset className="options">
              <legend>Options (select the correct one)</legend>
              {q.options.map((o, j) => (
                <div key={j} className="option">
                  <input type="radio" name={`correct-${q.id}`} checked={q.correct === j} onChange={() => update(q.id, { correct: j })} aria-label={`Option ${j + 1} is correct`} />
                  <input value={o} onChange={(e) => setOption(q, j, e.target.value)} placeholder={`Option ${j + 1}`} />
                  {q.options.length > 2 && <button type="button" className="link-btn" onClick={() => removeOption(q, j)}>Remove</button>}
                </div>
              ))}
              {q.options.length < 5 && <button type="button" className="link-btn" onClick={() => addOption(q)}>+ Add option</button>}
            </fieldset>
          ) : (
            <p className="hint">Students type their own answer. You’ll mark it by hand after they submit.</p>
          )}

          <label className="field marks"><span>Marks</span><input type="number" min="1" value={q.marks} onChange={(e) => update(q.id, { marks: e.target.value })} /></label>
        </section>
      ))}

      <div className="add-q">
        <button className="btn btn--ghost" onClick={() => setQuestions([...questions, blank('MULTIPLE_CHOICE')])}>+ Multiple choice</button>
        <button className="btn btn--ghost" onClick={() => setQuestions([...questions, blank('OPEN_ENDED')])}>+ Open-ended</button>
      </div>

      <div className="quiz-bar">
        <span><strong>{questions.length}</strong> questions · <strong>{total}</strong> marks</span>
        <div>
          <button className="btn btn--ghost" onClick={done}>Save draft</button>
          <button className="btn btn--primary" onClick={done}>Publish</button>
        </div>
      </div>
    </AppLayout>
  )
}
