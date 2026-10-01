import { useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import CopyButton from '../../components/CopyButton'
import Modal from '../../components/Modal'
import { school, classes, teachers } from '../../data/mock'

export default function Classes() {
  const [createOpen, setCreateOpen] = useState(false)
  const [assigning, setAssigning] = useState(null) // the class being edited
  const [picked, setPicked] = useState([]) // teacher ids ticked in the modal

  // template only: start from the teachers' mock "classes" text
  const [assigned, setAssigned] = useState(() =>
    Object.fromEntries(classes.map((c) => [c.id, teachers.filter((t) => t.classes.includes(c.name)).map((t) => t.id)]))
  )

  const invite = (code) => `https://${school.subdomain}.nexuslms.com/join?code=${code}`
  const namesFor = (id) => teachers.filter((t) => assigned[id].includes(t.id)).map((t) => t.name)

  const openAssign = (c) => { setAssigning(c); setPicked(assigned[c.id]) }
  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const saveAssign = () => { setAssigned({ ...assigned, [assigning.id]: picked }); setAssigning(null) }

  return (
    <AdminLayout title="Classes">
      <div className="page-head">
        <p>Students join a class with its code or invite link. Teachers are assigned by you.</p>
        <button className="btn btn--primary" onClick={() => setCreateOpen(true)}>Create class</button>
      </div>

      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Class</th><th>Teachers</th><th>Students</th><th>Join code</th><th>Actions</th></tr></thead>
            <tbody>
              {classes.map((c) => {
                const names = namesFor(c.id)
                return (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong></td>
                    <td className="cell-wrap">{names.length ? names.join(', ') : <span className="muted-text">None assigned</span>}</td>
                    <td>{c.students}</td>
                    <td><code className="code">{c.code}</code></td>
                    <td className="row-actions">
                      <button className="btn btn--ghost btn--sm" onClick={() => openAssign(c)}>Assign teacher</button>
                      <CopyButton text={c.code} label="Copy code" />
                      <CopyButton text={invite(c.code)} label="Copy invite link" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {createOpen && (
        <Modal title="Create class" onClose={() => setCreateOpen(false)}>
          <form className="modal__form" onSubmit={(e) => { e.preventDefault(); setCreateOpen(false) }}>
            <label className="field"><span>Class name</span><input placeholder="JSS 3 Green" required /></label>
            <label className="field"><span>Description</span><input placeholder="Optional" /></label>
            <p className="hint">A join code is created automatically.</p>
            <button className="btn btn--primary btn--block" type="submit">Create class</button>
          </form>
        </Modal>
      )}

      {assigning && (
        <Modal title={`Assign teachers to ${assigning.name}`} onClose={() => setAssigning(null)}>
          <div className="modal__form">
            <div className="check-list">
              {teachers.map((t) => (
                <label key={t.id} className="check-item">
                  <input type="checkbox" checked={picked.includes(t.id)} onChange={() => toggle(t.id)} />
                  <span><strong>{t.name}</strong><small>{t.email}</small></span>
                </label>
              ))}
            </div>
            <p className="hint">Untick a teacher to remove them from this class.</p>
            <button className="btn btn--primary btn--block" onClick={saveAssign}>Save</button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  )
}