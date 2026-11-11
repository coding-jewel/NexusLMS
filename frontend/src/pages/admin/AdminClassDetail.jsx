import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { listCourses } from '../../api/courses'
import { getClass, getClassPeople } from '../../api/classes'

const TABS = ['Topics', 'People']

export default function AdminClassDetail() {
  const { classId } = useParams()
  const [classData, setClassData] = useState(null)
  const [topics, setTopics] = useState([])
  const [people, setPeople] = useState(null)
  const [tab, setTab] = useState('Topics')
  const [error, setError] = useState('')

  useEffect(() => {
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
  }, [classId])

  if (error) {
    return (
      <AdminLayout title="Class">
        <section className="panel">
          <div className="empty">
            <p className="field__error" role="alert">{error}</p>
            <Link to="/admin/classes" className="btn btn--ghost">Back to classes</Link>
          </div>
        </section>
      </AdminLayout>
    )
  }

  if (!classData) {
    return (
      <AdminLayout title="Class">
        <section className="panel"><p className="empty">Loading class…</p></section>
      </AdminLayout>
    )
  }

  const studentCount = people?.students?.length ?? 0

  return (
    <AdminLayout title={classData.name}>
      <Link to="/admin/classes" className="back">← All classes</Link>

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
              <h2>Topics in this class</h2>
            </div>
            {topics.length === 0 ? (
              <p className="empty">No topics have been created for this class yet.</p>
            ) : (
              <div className="course-grid" style={{ marginTop: '1rem' }}>
                {topics.map((c, i) => (
                  <div key={c.id} className="course-card">
                    <div className={`course-card__top tone-${i % 4}`}>
                      <h2>{c.title}</h2>
                      <span>{c.teacherName}</span>
                    </div>
                    <div className="course-card__body">
                      <p>
                        {c.assignmentCount} {c.assignmentCount === 1 ? 'assignment' : 'assignments'} ·{' '}
                        {c.quizCount} {c.quizCount === 1 ? 'quiz' : 'quizzes'}
                      </p>
                      <div className="row-actions">
                        <span className={`badge ${c.published ? 'badge--live' : ''}`}>{c.published ? 'Published' : 'Draft'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'People' && (
          <>
            <div className="panel__head"><h2>People</h2></div>
            
            <h3 className="subhead">Teachers</h3>
            {people?.teachers?.length > 0 ? (
              <ul className="rows">
                {people.teachers.map((t) => (
                  <li key={t.id}>
                    <strong>{t.name}</strong>
                    <span>{t.email}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty">No teachers assigned yet.</p>
            )}
            
            <h3 className="subhead">Students ({studentCount})</h3>
            {studentCount === 0 ? (
              <p className="empty">No students in this class yet.</p>
            ) : (
              <ul className="rows">
                {people.students.map((s) => (
                  <li key={s.id}>
                    <strong>{s.name}</strong>
                    <span>{s.email}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </AdminLayout>
  )
}