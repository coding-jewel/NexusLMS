import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import FilePicker from '../../components/FilePicker'
import { studentCourseDetail as d } from '../../data/mock'
import '../../styles/teacher.css'
import '../../styles/student.css'

export default function StudentAssignment() {
  const { id, aid } = useParams()
  const a = d.assignments.find((x) => String(x.id) === aid) || d.assignments[0]
  const [text, setText] = useState('')
  const [files, setFiles] = useState([])
  const [sent, setSent] = useState(null) // template only: the real flow creates the submission, then uploads each file

  const submit = (e) => { e.preventDefault(); setSent({ text, files: files.map((f) => f.name) }) }
  const mine = a.state === 'TODO' ? sent : { text: a.text, files: a.files, at: a.submittedAt }
  const graded = a.state === 'GRADED'

  return (
    <AppLayout role="student" title={a.title}>
      <Link to={`/student/courses/${id}`} className="back">← Back to course</Link>

      <div className="grade-layout">
        <section className="panel">
          <div className="panel__head">
            <h2>Instructions</h2>
            {a.overdue && !sent ? <span className="badge badge--warn">Past due</span> : null}
          </div>
          <p className={a.overdue && !sent ? 'late' : 'muted-text'}>Due {a.due}</p>
          <p className="sub-text">{a.instructions}</p>
          {a.attachments.length > 0 && (
            <>
              <h3 className="subhead">From your teacher</h3>
              <div className="files">{a.attachments.map((f) => <a key={f} href="#" className="file-chip" onClick={(e) => e.preventDefault()}>{f}</a>)}</div>
            </>
          )}
        </section>

        <section className="panel">
          {mine ? (
            <>
              <div className="panel__head">
                <h2>Your work</h2>
                <span className={`badge ${graded ? 'badge--live' : 'badge--test'}`}>{graded ? `${a.grade}/${a.total}` : 'Submitted'}</span>
              </div>
              <p className="muted-text">Submitted {mine.at || 'just now'}</p>
              {mine.text && <p className="sub-text">{mine.text}</p>}
              <div className="files">{mine.files.map((f) => <span key={f} className="file-chip">{f}</span>)}</div>
              {graded ? (
                <div className="feedback"><strong>Feedback from your teacher</strong><p>{a.feedback}</p></div>
              ) : (
                <p className="hint">Your teacher hasn’t graded this yet. Your grade will appear here.</p>
              )}
            </>
          ) : (
            <form className="modal__form" onSubmit={submit}>
              <h2>Your work</h2>
              {a.overdue && <p className="late">This was due {a.due}. You can still hand it in, but it will show as late.</p>}
              <label className="field"><span>Notes for your teacher</span><textarea className="select" rows="5" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your answer or add a note" /></label>
              <FilePicker label="Your files" onChange={setFiles} />
              <button className="btn btn--primary btn--lg" type="submit" disabled={!text.trim() && files.length === 0}>Hand in</button>
            </form>
          )}
        </section>
      </div>
    </AppLayout>
  )
}
