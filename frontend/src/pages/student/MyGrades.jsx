import AppLayout from '../../components/AppLayout'
import { TypeBadge } from '../../components/Badges'
import { studentGrades as g } from '../../data/mock'
import '../../styles/teacher.css'
import '../../styles/student.css'

const pct = (a, b) => `${Math.round((a / b) * 100)}%`

export default function MyGrades() {
  return (
    <AppLayout role="student" title="My grades">
      <div className="page-head"><p>Your classwork totals and released test and exam results. Your teachers work out the overall score.</p></div>

      <h2 className="class-heading">Classwork</h2>
      {g.classwork.map((c) => {
        const graded = c.items.filter((x) => x.score !== null)
        const earned = graded.reduce((n, x) => n + x.score, 0)
        const possible = graded.reduce((n, x) => n + x.total, 0)
        return (
          <section key={c.course} className="panel grade-course">
            <div className="panel__head"><h2>{c.course}</h2><span className="muted-text">{c.className}</span></div>
            <ul className="rows">
              {c.items.map((x) => (
                <li key={x.title}>
                  <strong>{x.title}</strong>
                  {x.score === null ? <span className="badge">Awaiting grade</span> : <span>{x.score}/{x.total} · {pct(x.score, x.total)}</span>}
                </li>
              ))}
            </ul>
            <div className="subtotal"><span>Classwork total</span><strong>{possible ? `${earned}/${possible} · ${pct(earned, possible)}` : '—'}</strong></div>
          </section>
        )
      })}

      <h2 className="class-heading">Tests & Exams</h2>
      <section className="panel">
        <ul className="rows">
          {g.tests.map((t) => (
            <li key={t.title}>
              <div><strong>{t.title}</strong><small>{t.course}</small></div>
              <div className="rows__end">
                <TypeBadge category={t.category} />
                {t.released ? <span>{t.score}/{t.total} · {pct(t.score, t.total)}</span> : <span className="badge">Awaiting release</span>}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </AppLayout>
  )
}
