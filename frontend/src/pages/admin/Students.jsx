import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import Modal from '../../components/Modal'
import { listUsers, deleteUser } from '../../api/users'
import { listClasses, removeStudentFromClass } from '../../api/classes'

export default function Students() {
  const [students, setStudents] = useState(null)
  const [classes, setClasses] = useState([])
  const [loadError, setLoadError] = useState('')
  const [cls, setCls] = useState('all')

  const [confirm, setConfirm] = useState(null) 
  const [confirmError, setConfirmError] = useState('')
  
  const [manage, setManage] = useState(null) 
  const [manageError, setManageError] = useState('')
  
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

  const openManage = (student) => {
    setManageError('')
    setManage({ ...student, classIds: [...(student.classIds ?? [])] })
  }

  const handleRemoveClass = async (classId) => {
    setManageError('')
    setBusy(true)
    try {
      await removeStudentFromClass(manage.id, classId)
      const updatedClasses = manage.classIds.filter((id) => id !== classId)
      setManage({ ...manage, classIds: updatedClasses })
      setStudents(students.map((s) => s.id === manage.id ? { ...s, classIds: updatedClasses } : s))
    } catch (err) {
      setManageError(err.message)
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
            <table className="table-students">
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
                        <button className="btn btn--ghost btn--sm" onClick={() => openManage(s)}>Manage classes</button>
                        <button className="btn btn--ghost btn--sm btn--danger" onClick={() => openConfirm(s)}>Delete account</button>
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
        <Modal title="Delete student account?" onClose={() => setConfirm(null)}>
          <div className="modal__form">
            <p>Delete <strong>{confirm.name}</strong>? Their account will be permanently removed and they won’t be able to sign in. This can’t be undone.</p>
            {confirmError && <p className="field__error" role="alert">{confirmError}</p>}
            <div className="confirm-actions">
              <button className="btn btn--ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn btn--danger-solid" onClick={runRemove} disabled={busy}>
                {busy ? 'Deleting…' : 'Delete account'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {manage && (
        <Modal title={`Classes for ${manage.name}`} onClose={() => setManage(null)}>
          <div className="modal__form">
            {manage.classIds.length === 0 ? (
              <p className="muted-text">This student is not in any classes.</p>
            ) : (
              <ul className="rows" style={{ margin: 0, padding: 0 }}>
                {manage.classIds.map((id) => (
                  <li key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 0', borderBottom: '1px solid var(--slate-100)' }}>
                    <strong>{className(id)}</strong>
                    <button className="btn btn--ghost btn--sm btn--danger" onClick={() => handleRemoveClass(id)} disabled={busy}>
                      {busy ? '…' : 'Remove'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {manageError && <p className="field__error" role="alert">{manageError}</p>}
            <div className="confirm-actions" style={{ marginTop: '1rem' }}>
              <button className="btn btn--primary" onClick={() => setManage(null)}>Done</button>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  )
}