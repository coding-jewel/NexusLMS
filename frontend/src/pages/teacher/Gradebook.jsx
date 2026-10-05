import { useState } from 'react'
import AppLayout from '../../components/AppLayout'
import { teacherCourses, gradebook as gb, gradingWeights as W } from '../../data/mock'
import '../../styles/teacher.css'

const GROUPS = [['ASSIGNMENT', 'Assignments'], ['TEST', 'Tests'], ['EXAM', 'Exams']]
const pct = (n) => (n === null ? '—' : `${Math.round(n)}%`)
const itemsIn = (cat) => gb.items.map((it, i) => ({ it, i })).filter((x) => x.it.category === cat)

// Group score = total earned / total possible, counting only items that have a score.
const groupPct = (scores, cat) => {
  const done = itemsIn(cat).filter(({ i }) => scores[i] !== null)
  const possible = done.reduce((n, { it }) => n + it.total, 0)
  return possible ? (done.reduce((n, { i }) => n + scores[i], 0) / possible) * 100 : null
}

// Weighted overall. Groups with no scores yet are left out and the rest are scaled up, so it is "so far".
const overall = (scores) => {
  let weight = 0, sum = 0, provisional = false
  GROUPS.forEach(([cat]) => {
    const p = groupPct(scores, cat)
    if (p === null) { provisional = true; return }
    weight += W[cat]; sum += p * W[cat]
  })
  return { value: weight ? sum / weight : null, provisional }
}

export default function Gradebook() {
  const [view, setView] = useState('classwork')
  const [courseId, setCourseId] = useState(teacherCourses[0].id)
  const groups = view === 'classwork' ? GROUPS.slice(0, 1) : GROUPS
  const anyProvisional = gb.rows.some((r) => overall(r.scores).provisional)
  const avg = (i) => {
    const v = gb.rows.map((r) => r.scores[i]).filter((x) => x !== null)
    return v.length ? (v.reduce((a, b) => a + b, 0) / v.length / gb.items[i].total) * 100 : null
  }

  return (
    <AppLayout role="teacher" title="Gradebook">
      <div className="page-head">
        <div className="seg" role="group" aria-label="Gradebook view">
          <button className={view === 'classwork' ? 'is-active' : ''} onClick={() => setView('classwork')}>Classwork</button>
          <button className={view === 'overall' ? 'is-active' : ''} onClick={() => setView('overall')}>Overall</button>
        </div>
        <label className="filter">
          <span>Course</span>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            {teacherCourses.map((c) => <option key={c.id} value={c.id}>{c.title} ({c.className})</option>)}
          </select>
        </label>
      </div>
      <p className="gb-note">
        {view === 'classwork'
          ? 'Assignments only. Students can see their own row of this view.'
          : 'Weighted by your school’s grading settings. Only teachers and admins can see this view.'}
      </p>

      <section className="panel">
        <div className="table-wrap">
          <table className="gb">
            <thead>
              <tr>
                <th rowSpan={2}>Student</th>
                {groups.map(([cat, label]) => (
                  <th key={cat} colSpan={itemsIn(cat).length + 1} className="gb__group">
                    {label}{view === 'overall' && <small>{W[cat]}% of overall</small>}
                  </th>
                ))}
                {view === 'overall' && <th rowSpan={2}>Overall</th>}
              </tr>
              <tr>
                {groups.flatMap(([cat]) => [
                  ...itemsIn(cat).map(({ it }) => <th key={it.title}>{it.title}<small>/{it.total}</small></th>),
                  <th key={`${cat}-sub`} className="gb__sub">Subtotal</th>,
                ])}
              </tr>
            </thead>
            <tbody>
              {gb.rows.map((r) => {
                const o = overall(r.scores)
                return (
                  <tr key={r.student}>
                    <td><strong>{r.student}</strong></td>
                    {groups.flatMap(([cat]) => [
                      ...itemsIn(cat).map(({ it, i }) => <td key={it.title} className={r.scores[i] === null ? 'gb__empty' : ''}>{r.scores[i] === null ? '—' : r.scores[i]}</td>),
                      <td key={`${cat}-sub`} className="gb__sub">{pct(groupPct(r.scores, cat))}</td>,
                    ])}
                    {view === 'overall' && (
                      <td>
                        <span className={`badge ${o.value !== null && o.value >= 50 ? 'badge--live' : ''}`}>{pct(o.value)}</span>
                        {o.provisional && <small className="sub">so far</small>}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <td>Class average</td>
                {groups.flatMap(([cat]) => [
                  ...itemsIn(cat).map(({ it, i }) => <td key={it.title}>{pct(avg(i))}</td>),
                  <td key={`${cat}-sub`} className="gb__sub" />,
                ])}
                {view === 'overall' && <td />}
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {view === 'overall' && anyProvisional && (
        <p className="gb-note">“So far” means a group has no scores yet (for example, the exam hasn’t been taken). The overall uses only the groups that have scores, with their weights scaled to 100.</p>
      )}
    </AppLayout>
  )
}
