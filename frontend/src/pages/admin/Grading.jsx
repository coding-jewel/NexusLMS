import { useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { gradingWeights } from '../../data/mock'

const FIELDS = [
  ['ASSIGNMENT', 'Assignments', 'Work students hand in'],
  ['TEST', 'Tests', 'On-screen tests during the term'],
  ['EXAM', 'Exams', 'End-of-term examinations'],
]

export default function Grading() {
  const [w, setW] = useState(gradingWeights)
  const [saved, setSaved] = useState(false)
  const total = Object.values(w).reduce((n, v) => n + (Number(v) || 0), 0)
  const ok = total === 100

  const change = (cat) => (e) => { setW({ ...w, [cat]: e.target.value }); setSaved(false) }
  const save = (e) => { e.preventDefault(); if (ok) setSaved(true) } // template only

  return (
    <AdminLayout title="Grading">
      <div className="page-head">
        <p>Set how much each type of work counts toward a student’s overall score. These weights apply to every course in your school.</p>
      </div>

      <form className="panel weights" onSubmit={save}>
        {FIELDS.map(([cat, label, hint]) => (
          <label key={cat} className="weights__row">
            <span><strong>{label}</strong><small>{hint}</small></span>
            <span className="weights__input">
              <input type="number" min="0" max="100" value={w[cat]} onChange={change(cat)} />%
            </span>
          </label>
        ))}

        <div className="weights__total">
          <span>Total</span>
          <span className={`badge ${ok ? 'badge--live' : 'badge--warn'}`}>{total}%</span>
        </div>
        {!ok && <p className="field__error">The weights must add up to 100%. Right now they add up to {total}%.</p>}

        <p className="hint">
          Changing the weights recalculates every student’s overall score straight away, including past terms.
          Students never see the weighted overall. They see their classwork totals, and test and exam results once a teacher releases them.
        </p>

        <div className="weights__actions">
          <button className="btn btn--primary" type="submit" disabled={!ok}>Save weights</button>
          {saved && <span className="saved" role="status">Saved</span>}
        </div>
      </form>
    </AdminLayout>
  )
}
