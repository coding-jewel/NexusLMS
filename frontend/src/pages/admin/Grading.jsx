import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getGradingWeights, saveGradingWeights } from '../../api/grading'

// Keep MIN.tests and MIN.exams in step with MIN_TESTS and MIN_EXAMS in GradingRules.java.
// The server is the real check; this copy only lets the page warn while someone types.
const MIN = { tests: 20, exams: 50 }
const MAX = {
  tests: 100 - MIN.exams,
  exams: 100 - MIN.tests,
}
const KEYS = ['tests', 'exams']
const FIELDS = [
  ['tests', 'Tests', 'Tests taken in class during the term'],
  ['exams', 'Exams', 'End-of-term examinations'],
]

// The form holds text, so a box can be empty while someone types.
const toForm = (w) => ({ tests: String(w.tests), exams: String(w.exams) })

// Same rules, order and wording as GradingRules.problem on the server.
// Returns '' when the weights are fine.
function problemWith(form) {
  const n = {}
  for (const key of KEYS) {
    const text = form[key].trim()
    if (text === '') return 'Enter both weights.'
    n[key] = Number(text)
    if (!Number.isInteger(n[key])) return 'Use whole numbers for the weights.'
  }
  if (n.tests < MIN.tests) return `Tests must count for at least ${MIN.tests}%.`
  if (n.exams < MIN.exams) return `Exams must count for at least ${MIN.exams}%.`
  const total = n.tests + n.exams
  if (total !== 100) return `The weights must add up to 100%. Right now they add up to ${total}%.`
  return ''
}

export default function Grading() {
  const [baseline, setBaseline] = useState(null) // last weights from the server, as text; null while loading
  const [form, setForm] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [busy, setBusy] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const load = () => {
    setLoadError('')
    setBaseline(null)
    setForm(null)
    getGradingWeights()
      .then((w) => { const f = toForm(w); setBaseline(f); setForm(f) })
      .catch((err) => setLoadError(err.message))
  }
  useEffect(() => { load() }, [])

  const problem = form ? problemWith(form) : ''
  const total = form ? KEYS.reduce((sum, k) => sum + (Number(form[k]) || 0), 0) : 0
  const dirty = form && baseline ? KEYS.some((k) => form[k].trim() !== baseline[k]) : false

  const outOfRange = (key) => {
    const text = form[key].trim()
    const value = Number(text)
    return text === '' || !Number.isInteger(value) || value < MIN[key] || value > MAX[key]
  }

  const change = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value })
    setJustSaved(false)
    setSaveError('')
  }

  const save = async (e) => {
    e.preventDefault()
    if (problem || !dirty || busy) return
    setBusy(true)
    setSaveError('')
    try {
      const saved = await saveGradingWeights({
        tests: Number(form.tests),
        exams: Number(form.exams),
      })
      const f = toForm(saved)
      setBaseline(f)
      setForm(f)
      setJustSaved(true)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminLayout title="Grading">
      <div className="page-head">
        <p>Set how much tests and exams count toward a student’s overall score. Assignments and quizzes don’t count toward the class overall — they’re recorded inside each topic.</p>
      </div>

      {loadError ? (
        <section className="panel">
          <div className="empty">
            <p className="field__error" role="alert">{loadError}</p>
            <button className="btn btn--ghost" onClick={load}>Try again</button>
          </div>
        </section>
      ) : form === null ? (
        <section className="panel"><p className="empty">Loading weights…</p></section>
      ) : (
        <form className="panel weights" onSubmit={save} noValidate>
          {FIELDS.map(([key, label, hint]) => (
            <label key={key} className="weights__row">
              <span><strong>{label}</strong><small>{hint}</small></span>
              <span className="weights__input">
                <input
                  type="number"
                  inputMode="numeric"
                  step="1"
                  min={MIN[key]}
                  max={MAX[key]}
                  value={form[key]}
                  onChange={change(key)}
                  className={outOfRange(key) ? 'is-invalid' : ''}
                  aria-invalid={outOfRange(key)}
                  disabled={busy}
                />%
              </span>
            </label>
          ))}

          <div className="weights__total">
            <span>Total</span>
            <span className={`badge ${problem ? 'badge--warn' : 'badge--live'}`}>{total}%</span>
          </div>
          {problem && <p className="field__error" role="alert">{problem}</p>}
          {saveError && <p className="field__error" role="alert">{saveError}</p>}

          <p className="hint">
            Limits: Tests {MIN.tests}–{MAX.tests}%, Exams {MIN.exams}–{MAX.exams}%.
          </p>
          <p className="hint">
            Changing the weights recalculates every student’s overall score straight away, including past terms.
            Students never see the weighted overall. They see their classwork totals, and test and exam results once a teacher releases them.
          </p>

          <div className="weights__actions">
            <button className="btn btn--primary" type="submit" disabled={busy || !dirty || Boolean(problem)}>
              {busy ? 'Saving…' : 'Save weights'}
            </button>
            {justSaved && <span className="saved" role="status">Saved</span>}
          </div>
        </form>
      )}
    </AdminLayout>
  )
}