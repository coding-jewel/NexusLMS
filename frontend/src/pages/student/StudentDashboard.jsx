import { useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import Modal from '../../components/Modal'
import { studentCourses, studentCourseDetail as d, student } from '../../data/mock'
import '../../styles/teacher.css'
import '../../styles/student.css'

export default function StudentDashboard() {
  const [joinOpen, setJoinOpen] = useState(false)
  const dueSoon = [
    ...d.assignments.filter((a) => a.state === 'TODO').map((a) => ({ key: `a${a.id}`, title: a.title, meta: a.overdue ? `Was due ${a.due}` : `Due ${a.due}`, overdue: a.overdue, to: `/student/courses/1/assignments/${a.id}` })),
    ...d.tests.filter((t) => t.state === 'AVAILABLE').map((t) => ({ key: `t${t.id}`, title: t.title, meta: `Open until ${t.closes}`, overdue: false, to: '/student/courses/1' })),
  ]

  return (
    <AppLayout role="student" title="My courses">
      <div className="page-head">
        <p>{student.classes.join(' · ')}</p>
        <button className="btn btn--ghost" onClick={() => setJoinOpen(true)}>Join another class</button>
      </div>

      <div className="student-home">
        <div className="class-sections">
          {student.classes.map((cls) => {
            const courses = studentCourses.filter((c) => c.className === cls)
            return (
              <section key={cls}>
                <h2 className="class-heading">{cls}</h2>
                {courses.length === 0 ? <p className="muted-text">No courses published in this class yet.</p> : (
                  <div className="course-grid">
                    {courses.map((c, i) => (
                      <Link key={c.id} to={`/student/courses/${c.id}`} className="course-card">
                        <div className={`course-card__top tone-${(c.id + i) % 4}`}>
                          <h2>{c.title}</h2>
                          <span>{c.teacher}</span>
                        </div>
                        <div className="course-card__body">
                          <p>{c.todo > 0 ? `${c.todo} to do` : 'Nothing due'}</p>
                          {c.todo > 0 && <span className="badge badge--warn">{c.todo}</span>}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>

        <aside className="panel due">
          <h2>To do</h2>
          {dueSoon.length === 0 ? <p className="empty">You’re all caught up.</p> : (
            <ul className="due__list">
              {dueSoon.map((x) => (
                <li key={x.key}>
                  <Link to={x.to}><strong>{x.title}</strong><small className={x.overdue ? 'late' : ''}>{x.meta}</small></Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      {joinOpen && (
        <Modal title="Join another class" onClose={() => setJoinOpen(false)}>
          <form className="modal__form" onSubmit={(e) => { e.preventDefault(); setJoinOpen(false) }}>
            <label className="field"><span>Class code</span><input placeholder="GLD-4K7Q" required /></label>
            <p className="hint">The class is added to your account. You don’t need to register again.</p>
            <button className="btn btn--primary btn--block" type="submit">Join class</button>
          </form>
        </Modal>
      )}
    </AppLayout>
  )
}
