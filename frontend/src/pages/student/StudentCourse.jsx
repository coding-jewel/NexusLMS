import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import { TypeBadge } from '../../components/Badges'
import { studentCourses, studentCourseDetail as d } from '../../data/mock'
import '../../styles/teacher.css'
import '../../styles/student.css'

const TABS = ['Notes', 'Assignments', 'Tests & Exams']

function AssignmentState({ a }) {
  if (a.state === 'GRADED') return <span className="badge badge--live">{a.grade}/{a.total}</span>
  if (a.state === 'SUBMITTED') return <span className="badge badge--test">Submitted</span>
  return a.overdue ? <span className="badge badge--warn">Past due</span> : <span className="badge">To do</span>
}

function TestState({ t, courseId }) {
  const to = `/student/courses/${courseId}/tests/${t.id}`
  if (t.state === 'AVAILABLE') return <Link to={to} className="btn btn--primary btn--sm">Start</Link>
  if (t.state === 'UPCOMING') return <span className="muted-text">Opens {t.opens}</span>
  return (
    <>
      {t.released ? <span className="badge badge--live">{t.score}/{t.total}</span> : <span className="badge">Result not released yet</span>}
      <Link to={to} className="btn btn--ghost btn--sm">View</Link>
    </>
  )
}

export default function StudentCourse() {
  const { id } = useParams()
  const course = studentCourses.find((c) => String(c.id) === id) || studentCourses[0]
  const [tab, setTab] = useState('Notes')

  return (
    <AppLayout role="student" title={course.title}>
      <Link to="/student" className="back">← My courses</Link>
      <div className="page-head"><p>{course.teacher}</p></div>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={`tabs__tab ${tab === t ? 'is-active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      <section className="panel" role="tabpanel">
        {tab === 'Notes' && (
          <ul className="rows">
            {d.notes.map((n) => (
              <li key={n.id}>
                <div>
                  <strong>{n.title}</strong>
                  {n.files.length > 0 && <div className="files">{n.files.map((f) => <a key={f} href="#" className="file-chip" onClick={(e) => e.preventDefault()}>{f}</a>)}</div>}
                </div>
                <span>{n.date}</span>
              </li>
            ))}
          </ul>
        )}

        {tab === 'Assignments' && (
          <ul className="rows">
            {d.assignments.map((a) => (
              <li key={a.id}>
                <div><strong>{a.title}</strong><small className={a.overdue ? 'late' : ''}>Due {a.due}</small></div>
                <div className="rows__end">
                  <AssignmentState a={a} />
                  <Link to={`/student/courses/${course.id}/assignments/${a.id}`} className="btn btn--ghost btn--sm">{a.state === 'TODO' ? 'Open' : 'View'}</Link>
                </div>
              </li>
            ))}
          </ul>
        )}

        {tab === 'Tests & Exams' && (
          <ul className="rows">
            {d.tests.map((t) => (
              <li key={t.id}>
                <div><strong>{t.title}</strong><small>{t.questions} questions · {t.minutes} min · one attempt{t.closes ? ` · closes ${t.closes}` : ''}</small></div>
                <div className="rows__end"><TypeBadge category={t.category} /><TestState t={t} courseId={course.id} /></div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppLayout>
  )
}
