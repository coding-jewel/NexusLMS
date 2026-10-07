import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import CopyButton from '../../components/CopyButton'
import Modal from '../../components/Modal'
import { useTenant } from '../../tenant/TenantContext'
import { schoolUrl } from '../../utils/tenant'
import {
  listUsers,
  approveUser,
  declineUser,
  deleteUser,
  getTeacherCode,
  regenerateTeacherCode,
} from '../../api/users'
import { listClasses } from '../../api/classes'

const byName = (list) => [...list].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')

export default function Teachers() {
  const { subdomain } = useTenant()
  const [data, setData] = useState(null) // { code, teachers, classes }
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(null) // { kind: 'regenerate' | 'approve' | 'decline' | 'remove', teacher? }
  const [confirmError, setConfirmError] = useState('')

  const load = () => {
    setLoadError('')
    setData(null)
    Promise.all([getTeacherCode(), listUsers({ role: 'TEACHER' }), listClasses()])
      .then(([codeRes, teachers, classes]) => setData({ code: codeRes.code, teachers: byName(teachers), classes }))
      .catch((err) => setLoadError(err.message))
  }
  useEffect(() => { load() }, [])

  const waiting = data ? data.teachers.filter((t) => !t.approved) : []
  const active = data ? data.teachers.filter((t) => t.approved) : []
  const className = (id) => data.classes.find((c) => c.id === id)?.name ?? 'Unknown class'
  const inviteLink = data ? schoolUrl(subdomain, `/join?code=${encodeURIComponent(data.code)}`) : ''

  const openConfirm = (kind, teacher) => { setConfirmError(''); setConfirm({ kind, teacher }) }
  const closeConfirm = () => { setConfirm(null); setConfirmError('') }

  const runConfirm = async () => {
    setConfirmError('')
    setBusy(true)
    try {
      const { kind, teacher } = confirm
      if (kind === 'regenerate') {
        const fresh = await regenerateTeacherCode()
        setData({ ...data, code: fresh.code })
      } else if (kind === 'approve') {
        const updated = await approveUser(teacher.id)
        setData({ ...data, teachers: data.teachers.map((t) => (t.id === teacher.id ? updated : t)) })
      } else if (kind === 'decline') {
        await declineUser(teacher.id)
        setData({ ...data, teachers: data.teachers.filter((t) => t.id !== teacher.id) })
      } else if (kind === 'remove') {
        await deleteUser(teacher.id)
        setData({ ...data, teachers: data.teachers.filter((t) => t.id !== teacher.id) })
      }
      setConfirm(null)
    } catch (err) {
      setConfirmError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const modalTitle = () => {
    if (confirm.kind === 'regenerate') return 'Make a new code?'
    if (confirm.kind === 'approve') return 'Approve this teacher?'
    if (confirm.kind === 'decline') return 'Decline this request?'
    return 'Remove this teacher?'
  }

  const modalLabel = () => {
    if (confirm.kind === 'regenerate') return 'Make new code'
    if (confirm.kind === 'approve') return 'Approve'
    if (confirm.kind === 'decline') return 'Decline'
    return 'Remove teacher'
  }

  const modalBody = () => {
    if (confirm.kind === 'regenerate') {
      return <p>Make a new sign-up code? The old code and any invite links you’ve already shared will stop working.</p>
    }
    if (confirm.kind === 'approve') {
      return <p>Approve <strong>{confirm.teacher.name}</strong>? They’ll be able to sign in straight away.</p>
    }
    if (confirm.kind === 'decline') {
      return <p>Decline <strong>{confirm.teacher.name}</strong>’s request? Their account is removed and they can apply again.</p>
    }
    return <p>Remove <strong>{confirm.teacher.name}</strong>? Their account is deleted and they won’t be able to sign in. This can’t be undone.</p>
  }

  const destructive = confirm && (confirm.kind === 'decline' || confirm.kind === 'remove')

  return (
    <AdminLayout title="Teachers">
      <div className="page-head">
        <p>Teachers sign up with the school code, then wait for your approval before they can sign in.</p>
      </div>

      {loadError ? (
        <section className="panel">
          <div className="empty">
            <p className="field__error" role="alert">{loadError}</p>
            <button className="btn btn--ghost" onClick={load}>Try again</button>
          </div>
        </section>
      ) : data === null ? (
        <section className="panel"><p className="empty">Loading teachers…</p></section>
      ) : (
        <>
          <section className="address-card">
            <div>
              <span className="address-card__label">Teacher sign-up code</span>
              <strong>{data.code}</strong>
              <p>Share this with teachers. They sign up at your school’s join page, then wait for your approval.</p>
            </div>
            <div className="row-actions">
              <CopyButton text={data.code} label="Copy code" className="btn btn--primary" />
              <CopyButton text={inviteLink} label="Copy invite link" className="btn btn--light" />
              <button className="btn btn--light" onClick={() => openConfirm('regenerate')}>New code</button>
            </div>
          </section>

          {waiting.length > 0 && (
            <section className="panel">
              <div className="panel__head">
                <h2>Waiting for approval</h2>
                <span className="badge badge--warn">{waiting.length}</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Requested</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {waiting.map((t) => (
                      <tr key={t.id}>
                        <td><strong>{t.name}</strong></td>
                        <td>{t.email}</td>
                        <td>{formatDate(t.createdAt)}</td>
                        <td className="cell-wrap">
                          <div className="row-actions">
                            <button className="btn btn--primary btn--sm" onClick={() => openConfirm('approve', t)}>Approve</button>
                            <button className="btn btn--ghost btn--sm btn--danger" onClick={() => openConfirm('decline', t)}>Decline</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section className="panel">
            {active.length === 0 ? (
              <p className="empty">No teachers yet. Share the sign-up code above to invite them.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Classes</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {active.map((t) => (
                      <tr key={t.id}>
                        <td><strong>{t.name}</strong></td>
                        <td>{t.email}</td>
                        <td>
                          <div className="chips">
                            {(t.classIds ?? []).length === 0
                              ? <span className="muted-text">No class</span>
                              : t.classIds.map((id) => <span key={id} className="badge badge--test">{className(id)}</span>)}
                          </div>
                        </td>
                        <td className="cell-wrap">
                          <div className="row-actions">
                            <button className="btn btn--ghost btn--sm btn--danger" onClick={() => openConfirm('remove', t)}>Remove</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {confirm && (
        <Modal title={modalTitle()} onClose={closeConfirm}>
          <div className="modal__form">
            {modalBody()}
            {confirmError && <p className="field__error" role="alert">{confirmError}</p>}
            <div className="confirm-actions">
              <button className="btn btn--ghost" onClick={closeConfirm}>Cancel</button>
              <button
                className={`btn ${destructive ? 'btn--danger-solid' : 'btn--primary'}`}
                onClick={runConfirm}
                disabled={busy}
              >
                {busy ? 'Working…' : modalLabel()}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  )
}