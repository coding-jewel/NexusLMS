import AdminLayout from '../../components/AdminLayout'
import { courses } from '../../data/mock'

export default function Courses() {
  return (
    <AdminLayout title="Courses">
      <div className="page-head"><p>Courses are notes and materials that teachers publish for a class.</p></div>
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Course</th><th>Class</th><th>Teacher</th><th>Status</th></tr></thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.title}</strong></td><td>{c.className}</td><td>{c.teacher}</td>
                  <td><span className={`badge ${c.published ? 'badge--live' : ''}`}>{c.published ? 'Published' : 'Draft'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  )
}
