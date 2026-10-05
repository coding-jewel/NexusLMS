import { useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { classes, students } from '../../data/mock'

export default function Students() {
  const [cls, setCls] = useState('all')
  const list = cls === 'all' ? students : students.filter((s) => s.classes.includes(cls))

  return (
    <AdminLayout title="Students">
      <div className="page-head">
        <p>Students appear here after they join with a class code. A student can be in more than one class.</p>
        <label className="filter">
          <span>Class</span>
          <select value={cls} onChange={(e) => setCls(e.target.value)}>
            <option value="all">All classes</option>
            {classes.map((c) => <option key={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>
      <section className="panel">
        {list.length === 0 ? (
          <p className="empty">No students in this class yet. Share its join code to invite them.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Classes</th></tr></thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.email}</td>
                    <td><div className="chips">{s.classes.map((c) => <span key={c} className="badge badge--test">{c}</span>)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminLayout>
  )
}
