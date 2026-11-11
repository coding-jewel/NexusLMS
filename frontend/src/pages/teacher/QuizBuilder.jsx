import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import Modal from '../../components/Modal'
import { createQuiz, updateQuiz, publishQuiz, getQuiz } from '../../api/quizzes'
import { listCourses } from '../../api/courses'
import { listClasses } from '../../api/classes'
import { useAuth } from '../../auth/AuthContext'
import '../../styles/teacher.css'
import '../../styles/student.css'

let nextId = 1
const blank = (type) => ({ id: nextId++, type, text: '', marks: 1, options: ['', ''], correct: 0 })

export default function QuizBuilder() {
  const navigate = useNavigate()
  const { id: editId } = useParams()
  const [params] = useSearchParams()
  const { user } = useAuth()

  const isEdit = Boolean(editId)
  const isPreview = params.get('preview') === 'true'
  const lockedCourseId = params.get('course') || ''
  const initialType = lockedCourseId ? 'QUIZ' : 'EXAM'

  const [category, setCategory] = useState(initialType)
  const [courseId, setCourseId] = useState(lockedCourseId)
  const [classId, setClassId] = useState(params.get('class') || '')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [minutes, setMinutes] = useState(30)
  const [totalMarks, setTotalMarks] = useState('20')
  
  const [questions, setQuestions] = useState([blank('MULTIPLE_CHOICE')])

  const [courses, setCourses] = useState([])
  const [classes, setClasses] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(!isEdit)
  const [previewOpen, setPreviewOpen] = useState(false)
  
  // NEW: Track if the quiz is already published in the database
  const [isPublished, setIsPublished] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    setError('')
    getQuiz(editId)
      .then((q) => {
        setCategory(q.category)
        setCourseId(q.courseId || '')
        setClassId(q.classId || '')
        setTitle(q.title || '')
        setDescription(q.description || '')
        setMinutes(q.timeLimitMinutes ?? 30)
        setTotalMarks(String(q.totalMarks ?? 0 > 0 ? q.totalMarks : (q.questions ?? []).reduce((n, x) => n + (x.marks ?? 1), 0)))
        setIsPublished(q.published) // NEW: Store the published state
        const qs = q.questions ?? []
        setQuestions(qs.length > 0
          ? qs.map((item) => {
              const options = item.options?.length ? item.options : ['', '']
              const correctIdx = item.type === 'MULTIPLE_CHOICE'
                ? Math.max(0, options.indexOf(item.correctAnswer))
                : 0
              return {
                id: nextId++,
                type: item.type,
                text: item.text,
                marks: item.marks ?? 1,
                options,
                correct: correctIdx,
              }
            })
          : [blank('MULTIPLE_CHOICE')])
        setLoaded(true)
      })
      .catch((err) => setError(err.message))
  }, [isEdit, editId])

  useEffect(() => {
    if (isEdit) return
    if (category === 'QUIZ') {
      if (lockedCourseId) return
      listCourses().then(setCourses).catch((err) => setError(err.message))
    } else {
      listClasses()
        .then((all) => {
          const mine = new Set(user?.classIds ?? [])
          setClasses(all.filter((c) => mine.has(c.id)))
        })
        .catch((err) => setError(err.message))
    }
  }, [category, lockedCourseId, isEdit, user])

  useEffect(() => {
    if (!isEdit) return
    if (category === 'QUIZ') listCourses().then(setCourses).catch(() => {})
    else listClasses().then((all) => {
      const mine = new Set(user?.classIds ?? [])
      setClasses(all.filter((c) => mine.has(c.id)))
    }).catch(() => {})
  }, [isEdit, category, user])

  // FIXED: If it's a preview link OR the quiz is already published, lock it down.
  const isReadOnly = isPreview || isPublished

  const containerName = () => {
    if (category === 'QUIZ') return courses.find((c) => c.id === courseId)?.title || 'the topic'
    return classes.find((c) => c.id === classId)?.name || 'the class'
  }

  const update = (qid, patch) => setQuestions((qs) => qs.map((q) => (q.id === qid ? { ...q, ...patch } : q)))
  const remove = (qid) => setQuestions((qs) => qs.filter((q) => q.id !== qid))
  const setOption = (q, j, v) => update(q.id, { options: q.options.map((o, k) => (k === j ? v : o)) })
  const addOption = (q) => update(q.id, { options: [...q.options, ''] })
  const removeOption = (q, j) => update(q.id, {
    options: q.options.filter((_, k) => k !== j),
    correct: q.correct >= j && q.correct > 0 ? q.correct - 1 : q.correct,
  })

  const sumMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0)
  const cap = Number(totalMarks) || 0
  const over = cap > 0 && sumMarks > cap
  const under = cap > 0 && sumMarks < cap
  const exact = cap > 0 && sumMarks === cap

  const toPayload = (q) => q.type === 'MULTIPLE_CHOICE'
    ? {
        text: q.text.trim(),
        type: 'MULTIPLE_CHOICE',
        options: q.options.map((o) => o.trim()),
        correctAnswer: q.options[q.correct].trim(),
        marks: Number(q.marks) || 1,
      }
    : {
        text: q.text.trim(),
        type: 'OPEN_ENDED',
        options: [],
        correctAnswer: null,
        marks: Number(q.marks) || 1,
      }

  const save = async (publish) => {
    if (isReadOnly) return // Guard clause
    setError('')
    if (!title.trim()) { setError('Give this a title first.'); return }
    if (!Number.isInteger(cap) || cap < 1 || cap > 1000) { setError('Total marks must be a whole number between 1 and 1000.'); return }
    if (over) { setError(`Questions add up to ${sumMarks}, which is more than the total of ${cap}.`); return }
    if (publish && !exact) { setError(`Questions add up to ${sumMarks}, but the total is ${cap}. They must match exactly before publishing.`); return }
    if (!isEdit) {
      if (category === 'QUIZ' && !courseId) { setError('Choose a topic.'); return }
      if (category !== 'QUIZ' && !classId) { setError('Choose a class.'); return }
    }
    for (const [i, q] of questions.entries()) {
      if (!q.text.trim()) { setError(`Question ${i + 1} needs text.`); return }
      if (q.type === 'MULTIPLE_CHOICE' && q.options.some((o) => !o.trim())) {
        setError(`Question ${i + 1} has an empty option.`); return
      }
    }

    setBusy(true)
    try {
      const body = {
        title: title.trim(),
        description: description.trim() || null,
        timeLimitMinutes: Number(minutes) || null,
        totalMarks: cap,
        questions: questions.map(toPayload),
      }

      if (isEdit) {
        await updateQuiz(editId, body)
        if (publish) await publishQuiz(editId)
      } else {
        const created = await createQuiz({
          category,
          courseId: category === 'QUIZ' ? courseId : null,
          classId: category !== 'QUIZ' ? classId : null,
          title: title.trim(),
          description: description.trim() || null,
          timeLimitMinutes: Number(minutes) || null,
          totalMarks: cap,
        })
        await updateQuiz(created.id, body)
        if (publish) await publishQuiz(created.id)
      }

      if (category === 'QUIZ' && courseId) {
        navigate(`/teacher/courses/${courseId}`)
      } else if (classId) {
        navigate(`/teacher/classes/${classId}`)
      } else {
        navigate('/teacher/classes')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const label = category === 'QUIZ' ? 'quiz' : 'exam'
  const heading = isReadOnly ? `View ${label}` : (isEdit ? `Edit ${label}` : `New ${label}`)
  
  const backTo = category === 'QUIZ' && courseId 
    ? `/teacher/courses/${courseId}` 
    : (classId ? `/teacher/classes/${classId}` : '/teacher/classes')
  const backLabel = category === 'QUIZ' && courseId ? 'Back to topic' : 'Back to class'

  if (!loaded) {
    return (
      <AppLayout role="teacher" title={heading}>
        <section className="panel"><p className="empty">Loading…</p></section>
      </AppLayout>
    )
  }

  return (
    <AppLayout role="teacher" title={heading}>
      <Link to={backTo} className="back">← {backLabel}</Link>

      {isReadOnly && (
        <div className="flag-note" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span><strong>Read-only mode:</strong> This assessment has been published and can no longer be edited.</span>
        </div>
      )}

      <section className="panel quiz-meta">
        <label className="field">
          <span>Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={category === 'EXAM' ? 'Term 1 Exam' : 'Quiz 1: Variables'}
            disabled={isReadOnly}
          />
        </label>

        {!isEdit && category === 'QUIZ' && !lockedCourseId && (
          <label className="field">
            <span>Topic</span>
            <select className="select" value={courseId} onChange={(e) => setCourseId(e.target.value)} disabled={isReadOnly}>
              <option value="">Choose a topic…</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title} ({c.className})</option>)}
            </select>
          </label>
        )}

        {!isEdit && category !== 'QUIZ' && !params.get('class') && (
          <label className="field">
            <span>Class</span>
            <select className="select" value={classId} onChange={(e) => setClassId(e.target.value)} disabled={isReadOnly}>
              <option value="">Choose a class…</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        )}

        {(isEdit || lockedCourseId || params.get('class')) && (
          <div className="field quiz-meta__wide">
            <span>For</span>
            <strong>{containerName()}</strong>
          </div>
        )}

        <label className="field">
          <span>Time limit (minutes)</span>
          <input type="number" min="1" value={minutes} onChange={(e) => setMinutes(e.target.value)} disabled={isReadOnly} />
        </label>

        <label className="field">
          <span>Total marks</span>
          <input
            type="number"
            min="1"
            max="1000"
            value={totalMarks}
            onChange={(e) => setTotalMarks(e.target.value)}
            className={over ? 'is-invalid' : ''}
            aria-invalid={over}
            disabled={isReadOnly}
          />
        </label>

        <label className="field quiz-meta__wide">
          <span>Instructions</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" disabled={isReadOnly} />
        </label>

        <p className="hint quiz-meta__wide">
          Students get one attempt. The clock starts when they press Start, and answers are only sent when they press Submit.
          {category !== 'QUIZ' && ' Results stay hidden from students until you release them.'}
        </p>
      </section>

      {questions.map((q, i) => (
        <section key={q.id} className="panel q-card">
          <div className="q-card__head">
            <strong>Question {i + 1}</strong>
            <span className="badge">{q.type === 'MULTIPLE_CHOICE' ? 'Multiple choice' : 'Open-ended'}</span>
            {!isReadOnly && (
              <button type="button" className="link-btn" onClick={() => remove(q.id)} disabled={questions.length === 1}>Remove</button>
            )}
          </div>

          <label className="field">
            <span>Question</span>
            <input value={q.text} onChange={(e) => update(q.id, { text: e.target.value })} placeholder="Type the question" disabled={isReadOnly} />
          </label>

          {q.type === 'MULTIPLE_CHOICE' ? (
            <fieldset className="options" disabled={isReadOnly}>
              <legend>Options (select the correct one)</legend>
              {q.options.map((o, j) => (
                <div key={j} className="option">
                  <input
                    type="radio"
                    name={`correct-${q.id}`}
                    checked={q.correct === j}
                    onChange={() => update(q.id, { correct: j })}
                    aria-label={`Option ${j + 1} is correct`}
                    disabled={isReadOnly}
                  />
                  <input value={o} onChange={(e) => setOption(q, j, e.target.value)} placeholder={`Option ${j + 1}`} disabled={isReadOnly} />
                  {!isReadOnly && q.options.length > 2 && <button type="button" className="link-btn" onClick={() => removeOption(q, j)}>Remove</button>}
                </div>
              ))}
              {!isReadOnly && q.options.length < 5 && <button type="button" className="link-btn" onClick={() => addOption(q)}>+ Add option</button>}
            </fieldset>
          ) : (
            <p className="hint">Students type their own answer. You’ll mark it by hand after they submit.</p>
          )}

          <label className="field marks">
            <span>Marks</span>
            <input type="number" min="1" value={q.marks} onChange={(e) => update(q.id, { marks: e.target.value })} disabled={isReadOnly} />
          </label>
        </section>
      ))}

      {!isReadOnly && (
        <div className="add-q">
          <button className="btn btn--ghost" onClick={() => setQuestions([...questions, blank('MULTIPLE_CHOICE')])}>+ Multiple choice</button>
          <button className="btn btn--ghost" onClick={() => setQuestions([...questions, blank('OPEN_ENDED')])}>+ Open-ended</button>
        </div>
      )}

      {error && <p className="field__error" role="alert">{error}</p>}

      <div className="quiz-bar">
        <span>
          <strong>{questions.length}</strong> {questions.length === 1 ? 'question' : 'questions'} ·{' '}
          <strong>{sumMarks}</strong>
          {cap > 0 ? ` of ${cap}` : ''} marks
          {over && <span className="flag"> — over by {sumMarks - cap}</span>}
          {under && !isReadOnly && <span className="flag"> — {cap - sumMarks} marks remaining</span>}
        </span>
        <div>
          <button className="btn btn--ghost" onClick={() => setPreviewOpen(true)}>
            Preview
          </button>
          {!isReadOnly && (
            <>
              <button className="btn btn--ghost" onClick={() => save(false)} disabled={busy || over || cap < 1}>Save draft</button>
              <button className="btn btn--primary" onClick={() => save(true)} disabled={busy || !exact || cap < 1}>
                {busy ? 'Saving…' : 'Publish'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* --- PREVIEW MODAL --- */}
      {previewOpen && (
        <Modal title={`Preview: ${title || 'Untitled'}`} onClose={() => setPreviewOpen(false)}>
          <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {description && <p className="muted-text" style={{ marginBottom: '1.5rem' }}>{description}</p>}
            
            {questions.map((q, i) => (
              <div key={q.id} style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--slate-200)' }}>
                <p className="muted-text" style={{ fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                  Question {i + 1} of {questions.length} · {q.marks} marks
                </p>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{q.text || <em>Untitled question</em>}</h3>
                
                {q.type === 'MULTIPLE_CHOICE' ? (
                  <div className="q-options">
                    {q.options.map((o, j) => (
                      <label key={j} className="q-opt" style={{ cursor: 'default' }}>
                        <input type="radio" disabled />
                        {o || <em>Empty option</em>}
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea className="select" rows="3" disabled placeholder="Students will type their answer here..." />
                )}
              </div>
            ))}
          </div>
          <div className="confirm-actions" style={{ marginTop: '1rem' }}>
            <button className="btn btn--primary" onClick={() => setPreviewOpen(false)}>Close Preview</button>
          </div>
        </Modal>
      )}
    </AppLayout>
  )
}