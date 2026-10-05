import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import Modal from '../../components/Modal'
import FilePicker from '../../components/FilePicker'
import { TypeBadge, StatusBadge } from '../../components/Badges'
import { teacherCourses, courseDetail as d, teacher } from '../../data/mock'
import '../../styles/teacher.css'

const TABS = ['Notes', 'Assignments', 'Tests & Exams', 'People']
const fmtDue = (v) => new Date(v).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

export default function CourseDetail() {
  const { id } = useParams()
  const course = teacherCourses.find((c) => String(c.id) === id) || teacherCourses[0]
  const [tab, setTab] = useState('Notes')
  const [published, setPublished] = useState(course.published)
  const [notes, setNotes] = useState(d.notes)
  const [assignments, setAssignments] = useState(d.assignments)
  const [quizzes, setQuizzes] = useState(d.quizzes)
  const toggleRelease = (qid) => setQuizzes(quizzes.map((q) => (q.id === qid ? { ...q, released: !q.released } : q)))
  const [modal, setModal] = useState(null) // 'note' | 'assignment' | null
  const close = () => setModal(null)

  const addNote = (e) => {
    e.preventDefault()
    const title = new FormData(e.target).get('title')
    setNotes([{ id: Date.now(), title, date: 'Today' }, ...notes])
    close()
  }
  const addAssignment = (e) => {
    e.preventDefault()
    const f = new FormData(e.target)
    setAssignments([{ id: Date.now(), title: f.get('title'), due: fmtDue(f.get('due')), submitted: 0, total: course.students, toGrade: 0 }, ...assignments])
    close()
  }

  return (
    <AppLayout role="teacher" title={course.title}>
      <Link to="/teacher" className="back">← My courses</Link>

      <div className="page-head">
        <p>{course.className} · {course.students} students</p>
        <button className={`btn ${published ? 'btn--ghost' : 'btn--primary'}`} onClick={() => setPublished(!published)}>
          {published ? 'Unpublish' : 'Publish course'}
        </button>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={`tabs__tab ${tab === t ? 'is-active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      <section className="panel" role="tabpanel">
        {tab === 'Notes' && (
          <>
            <div className="panel__head"><h2>Notes</h2><button className="btn btn--primary btn--sm" onClick={() => setModal('note')}>Add note</button></div>
            <ul className="rows">{notes.map((n) => (<li key={n.id}><strong>{n.title}</strong><span>{n.date}</span></li>))}</ul>
          </>
        )}

        {tab === 'Assignments' && (
          <>
            <div className="panel__head"><h2>Assignments</h2><button className="btn btn--primary btn--sm" onClick={() => setModal('assignment')}>New assignment</button></div>
            <ul className="rows">
              {assignments.map((a) => (
                <li key={a.id}>
                  <div><strong>{a.title}</strong><small>Due {a.due}</small></div>
                  <div className="rows__end">
                    <span>{a.submitted}/{a.total} submitted</span>
                    {a.toGrade > 0 ? <span className="badge badge--warn">{a.toGrade} to grade</span> : <span className="badge badge--live">All graded</span>}
                    <Link to={`/teacher/courses/${course.id}/assignments/${a.id}/grade`} className="btn btn--ghost btn--sm">Review</Link>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {tab === 'Tests & Exams' && (
          <>
            <div className="panel__head"><h2>Tests &amp; Exams</h2><Link to={`/teacher/courses/${course.id}/quizzes/new`} className="btn btn--primary btn--sm">New test or exam</Link></div>
            <ul className="rows">
              {quizzes.map((q) => (
                <li key={q.id}>
                  <div><strong>{q.title}</strong><small>{q.questions} questions · {q.minutes} min · one attempt</small></div>
                  <div className="rows__end">
                    <TypeBadge category={q.category} />
                    <StatusBadge status={q.status} />
                    <span>{q.attempts} attempts</span>
                    {q.attempts > 0 && <button className="btn btn--ghost btn--sm" onClick={() => toggleRelease(q.id)}>{q.released ? 'Hide results' : 'Release results'}</button>}
                    {q.attempts > 0 && <Link to={`/teacher/courses/${course.id}/quizzes/${q.id}/mark`} className="btn btn--ghost btn--sm">Mark answers</Link>}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {tab === 'People' && (
          <>
            <div className="panel__head"><h2>People</h2></div>
            <h3 className="subhead">Teacher</h3>
            <ul className="rows"><li><strong>{teacher.name}</strong><span>{teacher.email}</span></li></ul>
            <h3 className="subhead">Students ({course.students})</h3>
            <ul className="rows">{d.students.map((s) => (<li key={s}><strong>{s}</strong></li>))}</ul>
          </>
        )}
      </section>

      {modal === 'note' && (
        <Modal title="Add note" onClose={close}>
          <form className="modal__form" onSubmit={addNote}>
            <label className="field"><span>Title</span><input name="title" placeholder="Solving linear equations" required /></label>
            <label className="field"><span>Content</span><textarea className="select" name="body" rows="5" placeholder="Write the note here" /></label>
            <FilePicker label="Materials" />
            <button className="btn btn--primary btn--block" type="submit">Post note</button>
          </form>
        </Modal>
      )}
      {modal === 'assignment' && (
        <Modal title="New assignment" onClose={close}>
          <form className="modal__form" onSubmit={addAssignment}>
            <label className="field"><span>Title</span><input name="title" placeholder="Word problems set B" required /></label>
            <label className="field"><span>Instructions</span><textarea className="select" name="description" rows="4" placeholder="What should students do?" /></label>
            <label className="field"><span>Due date and time</span><input name="due" type="datetime-local" required /></label>
            <FilePicker label="Attachments" />
            <button className="btn btn--primary btn--block" type="submit">Create assignment</button>
          </form>
        </Modal>
      )}
    </AppLayout>
  )
}
