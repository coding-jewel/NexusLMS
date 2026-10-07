import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import Modal from '../../components/Modal'
import { listUsers, deleteUser } from '../../api/users'
import { listClasses } from '../../api/classes'

export default function Students() {
  const [students, setStudents] = useState(null) // null while loading
  const [classes, setClasses] = useState([])
  const [loadError, setLoadError] = useState('')
  const [cls, setCls] = useState('all') // 'all' or a class id

  const [confirm, setConfirm] = useState(null) // the student being removed
  const [confirmError, setConfirmError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => {
    setLoadError('')
    setStudents(null)
    setCls('all')
    Promise.all([listUsers({ role: 'STUDENT' }), listClasses()])
      .then(([people, classList]) => { setStudents(people); setClasses(classList) })
      .catch((err) => setLoadError(err.message))
  }
  useEffect(() => { load() }, [])

  const className = (id) => classes.find((c) => c.id === id)?.name ?? 'Unknown class'
  const list = (students ?? []).filter((s) => cls === 'all' || (s.classIds ?? []).includes(cls))

  const openConfirm = (student) => { setConfirmError(''); setConfirm(student) }

  const runRemove = async () => {
    setConfirmError('')
    setBusy(true)
    try {
      await deleteUser(confirm.id)
      setStudents(students.filter((s) => s.id !== confirm.id))
      setConfirm(null)
    } catch (err) {
      setConfirmError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminLayout title="Students">
      <div className="page-head">
        <p>Students appear here after they join with a class code. A student can be in more than one class.</p>
        <label className="filter">
          <span>Class</span>
          <select value={cls} onChange={(e) => setCls(e.target.value)} disabled={students === null}>
            <option value="all">All classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>
      <section className="panel">
        {loadError ? (
          <div className="empty">
            <p className="field__error" role="alert">{loadError}</p>
            <button className="btn btn--ghost" onClick={load}>Try again</button>
          </div>
        ) : students === null ? (
          <p className="empty">Loading students…</p>
        ) : students.length === 0 ? (
          <p className="empty">No students yet. They appear here after they join with a class code.</p>
        ) : list.length === 0 ? (
          <p className="empty">No students in this class yet. Share its join code to invite them.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Classes</th><th>Actions</th></tr></thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.email}</td>
                    <td>
                      <div className="chips">
                        {(s.classIds ?? []).length === 0
                          ? <span className="muted-text">No class</span>
                          : s.classIds.map((id) => <span key={id} className="badge badge--test">{className(id)}</span>)}
                      </div>
                    </td>
                    <td className="cell-wrap">
                      <div className="row-actions">
                        <button className="btn btn--ghost btn--sm btn--danger" onClick={() => openConfirm(s)}>Remove</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {confirm && (
        <Modal title="Remove student?" onClose={() => setConfirm(null)}>
          <div className="modal__form">
            <p>Remove <strong>{confirm.name}</strong>? Their account will be deleted and they won’t be able to sign in. This can’t be undone.</p>
            {confirmError && <p className="field__error" role="alert">{confirmError}</p>}
            <div className="confirm-actions">
              <button className="btn btn--ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn btn--danger-solid" onClick={runRemove} disabled={busy}>
                {busy ? 'Removing…' : 'Remove student'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  )
}