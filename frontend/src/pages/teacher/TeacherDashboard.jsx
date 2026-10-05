import { useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import Modal from '../../components/Modal'
import { classes, teacherCourses } from '../../data/mock'
import '../../styles/teacher.css'

export default function TeacherDashboard() {
  const [open, setOpen] = useState(false)
  const myClasses = [...new Set(teacherCourses.map((c) => c.className))]

  return (
    <AppLayout role="teacher" title="My courses">
      <div className="page-head">
        <p>Courses are the notes and materials you publish for a class.</p>
        <button className="btn btn--primary" onClick={() => setOpen(true)}>Create course</button>
      </div>

      <div className="course-grid">
        {teacherCourses.map((c, i) => (
          <Link key={c.id} to={`/teacher/courses/${c.id}`} className="course-card">
            <div className={`course-card__top tone-${i % 4}`}>
              <h2>{c.title}</h2>
              <span>{c.className}</span>
            </div>
            <div className="course-card__body">
              <p>{c.students} students · {c.assignments} assignments · {c.quizzes} tests & exams</p>
              <span className={`badge ${c.published ? 'badge--live' : ''}`}>{c.published ? 'Published' : 'Draft'}</span>
            </div>
          </Link>
        ))}
      </div>

      {open && (
        <Modal title="Create course" onClose={() => setOpen(false)}>
          <form className="modal__form" onSubmit={(e) => { e.preventDefault(); setOpen(false) }}>
            <label className="field"><span>Course title</span><input placeholder="Algebra Notes" required /></label>
            <label className="field">
              <span>Class</span>
              <select className="select" required defaultValue="">
                <option value="" disabled>Choose one of your classes</option>
                {myClasses.map((name) => <option key={name}>{name}</option>)}
              </select>
            </label>
            <label className="field"><span>Description</span><input placeholder="Optional" /></label>
            <p className="hint">New courses start as drafts. Students see them once you publish.</p>
            <button className="btn btn--primary btn--block" type="submit">Create course</button>
          </form>
        </Modal>
      )}
    </AppLayout>
  )
}
