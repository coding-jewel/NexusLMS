import { useState } from 'react'
import AppLayout from '../../components/AppLayout'
import { teacherCourses, gradebook as gb } from '../../data/mock'
import '../../styles/teacher.css'

const pct = (n) => (n === null ? '—' : `${Math.round(n)}%`)

export default function Gradebook() {
  const [courseId, setCourseId] = useState(teacherCourses[0].id) // template: same sample data for every course

  const overall = (scores) => {
    const got = scores.reduce((s, v, i) => (v === null ? s : s + v), 0)
    const poss = scores.reduce((s, v, i) => (v === null ? s : s + gb.items[i].total), 0)
    return poss ? (got / poss) * 100 : null
  }
  const average = (i) => {
    const vals = gb.rows.map((r) => r.scores[i]).filter((v) => v !== null)
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length / gb.items[i].total) * 100 : null
  }

  return (
    <AppLayout role="teacher" title="Gradebook">
      <div className="page-head">
        <p>Scores for every student. A dash means nothing has been submitted or graded yet.</p>
        <label className="filter">
          <span>Course</span>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            {teacherCourses.map((c) => <option key={c.id} value={c.id}>{c.title} ({c.className})</option>)}
          </select>
        </label>
      </div>

      <section className="panel">
        <div className="table-wrap">
          <table className="gb">
            <thead>
              <tr>
                <th>Student</th>
                {gb.items.map((it) => (<th key={it.title}>{it.title}<small>{it.type} · /{it.total}</small></th>))}
                <th>Overall</th>
              </tr>
            </thead>
            <tbody>
              {gb.rows.map((r) => {
                const o = overall(r.scores)
                return (
                  <tr key={r.student}>
                    <td><strong>{r.student}</strong></td>
                    {r.scores.map((v, i) => (<td key={i} className={v === null ? 'gb__empty' : ''}>{v === null ? '—' : v}</td>))}
                    <td><span className={`badge ${o !== null && o >= 50 ? 'badge--live' : ''}`}>{pct(o)}</span></td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr><td>Class average</td>{gb.items.map((_, i) => <td key={i}>{pct(average(i))}</td>)}<td /></tr>
            </tfoot>
          </table>
        </div>
      </section>
    </AppLayout>
  )
}
