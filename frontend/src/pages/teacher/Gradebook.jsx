import { useEffect, useState } from 'react'
import AppLayout from '../../components/AppLayout'
import { listClasses } from '../../api/classes'
import { getClassGradebook } from '../../api/gradebook'
import { useAuth } from '../../auth/AuthContext'
import '../../styles/teacher.css'

const pct = (n) => (n == null ? '—' : `${Math.round(n)}%`)

export default function Gradebook() {
  const { user } = useAuth()
  const [classes, setClasses] = useState([])
  const [classId, setClassId] = useState('')
  const [gb, setGb] = useState(null)
  const [filter, setFilter] = useState('ALL') // ALL | TEST | EXAM
  const [error, setError] = useState('')

  useEffect(() => {
    listClasses()
      .then((all) => {
        const mine = new Set(user?.classIds ?? [])
        const myClasses = all
          .filter((c) => mine.has(c.id))
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
        setClasses(myClasses)
        setClassId(myClasses[0]?.id ?? '')
      })
      .catch((err) => setError(err.message))
  }, [user])

  useEffect(() => {
    if (!classId) return
    setGb(null)
    setError('')
    getClassGradebook(classId).then(setGb).catch((err) => setError(err.message))
  }, [classId])

  const visibleGroups = gb
    ? gb.groups.filter((g) => {
        if (filter === 'ALL') return true
        if (filter === 'TEST') return g.key === 'tests'
        if (filter === 'EXAM') return g.key === 'exams'
        return false
      })
    : []
    
  const isAll = filter === 'ALL'

  const classAvg = (key) => {
    if (!gb) return null
    const values = gb.rows.map((r) => r.subtotals[key]).filter((v) => v != null)
    if (values.length === 0) return null
    return values.reduce((a, b) => a + b, 0) / values.length
  }
  const overallAvg = () => {
    if (!gb) return null
    const values = gb.rows.map((r) => r.overall).filter((v) => v != null)
    if (values.length === 0) return null
    return values.reduce((a, b) => a + b, 0) / values.length
  }

  return (
    <AppLayout role="teacher" title="Gradebook">
      <div className="page-head">
        <p>Weighted overall using your school’s grading settings. Students never see this view.</p>
        <label className="filter">
          <span>Class</span>
          <select value={classId} onChange={(e) => setClassId(e.target.value)} disabled={classes.length === 0}>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>

      {classes.length === 0 ? (
        <section className="panel">
          <p className="empty">You aren’t assigned to any class yet. Ask your admin to add you.</p>
        </section>
      ) : error ? (
        <section className="panel">
          <div className="empty">
            <p className="field__error" role="alert">{error}</p>
            <button className="btn btn--ghost" onClick={() => setClassId(classId)}>Try again</button>
          </div>
        </section>
      ) : !gb ? (
        <section className="panel"><p className="empty">Loading gradebook…</p></section>
      ) : gb.rows.length === 0 ? (
        <section className="panel"><p className="empty">No students in this class yet.</p></section>
      ) : (
        <>
          <div className="filters">
            <div className="seg" role="group" aria-label="Gradebook view">
              <button className={filter === 'ALL' ? 'is-active' : ''} onClick={() => setFilter('ALL')}>All</button>
              <button className={filter === 'TEST' ? 'is-active' : ''} onClick={() => setFilter('TEST')}>Tests</button>
              <button className={filter === 'EXAM' ? 'is-active' : ''} onClick={() => setFilter('EXAM')}>Exams</button>
            </div>
            <span className="filters__count">{gb.rows.length} {gb.rows.length === 1 ? 'student' : 'students'}</span>
          </div>

          <section className="panel">
            {visibleGroups.length === 0 ? (
              <p className="empty">No {filter === 'TEST' ? 'tests' : 'exams'} recorded yet.</p>
            ) : (
              <div className="table-wrap">
                <table className="gb">
                  <thead>
                    <tr>
                      <th rowSpan={isAll ? 1 : 2}>Student</th>
                      {visibleGroups.map((g) => (
                        isAll ? (
                          <th key={g.key}>{g.label}</th>
                        ) : (
                          <th key={g.key} colSpan={g.items.length + 1} className="gb__group">
                            {g.label}
                          </th>
                        )
                      ))}
                      {isAll && <th>Overall</th>}
                    </tr>
                    {!isAll && (
                      <tr>
                        {visibleGroups.flatMap((g) => [
                          ...g.items.map((it) => (
                            <th key={it.id}>{it.title}<small>/{it.totalMarks}</small></th>
                          )),
                          <th key={`${g.key}-sub`} className="gb__sub">Subtotal</th>,
                        ])}
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {gb.rows.map((r) => (
                      <tr key={r.studentId}>
                        <td><strong>{r.studentName}</strong></td>
                        {visibleGroups.flatMap((g) => {
                          if (isAll) {
                            return [
                              <td key={g.key} className={r.subtotals[g.key] == null ? 'gb__empty' : ''}>
                                {pct(r.subtotals[g.key])}
                              </td>
                            ]
                          } else {
                            return [
                              ...g.items.map((it) => {
                                const v = r.scores[it.id]
                                return (
                                  <td key={it.id} className={v === undefined ? 'gb__empty' : ''}>
                                    {v ?? '—'}
                                  </td>
                                )
                              }),
                              <td key={`${g.key}-sub`} className="gb__sub">
                                {pct(r.subtotals[g.key])}
                              </td>,
                            ]
                          }
                        })}
                        {isAll && (
                          <td>
                            <span className={`badge ${r.overall != null && r.overall >= 50 ? 'badge--live' : ''}`}>
                              {pct(r.overall)}
                            </span>
                            {r.provisional && <small className="sub">so far</small>}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Class average</td>
                      {visibleGroups.flatMap((g) => {
                        if (isAll) {
                          return [
                            <td key={g.key} className="gb__sub">
                              {pct(classAvg(g.key))}
                            </td>
                          ]
                        } else {
                          return [
                            ...g.items.map((it) => {
                              const scores = gb.rows.map(r => r.scores[it.id]).filter(s => s != null)
                              const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null
                              return <td key={it.id}>{avg != null ? Math.round(avg) : '—'}</td>
                            }),
                            <td key={`${g.key}-sub`} className="gb__sub">
                              {pct(classAvg(g.key))}
                            </td>,
                          ]
                        }
                      })}
                      {isAll && <td>{pct(overallAvg())}</td>}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>

          {isAll && gb.rows.some((r) => r.provisional) && (
            <p className="gb-note">
              “So far” means a group has no scores yet. The overall uses only the groups that have scores, with their weights scaled to 100.
            </p>
          )}
        </>
      )}
    </AppLayout>
  )
}