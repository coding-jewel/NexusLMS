import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import { createQuiz, updateQuiz, publishQuiz, getQuiz } from '../../api/quizzes'
import { listCourses } from '../../api/courses'
import { listClasses } from '../../api/classes'
import { useAuth } from '../../auth/AuthContext'
import '../../styles/teacher.css'

let nextId = 1
const blank = (type) => ({ id: nextId++, type, text: '', marks: 1, options: ['', ''], correct: 0 })

// Used for both creating and editing.
// Create — opened with no :id
//   ?course=<id>  → topic quiz (auto-released when graded)
//   (no course)   → class test or exam (teacher releases results)
// Edit — opened with :id
//   Loads the existing quiz. Category and container are locked.
export default function QuizBuilder() {
  const navigate = useNavigate()
  const { id: editId } = useParams()
  const [params] = useSearchParams()
  const { user } = useAuth()

  const isEdit = Boolean(editId)
  const lockedCourseId = params.get('course') || ''
  const initialType = lockedCourseId ? 'QUIZ' : (params.get('type')?.toUpperCase() === 'EXAM' ? 'EXAM' : 'TEST')

  const [category, setCategory] = useState(initialType)
  const [courseId, setCourseId] = useState(lockedCourseId)
  const [classId, setClassId] = useState(params.get('class') || '')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [minutes, setMinutes] = useState(30)
  const [questions, setQuestions] = useState([blank('MULTIPLE_CHOICE')])

  const [courses, setCourses] = useState([])
  const [classes, setClasses] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(!isEdit)

  // Edit: load the quiz and its questions.
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

  // Load the picker lists.
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

  // Edit needs the picker lists too, so labels can show names.
  useEffect(() => {
    if (!isEdit) return
    if (category === 'QUIZ') listCourses().then(setCourses).catch(() => {})
    else listClasses().then((all) => {
      const mine = new Set(user?.classIds ?? [])
      setClasses(all.filter((c) => mine.has(c.id)))
    }).catch(() => {})
  }, [isEdit, category, user])

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

  const total = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0)

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
    setError('')
    if (!title.trim()) { setError('Give this a title first.'); return }
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
        })
        await updateQuiz(created.id, body)
        if (publish) await publishQuiz(created.id)
      }

      if (category === 'QUIZ' && courseId) navigate(`/teacher/courses/${courseId}`)
      else navigate('/teacher/quizzes')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const label = category === 'QUIZ' ? 'quiz' : (category === 'EXAM' ? 'exam' : 'test')
  const heading = isEdit ? `Edit ${label}` : `New ${label}`
  const backTo = category === 'QUIZ' && courseId ? `/teacher/courses/${courseId}` : '/teacher/quizzes'
  const backLabel = category === 'QUIZ' && courseId ? 'Back to topic' : 'Back to tests & exams'

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

      <section className="panel quiz-meta">
        <label className="field">
          <span>Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={category === 'EXAM' ? 'Term 1 Exam' : (category === 'QUIZ' ? 'Quiz 1: Variables' : 'Test 1: Variables')}
          />
        </label>

        {!isEdit && !lockedCourseId && (
          <label className="field">
            <span>Type</span>
            <select className="select" value={category} onChange={(e) => { setCategory(e.target.value); setClassId('') }}>
              <option value="TEST">Test (for a class)</option>
              <option value="EXAM">Exam (for a class)</option>
            </select>
          </label>
        )}

        {!isEdit && category === 'QUIZ' && !lockedCourseId && (
          <label className="field">
            <span>Topic</span>
            <select className="select" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              <option value="">Choose a topic…</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title} ({c.className})</option>)}
            </select>
          </label>
        )}

        {!isEdit && category !== 'QUIZ' && !params.get('class') && (
          <label className="field">
            <span>Class</span>
            <select className="select" value={classId} onChange={(e) => setClassId(e.target.value)}>
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
          <input type="number" min="1" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        </label>

        <label className="field quiz-meta__wide">
          <span>Instructions</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
        </label>

        <p className="hint quiz-meta__wide">
          Students get one attempt. The clock starts when they press Start, and answers are saved as they go.
          {category !== 'QUIZ' && ' Results stay hidden from students until you release them.'}
        </p>
      </section>

      {questions.map((q, i) => (
        <section key={q.id} className="panel q-card">
          <div className="q-card__head">
            <strong>Question {i + 1}</strong>
            <span className="badge">{q.type === 'MULTIPLE_CHOICE' ? 'Multiple choice' : 'Open-ended'}</span>
            <button type="button" className="link-btn" onClick={() => remove(q.id)} disabled={questions.length === 1}>Remove</button>
          </div>

          <label className="field">
            <span>Question</span>
            <input value={q.text} onChange={(e) => update(q.id, { text: e.target.value })} placeholder="Type the question" />
          </label>

          {q.type === 'MULTIPLE_CHOICE' ? (
            <fieldset className="options">
              <legend>Options (select the correct one)</legend>
              {q.options.map((o, j) => (
                <div key={j} className="option">
                  <input
                    type="radio"
                    name={`correct-${q.id}`}
                    checked={q.correct === j}
                    onChange={() => update(q.id, { correct: j })}
                    aria-label={`Option ${j + 1} is correct`}
                  />
                  <input value={o} onChange={(e) => setOption(q, j, e.target.value)} placeholder={`Option ${j + 1}`} />
                  {q.options.length > 2 && <button type="button" className="link-btn" onClick={() => removeOption(q, j)}>Remove</button>}
                </div>
              ))}
              {q.options.length < 5 && <button type="button" className="link-btn" onClick={() => addOption(q)}>+ Add option</button>}
            </fieldset>
          ) : (
            <p className="hint">Students type their own answer. You’ll mark it by hand after they submit.</p>
          )}

          <label className="field marks">
            <span>Marks</span>
            <input type="number" min="1" value={q.marks} onChange={(e) => update(q.id, { marks: e.target.value })} />
          </label>
        </section>
      ))}

      <div className="add-q">
        <button className="btn btn--ghost" onClick={() => setQuestions([...questions, blank('MULTIPLE_CHOICE')])}>+ Multiple choice</button>
        <button className="btn btn--ghost" onClick={() => setQuestions([...questions, blank('OPEN_ENDED')])}>+ Open-ended</button>
      </div>

      {error && <p className="field__error" role="alert">{error}</p>}

      <div className="quiz-bar">
        <span><strong>{questions.length}</strong> questions · <strong>{total}</strong> marks</span>
        <div>
          <button className="btn btn--ghost" onClick={() => save(false)} disabled={busy}>Save draft</button>
          <button className="btn btn--primary" onClick={() => save(true)} disabled={busy}>
            {busy ? 'Saving…' : 'Publish'}
          </button>
        </div>
      </div>
    </AppLayout>
  )
}