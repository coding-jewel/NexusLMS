import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import { courseDetail, submissions as seed } from '../../data/mock'
import '../../styles/teacher.css'

export default function GradeSubmissions() {
  const { id, aid } = useParams()
  const assignment = courseDetail.assignments.find((a) => String(a.id) === aid) || courseDetail.assignments[0]
  const [subs, setSubs] = useState(seed)
  const [selId, setSelId] = useState(seed.find((s) => !s.graded)?.id ?? seed[0].id)
  const sel = subs.find((s) => s.id === selId)
  const [form, setForm] = useState({ grade: sel.grade, feedback: sel.feedback })

  const pick = (s) => { setSelId(s.id); setForm({ grade: s.grade, feedback: s.feedback }) }
  const save = (e) => {
    e.preventDefault()
    setSubs(subs.map((s) => (s.id === selId ? { ...s, ...form, graded: true } : s)))
  }
  const left = subs.filter((s) => !s.graded).length

  return (
    <AppLayout role="teacher" title={assignment.title}>
      <Link to={`/teacher/courses/${id}`} className="back">← Back to course</Link>
      <div className="grade-layout">
        <section className="panel">
          <div className="panel__head"><h2>Submissions</h2><span className="badge badge--warn">{left} to grade</span></div>
          <ul className="sub-list">
            {subs.map((s) => (
              <li key={s.id}>
                <button className={`sub-item ${s.id === selId ? 'is-active' : ''}`} onClick={() => pick(s)}>
                  <span><strong>{s.student}</strong><small>{s.at}</small></span>
                  <span className={`badge ${s.graded ? 'badge--live' : 'badge--warn'}`}>{s.graded ? `${s.grade}/100` : 'Ungraded'}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2>{sel.student}</h2>
          <p className="muted-text">Submitted {sel.at}</p>
          <p className="sub-text">{sel.text}</p>
          <div className="files">
            {sel.files.map((f) => <a key={f} href="#" className="file-chip" onClick={(e) => e.preventDefault()}>{f}</a>)}
          </div>
          <form className="modal__form" onSubmit={save}>
            <label className="field marks"><span>Grade (out of 100)</span><input type="number" min="0" max="100" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} required /></label>
            <label className="field"><span>Feedback</span><textarea className="select" rows="4" value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} placeholder="What went well, what to improve" /></label>
            <button className="btn btn--primary" type="submit">{sel.graded ? 'Update grade' : 'Save grade'}</button>
          </form>
        </section>
      </div>
    </AppLayout>
  )
}
