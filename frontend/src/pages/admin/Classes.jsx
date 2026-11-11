import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import Modal from '../../components/Modal'
import { useTenant } from '../../tenant/TenantContext'
import { schoolUrl } from '../../utils/tenant'
import {
  listClasses,
  createClass,
  updateClass,
  regenerateCode,
  deleteClass,
  assignTeacher,
  removeTeacher,
} from '../../api/classes'
import { listUsers } from '../../api/users'

const byName = (list) => [...list].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')

export default function Classes() {
  const { subdomain } = useTenant()
  const [classes, setClasses] = useState(null)
  const [teachers, setTeachers] = useState([])
  const [loadError, setLoadError] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [formError, setFormError] = useState('')

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ id: '', name: '', description: '' })
  const [editError, setEditError] = useState('')

  const [confirm, setConfirm] = useState(null)
  const [confirmError, setConfirmError] = useState('')

  const [assignFor, setAssignFor] = useState(null)
  const [picked, setPicked] = useState([])
  const [assignError, setAssignError] = useState('')

  const [activeMenu, setActiveMenu] = useState(null)
  const [menuCoords, setMenuCoords] = useState({ top: 0, right: 0 })
  const [copiedId, setCopiedId] = useState(null)

  const [busy, setBusy] = useState(false)

  // NEW: Close the dropdown menu when the user scrolls
  useEffect(() => {
    const handleScroll = () => {
      if (activeMenu) {
        setActiveMenu(null)
      }
    }
    
    // 'true' enables capturing phase to catch scrolls inside the table-wrap as well
    window.addEventListener('scroll', handleScroll, true)
    return () => window.removeEventListener('scroll', handleScroll, true)
  }, [activeMenu])

  const load = () => {
    setLoadError('')
    setClasses(null)
    Promise.all([listClasses(), listUsers({ role: 'TEACHER' })])
      .then(([classList, teacherList]) => {
        setClasses(byName(classList))
        setTeachers(byName(teacherList))
      })
      .catch((err) => setLoadError(err.message))
  }
  useEffect(() => { load() }, [])

  const invite = (code) => schoolUrl(subdomain, `/join?code=${encodeURIComponent(code)}`)

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleMenu = (e, id) => {
    if (activeMenu === id) {
      setActiveMenu(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuCoords({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right
    })
    setActiveMenu(id)
  }

  const openCreate = () => { setForm({ name: '', description: '' }); setFormError(''); setCreateOpen(true) }

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError('')
    setBusy(true)
    try {
      const created = await createClass(form)
      setClasses(byName([...classes, created]))
      setCreateOpen(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const openEdit = (cls) => {
    setEditForm({ id: cls.id, name: cls.name, description: cls.description || '' })
    setEditError('')
    setEditOpen(true)
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editForm.name.trim()) return
    setEditError('')
    setBusy(true)
    try {
      const updated = await updateClass(editForm.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null
      })
      setClasses(classes.map(c => c.id === updated.id ? updated : c))
      setEditOpen(false)
    } catch (err) {
      setEditError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const openConfirm = (kind, cls) => { setConfirmError(''); setConfirm({ kind, cls }) }

  const runConfirm = async () => {
    setConfirmError('')
    setBusy(true)
    try {
      const { kind, cls } = confirm
      if (kind === 'delete') {
        await deleteClass(cls.id)
        setClasses(classes.filter((c) => c.id !== cls.id))
      } else {
        const updated = await regenerateCode(cls.id)
        setClasses(classes.map((c) => (c.id === updated.id ? updated : c)))
      }
      setConfirm(null)
    } catch (err) {
      setConfirmError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const openAssign = (cls) => {
    setPicked([...(cls.teacherIds ?? [])])
    setAssignError('')
    setAssignFor(cls)
  }

  const toggleTeacher = (id) => {
    setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id])
  }

  const saveAssign = async () => {
    setAssignError('')
    setBusy(true)
    try {
      const before = new Set(assignFor.teacherIds ?? [])
      const after = new Set(picked)
      const toAdd = [...after].filter((id) => !before.has(id))
      const toRemove = [...before].filter((id) => !after.has(id))

      let latest = assignFor
      for (const id of toAdd) latest = await assignTeacher(assignFor.id, id)
      for (const id of toRemove) latest = await removeTeacher(assignFor.id, id)

      setClasses(classes.map((c) => (c.id === latest.id ? latest : c)))
      setAssignFor(null)
    } catch (err) {
      setAssignError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminLayout title="Classes">
      <div className="page-head">
        <p>Students join a class with its code. Teachers can be assigned to a class here too.</p>
        <button className="btn btn--primary" onClick={openCreate} disabled={classes === null}>Create class</button>
      </div>

      <section className="panel">
        {loadError ? (
          <div className="empty">
            <p className="field__error" role="alert">{loadError}</p>
            <button className="btn btn--ghost" onClick={load}>Try again</button>
          </div>
        ) : classes === null ? (
          <p className="empty">Loading classes…</p>
        ) : classes.length === 0 ? (
          <p className="empty">No classes yet. Create your first class to get a join code.</p>
        ) : (
          <div className="table-wrap">
            <table className="table-classes">
              <thead>
                <tr><th>Class</th><th>Join code</th><th>Teachers</th><th>Students</th><th>Created</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {classes.map((c) => {
                  const teacherCount = (c.teacherIds ?? []).length
                  return (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.name}</strong>
                        {c.description && <span className="class-desc">{c.description}</span>}
                      </td>
                      <td>{c.code ? <code className="code">{c.code}</code> : <span className="muted-text">No code yet</span>}</td>
                      <td>
                        <button type="button" className="link-btn" onClick={() => openAssign(c)}>
                          {teacherCount === 0 ? 'None — assign' : `${teacherCount} assigned`}
                        </button>
                      </td>
                      <td>{c.studentCount ?? 0}</td>
                      <td>{formatDate(c.createdAt)}</td>
                      <td className="cell-wrap">
                        <div className="row-actions" style={{ flexWrap: 'nowrap' }}>
                          <Link to={`/admin/classes/${c.id}`} className="btn btn--primary btn--sm">Open</Link>
                          <button className="btn btn--ghost btn--sm" onClick={() => openEdit(c)}>Edit</button>
                          
                          <button 
                            className="btn btn--ghost btn--sm" 
                            onClick={(e) => toggleMenu(e, c.id)}
                          >
                            ⋯
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {activeMenu && (
        <>
          <div className="dropdown__backdrop" onClick={() => setActiveMenu(null)} />
          <div 
            className="dropdown__menu dropdown__menu--fixed" 
            style={{ top: menuCoords.top, right: menuCoords.right }}
          >
            {classes.find(c => c.id === activeMenu)?.code && (
              <>
                <button className="dropdown__item" onClick={() => { handleCopy(classes.find(c => c.id === activeMenu).code, `code-${activeMenu}`); setActiveMenu(null); }}>
                  {copiedId === `code-${activeMenu}` ? '✓ Copied!' : 'Copy join code'}
                </button>
                <button className="dropdown__item" onClick={() => { handleCopy(invite(classes.find(c => c.id === activeMenu).code), `invite-${activeMenu}`); setActiveMenu(null); }}>
                  {copiedId === `invite-${activeMenu}` ? '✓ Copied!' : 'Copy invite link'}
                </button>
                <div className="dropdown__divider" />
              </>
            )}
            
            <button className="dropdown__item" onClick={() => { openConfirm('regenerate', classes.find(c => c.id === activeMenu)); setActiveMenu(null); }}>
              Generate new code
            </button>
            
            <div className="dropdown__divider" />
            
            <button className="dropdown__item dropdown__item--danger" onClick={() => { openConfirm('delete', classes.find(c => c.id === activeMenu)); setActiveMenu(null); }}>
              Delete class
            </button>
          </div>
        </>
      )}

      {createOpen && (
        <Modal title="Create class" onClose={() => setCreateOpen(false)}>
          <form className="modal__form" onSubmit={handleCreate}>
            <label className="field">
              <span>Class name</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="JSS 3 Green" maxLength={60} required />
            </label>
            <label className="field">
              <span>Description</span>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" maxLength={200} />
            </label>
            <p className="hint">A join code is created automatically.</p>
            {formError && <p className="field__error" role="alert">{formError}</p>}
            <button className="btn btn--primary btn--block" type="submit" disabled={busy || !form.name.trim()}>
              {busy ? 'Creating…' : 'Create class'}
            </button>
          </form>
        </Modal>
      )}

      {editOpen && (
        <Modal title="Edit class" onClose={() => setEditOpen(false)}>
          <form className="modal__form" onSubmit={handleSaveEdit}>
            <label className="field">
              <span>Class name</span>
              <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} maxLength={60} required />
            </label>
            <label className="field">
              <span>Description</span>
              <input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Optional" maxLength={200} />
            </label>
            {editError && <p className="field__error" role="alert">{editError}</p>}
            <div className="confirm-actions">
              <button className="btn btn--ghost" type="button" onClick={() => setEditOpen(false)}>Cancel</button>
              <button className="btn btn--primary" type="submit" disabled={busy || !editForm.name.trim()}>
                {busy ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirm && (
        <Modal title={confirm.kind === 'delete' ? 'Delete class?' : 'Make a new code?'} onClose={() => setConfirm(null)}>
          <div className="modal__form">
            {confirm.kind === 'delete' ? (
              <p>Delete <strong>{confirm.cls.name}</strong>? This can’t be undone.</p>
            ) : (
              <p>Make a new code for <strong>{confirm.cls.name}</strong>? The old code and any invite links you’ve already shared will stop working.</p>
            )}
            {confirmError && <p className="field__error" role="alert">{confirmError}</p>}
            <div className="confirm-actions">
              <button className="btn btn--ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className={`btn ${confirm.kind === 'delete' ? 'btn--danger-solid' : 'btn--primary'}`} onClick={runConfirm} disabled={busy}>
                {busy ? 'Working…' : confirm.kind === 'delete' ? 'Delete class' : 'Make new code'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {assignFor && (
        <Modal title={`Teachers for ${assignFor.name}`} onClose={() => setAssignFor(null)}>
          <div className="modal__form">
            {teachers.length === 0 ? (
              <p className="empty">No teachers yet. Invite one from the Teachers page.</p>
            ) : (
              <div className="check-list">
                {teachers.map((t) => (
                  <label key={t.id} className="check-item">
                    <input
                      type="checkbox"
                      checked={picked.includes(t.id)}
                      onChange={() => toggleTeacher(t.id)}
                      disabled={busy}
                    />
                    <span>
                      <strong>{t.name}</strong>
                      <small>{t.email}{!t.approved ? ' · waiting for approval' : ''}</small>
                    </span>
                  </label>
                ))}
              </div>
            )}
            {assignError && <p className="field__error" role="alert">{assignError}</p>}
            <div className="confirm-actions">
              <button className="btn btn--ghost" onClick={() => setAssignFor(null)}>Cancel</button>
              <button className="btn btn--primary" onClick={saveAssign} disabled={busy}>
                {busy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  )
}