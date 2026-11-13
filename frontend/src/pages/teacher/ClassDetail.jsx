import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import Modal from '../../components/Modal'
import { TypeBadge } from '../../components/Badges'
import { listMyTestsAndExams, setQuizReleased, deleteQuiz } from '../../api/quizzes'
import { listCourses, createCourse, deleteCourse } from '../../api/courses'
import { getClass, getClassPeople, getClassGradebook, updateGradingSettings } from '../../api/classes'
import '../../styles/teacher.css'

const TABS = ['Topics', 'Exams', 'Gradebook', 'People']

function ClassGradebookView({ gb, classData, onSaveSettings }) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [form, setForm] = useState({
    gradingMethod: classData.gradingMethod || 'RAW',
    assignmentWeight: classData.assignmentWeight ?? 30,
    quizWeight: classData.quizWeight ?? 30,
    examWeight: classData.examWeight ?? 40,
  })
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!gb) return <p className="empty">Loading gradebook…</p>
  if (gb.rows.length === 0) return <p className="empty">No students in this class yet.</p>

  const downloadCSV = () => {
    let csv = 'Student,Assignments,Quizzes,Exams,Overall\n'
    gb.rows.forEach(r => {
      const a = r.assignmentPct != null ? `${Math.round(r.assignmentPct)}%` : '—'
      const q = r.quizPct != null ? `${Math.round(r.quizPct)}%` : '—'
      const e = r.examPct != null ? `${Math.round(r.examPct)}%` : '—'
      const o = r.overall != null ? `${Math.round(r.overall)}%` : '—'
      csv += `"${r.studentName}",${a},${q},${e},${o}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `gradebook-${classData.name.replace(/\s+/g, '_')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    setFormError('')
    if (form.gradingMethod === 'WEIGHTED' && (form.assignmentWeight + form.quizWeight + form.examWeight !== 100)) {
      setFormError('Weights must add up to exactly 100%.')
      return
    }
    setBusy(true)
    try {
      await onSaveSettings(form)
      setSettingsOpen(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const fmtPct = (val) => val != null ? `${Math.round(val)}%` : '—'

  const calculateAverage = (key) => {
    const validScores = gb.rows.map(r => r[key]).filter(v => v != null)
    if (validScores.length === 0) return null
    return validScores.reduce((sum, v) => sum + v, 0) / validScores.length
  }

  const avgAssign = calculateAverage('assignmentPct')
  const avgQuiz = calculateAverage('quizPct')
  const avgExam = calculateAverage('examPct')
  const avgOverall = calculateAverage('overall')

  return (
    <>
      <div className="panel__head panel__head--flex-start">
        <div>
          <h2>Class Gradebook</h2>
          <p className="muted-text mt-sm">
            {gb.rows.length} {gb.rows.length === 1 ? 'student' : 'students'} ·{' '}
            {gb.gradingMethod === 'WEIGHTED' 
              ? `Weighted (Assignments ${classData.assignmentWeight ?? 30}%, Quizzes ${classData.quizWeight ?? 30}%, Exams ${classData.examWeight ?? 40}%)` 
              : 'Raw Points'}
          </p>
        </div>
        
        <div className="settings-buttons">
          <button className="btn btn--ghost btn--sm" onClick={downloadCSV}>
            Download CSV
          </button>
          <button className="btn btn--ghost btn--sm" onClick={() => setSettingsOpen(true)}>
            Grading Settings
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="gb">
          <thead>
            <tr>
              <th>Student</th>
              <th>Assignments</th>
              <th>Quizzes</th>
              <th>Exams</th>
              <th className="gb__group">Overall</th>
            </tr>
          </thead>
          <tbody>
            <tr className="gb__class-average">
              <td><strong>Class Average</strong></td>
              <td className={avgAssign == null ? 'gb__empty' : ''}><strong>{fmtPct(avgAssign)}</strong></td>
              <td className={avgQuiz == null ? 'gb__empty' : ''}><strong>{fmtPct(avgQuiz)}</strong></td>
              <td className={avgExam == null ? 'gb__empty' : ''}><strong>{fmtPct(avgExam)}</strong></td>
              <td className="gb__group"><strong>{fmtPct(avgOverall)}</strong></td>
            </tr>

            {gb.rows.map((r) => (
              <tr key={r.studentId}>
                <td><strong>{r.studentName}</strong></td>
                <td className={r.assignmentPct == null ? 'gb__empty' : ''}>{fmtPct(r.assignmentPct)}</td>
                <td className={r.quizPct == null ? 'gb__empty' : ''}>{fmtPct(r.quizPct)}</td>
                <td className={r.examPct == null ? 'gb__empty' : ''}>{fmtPct(r.examPct)}</td>
                <td className="gb__group">{fmtPct(r.overall)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="gb-note">Averages are based only on items that have been graded. Click into a Topic to see item-by-item scores.</p>

      {settingsOpen && (
        <Modal title="Grading Settings" onClose={() => setSettingsOpen(false)}>
          <form className="modal__form" onSubmit={handleSaveSettings}>
            <div className="field">
              <span>Grading Method</span>
              <select 
                className="select" 
                value={form.gradingMethod} 
                onChange={(e) => setForm({ ...form, gradingMethod: e.target.value })}
              >
                <option value="RAW">Raw Points (Total earned / Total possible)</option>
                <option value="WEIGHTED">Weighted Categories</option>
              </select>
            </div>
            
            {form.gradingMethod === 'WEIGHTED' && (
              <div className="field-row">
                <label className="field">
                  <span>Assignments (%)</span>
                  <input type="number" min="0" max="100" value={form.assignmentWeight} onChange={(e) => setForm({ ...form, assignmentWeight: Number(e.target.value) })} />
                </label>
                <label className="field">
                  <span>Quizzes (%)</span>
                  <input type="number" min="0" max="100" value={form.quizWeight} onChange={(e) => setForm({ ...form, quizWeight: Number(e.target.value) })} />
                </label>
                <label className="field">
                  <span>Exams (%)</span>
                  <input type="number" min="0" max="100" value={form.examWeight} onChange={(e) => setForm({ ...form, examWeight: Number(e.target.value) })} />
                </label>
              </div>
            )}

            <p className="hint">If a category has no graded items, its weight is ignored.</p>
            {formError && <p className="field__error" role="alert">{formError}</p>}
            <div className="confirm-actions">
              <button className="btn btn--ghost" type="button" onClick={() => setSettingsOpen(false)}>Cancel</button>
              <button className="btn btn--primary" type="submit" disabled={busy}>
                {busy ? 'Saving…' : 'Save Settings'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

export default function ClassDetail() {
  const { classId } = useParams()
  
  const [classData, setClassData] = useState(null)
  const [topics, setTopics] = useState([])
  const [people, setPeople] = useState(null)
  const [gradebook, setGradebook] = useState(null)
  const [tab, setTab] = useState('Topics')
  const [error, setError] = useState('')
  const [examsError, setExamsError] = useState('') // NEW: For inline exam errors

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleteBusy, setDeleteBusy] = useState(false)

  const [exams, setExams] = useState(null)
  const [busyExamId, setBusyExamId] = useState(null)
  const [confirmDeleteExam, setConfirmDeleteExam] = useState(null)
  const [deleteExamError, setDeleteExamError] = useState('')

  const load = () => {
    setError('')
    Promise.all([
      getClass(classId),
      listCourses(), 
      getClassPeople(classId)
    ])
      .then(([foundClass, allCourses, classPeople]) => {
        setClassData(foundClass)
        setTopics(allCourses.filter(c => c.classId === classId))
        setPeople(classPeople)
      })
      .catch(err => setError(err.message))
  }

  useEffect(() => { load() }, [classId])

  useEffect(() => {
    if (tab === 'Gradebook' && !gradebook) {
      getClassGradebook(classId).then(setGradebook).catch(console.error)
    }
    if (tab === 'Exams' && !exams) {
      listMyTestsAndExams()
        .then(list => setExams(list.filter(q => q.classId === classId)))
        .catch(console.error)
    }
  }, [tab, classId, gradebook, exams])

  const handleSaveSettings = async (settings) => {
    const updated = await updateGradingSettings(classId, settings)
    setClassData(updated)
    const newGb = await getClassGradebook(classId)
    setGradebook(newGb)
  }

  const openCreate = () => {
    setForm({ title: '', description: '' })
    setFormError('')
    setOpen(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError('')
    setBusy(true)
    try {
      const created = await createCourse({
        classId,
        title: form.title.trim(),
        description: form.description.trim() || null,
      })
      setTopics([...topics, created])
      setOpen(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const openDeleteConfirm = (topic) => {
    setDeleteError('')
    setConfirmDelete(topic)
  }

  const handleDelete = async () => {
    setDeleteError('')
    setDeleteBusy(true)
    try {
      await deleteCourse(confirmDelete.id)
      setTopics(topics.filter(t => t.id !== confirmDelete.id))
      setConfirmDelete(null)
      setGradebook(null) 
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleteBusy(false)
    }
  }

  const toggleRelease = async (q) => {
    setExamsError('') // Clear previous errors
    setBusyExamId(q.id)
    try {
      const updated = await setQuizReleased(q.id, !q.resultsReleased)
      setExams(exams.map((x) => (x.id === q.id ? updated : x)))
    } catch (err) {
      setExamsError(err.message) // Show inline error instead of alert
    } finally {
      setBusyExamId(null)
    }
  }

  const runDeleteExam = async () => {
    setDeleteExamError('')
    setBusyExamId(confirmDeleteExam.id)
    try {
      await deleteQuiz(confirmDeleteExam.id)
      setExams(exams.filter((x) => x.id !== confirmDeleteExam.id))
      setConfirmDeleteExam(null)
    } catch (err) {
      setDeleteExamError(err.message)
    } finally {
      setBusyExamId(null)
    }
  }

  if (error) {
    return (
      <AppLayout role="teacher" title="Class">
        <section className="panel">
          <div className="empty">
            <p className="field__error" role="alert">{error}</p>
            <Link to="/teacher/classes" className="btn btn--ghost">Back to classes</Link>
          </div>
        </section>
      </AppLayout>
    )
  }

  if (!classData) {
    return (
      <AppLayout role="teacher" title="Class">
        <section className="panel"><p className="empty">Loading class…</p></section>
      </AppLayout>
    )
  }

  const studentCount = people?.students?.length ?? 0

  return (
    <AppLayout role="teacher" title={classData.name}>
      <Link to="/teacher/classes" className="back">← My classes</Link>

      <div className="page-head">
        <p>{studentCount} {studentCount === 1 ? 'student' : 'students'} enrolled · {topics.length} {topics.length === 1 ? 'topic' : 'topics'}</p>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`tabs__tab ${tab === t ? 'is-active' : ''}`}
            onClick={() => setTab(t)}
          >{t}</button>
        ))}
      </div>

      <section className="panel" role="tabpanel">
        {tab === 'Topics' && (
          <>
            <div className="panel__head">
              <h2>Topics</h2>
              <button className="btn btn--primary btn--sm" onClick={openCreate}>Create topic</button>
            </div>
            {topics.length === 0 ? (
              <p className="empty">No topics yet. Create your first one to get started.</p>
            ) : (
              <div className="course-grid topic-grid-margin">
                {topics.map((c, i) => (
                  <div key={c.id} className="course-card">
                    <Link to={`/teacher/courses/${c.id}`} className="course-card__link">
                      <div className={`course-card__top tone-${i % 4}`}>
                        <h2>{c.title}</h2>
                      </div>
                    </Link>
                    <div className="course-card__body">
                      <p>
                        {c.assignmentCount} {c.assignmentCount === 1 ? 'assignment' : 'assignments'} ·{' '}
                        {c.quizCount} {c.quizCount === 1 ? 'quiz' : 'quizzes'}
                      </p>
                      <div className="row-actions">
                        <span className={`badge ${c.published ? 'badge--live' : ''}`}>{c.published ? 'Published' : 'Draft'}</span>
                        <button className="btn btn--ghost btn--sm btn--danger" onClick={() => openDeleteConfirm(c)}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'Exams' && (
          <>
            <div className="panel__head">
              <h2>Exams</h2>
              <Link to={`/teacher/quizzes/new?class=${classId}`} className="btn btn--primary btn--sm">New exam</Link>
            </div>
            
            {examsError && <p className="field__error mb-2" role="alert">{examsError}</p>}
            
            {exams === null ? (
              <p className="empty">Loading…</p>
            ) : exams.length === 0 ? (
              <p className="empty">No exams yet. Create your first one.</p>
            ) : (
              <div className="table-wrap">
                <table className="table-exams">
                  <thead>
                    <tr><th>Title</th><th>Type</th><th>Questions</th><th>Time</th><th>Status</th><th>Results</th><th /></tr>
                  </thead>
                  <tbody>
                    {exams.map((q) => (
                      <tr key={q.id}>
                        <td><strong>{q.title}</strong></td>
                        <td><TypeBadge category={q.category} /></td>
                        <td>{q.questions?.length ?? 0}</td>
                        <td>{q.timeLimitMinutes ? `${q.timeLimitMinutes} min` : '—'}</td>
                        <td>
                          <span className={`badge ${q.published ? 'badge--live' : ''}`}>
                            {q.published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="cell-wrap">
                          <div className="exam-results-cell">
                            <button className="btn btn--ghost btn--sm" onClick={() => toggleRelease(q)} disabled={busyExamId === q.id || q.questions?.length === 0}>
                              {q.resultsReleased ? 'Hide results' : 'Release results'}
                            </button>
                            <small className="sub">{q.resultsReleased ? 'Students can see scores' : 'Hidden from students'}</small>
                          </div>
                        </td>
                        <td className="cell-wrap">
                          <div className="row-actions">
                            {q.published ? (
                              <Link to={`/teacher/quizzes/${q.id}/edit?preview=true`} className="btn btn--ghost btn--sm">View</Link>
                            ) : (
                              <Link to={`/teacher/quizzes/${q.id}/edit`} className="btn btn--ghost btn--sm">Edit</Link>
                            )}
                            
                            <Link to={`/teacher/quizzes/${q.id}/mark`} className="btn btn--ghost btn--sm">
                              View Scores
                            </Link>
                            
                            <button className="btn btn--ghost btn--sm btn--danger" onClick={() => { setDeleteExamError(''); setConfirmDeleteExam(q) }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === 'Gradebook' && (
          <ClassGradebookView 
            gb={gradebook} 
            classData={classData} 
            onSaveSettings={handleSaveSettings} 
          />
        )}

        {tab === 'People' && (
          <>
            <div className="panel__head"><h2>People</h2></div>
            <h3 className="subhead">Teachers</h3>
            {people?.teachers?.length > 0 ? (
              <ul className="rows">
                {people.teachers.map((t) => (
                  <li key={t.id}><strong>{t.name}</strong><span>{t.email}</span></li>
                ))}
              </ul>
            ) : (
              <p className="empty">No teacher in this class yet.</p>
            )}
            <h3 className="subhead">Students ({studentCount})</h3>
            {studentCount === 0 ? (
              <p className="empty">No students in this class yet.</p>
            ) : (
              <ul className="rows">
                {people.students.map((s) => (
                  <li key={s.id}><strong>{s.name}</strong><span>{s.email}</span></li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      {open && (
        <Modal title="Create topic" onClose={() => setOpen(false)}>
          <form className="modal__form" onSubmit={handleCreate}>
            <label className="field">
              <span>Topic title</span>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Algebra Notes" required />
            </label>
            <label className="field">
              <span>Description</span>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
            </label>
            <p className="hint">New topics start as drafts. Students see them once you publish.</p>
            {formError && <p className="field__error" role="alert">{formError}</p>}
            <button className="btn btn--primary btn--block" type="submit" disabled={busy || !form.title.trim()}>
              {busy ? 'Creating…' : 'Create topic'}
            </button>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Delete this topic?" onClose={() => setConfirmDelete(null)}>
          <div className="modal__form">
            <p>Are you sure you want to delete <strong>{confirmDelete.title}</strong>?</p>
            <div className="flag-note">
              <strong>Warning:</strong> This will permanently delete all materials, assignments, quizzes, and student grades associated with this topic. This action cannot be undone.
            </div>
            {deleteError && <p className="field__error" role="alert">{deleteError}</p>}
            <div className="confirm-actions">
              <button className="btn btn--ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn--danger-solid" onClick={handleDelete} disabled={deleteBusy}>
                {deleteBusy ? 'Deleting…' : 'Delete everything'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {confirmDeleteExam && (
        <Modal title="Delete this exam?" onClose={() => setConfirmDeleteExam(null)}>
          <div className="modal__form">
            <p>Delete <strong>{confirmDeleteExam.title}</strong>? Refused if any student has already attempted it.</p>
            {deleteExamError && <p className="field__error" role="alert">{deleteExamError}</p>}
            <div className="confirm-actions">
              <button className="btn btn--ghost" onClick={() => setConfirmDeleteExam(null)}>Cancel</button>
              <button className="btn btn--danger-solid" onClick={runDeleteExam} disabled={busyExamId === confirmDeleteExam.id}>
                {busyExamId === confirmDeleteExam.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AppLayout>
  )
}