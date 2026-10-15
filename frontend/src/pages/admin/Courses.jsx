import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { listCourses } from '../../api/courses'
import { listClasses } from '../../api/classes'

export default function Courses() {
  const [courses, setCourses] = useState(null) // null while loading
  const [classes, setClasses] = useState([])   // every class in the school, used for the filter
  const [error, setError] = useState('')
  const [classFilter, setClassFilter] = useState('') // '' means every class
  const [statusFilter, setStatusFilter] = useState('') // '' | 'published' | 'draft'

  const load = () => {
    setError('')
    setCourses(null)
    setClasses([])
    setClassFilter('')
    setStatusFilter('')
    Promise.all([listCourses(), listClasses()])
      .then(([courseList, classList]) => {
        setCourses(courseList)
        setClasses(classList)
      })
      .catch((err) => setError(err.message))
  }
  useEffect(() => { load() }, [])

  // The filter lists every class in the school, sorted by name.
  const classOptions = useMemo(
    () => [...classes].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    [classes]
  )

  const visible = (courses ?? []).filter((c) =>
    (!classFilter || c.classId === classFilter) &&
    (!statusFilter || (statusFilter === 'published') === c.published))
  const filtering = Boolean(classFilter || statusFilter)
  const clearFilters = () => { setClassFilter(''); setStatusFilter('') }

  return (
    <AdminLayout title="Courses">
      <div className="page-head"><p>Courses are notes and materials that teachers publish for a class.</p></div>
      <section className="panel">
        {error ? (
          <div className="empty">
            <p className="field__error" role="alert">{error}</p>
            <button className="btn btn--ghost" onClick={load}>Try again</button>
          </div>
        ) : courses === null ? (
          <p className="empty">Loading courses…</p>
        ) : courses.length === 0 ? (
          <p className="empty">No courses yet. They appear here once teachers create them.</p>
        ) : (
          <>
            <div className="filters">
              <select aria-label="Filter by class" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                <option value="">All classes</option>
                {classOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              <select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              {filtering && <button className="btn btn--ghost btn--sm" onClick={clearFilters}>Clear filters</button>}
              <span className="filters__count">
                {filtering ? `Showing ${visible.length} of ${courses.length}` : `${courses.length} ${courses.length === 1 ? 'course' : 'courses'}`}
              </span>
            </div>

            {visible.length === 0 ? (
              <p className="empty">No courses match these filters.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Course</th><th>Class</th><th>Teacher</th><th>Status</th></tr></thead>
                  <tbody>
                    {visible.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <strong>{c.title}</strong>
                          {c.description && <span className="class-desc">{c.description}</span>}
                        </td>
                        <td>{c.className ?? '—'}</td>
                        <td>{c.teacherName ?? '—'}</td>
                        <td><span className={`badge ${c.published ? 'badge--live' : ''}`}>{c.published ? 'Published' : 'Draft'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </AdminLayout>
  )
}