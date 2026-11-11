import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import PasswordField from '../components/PasswordField'
import Modal from '../components/Modal'
import { useAuth } from '../auth/AuthContext'
import { changePassword } from '../api/users'
import { clearSchoolData, deleteSchool } from '../api/admin'
import { PASSWORD_REGEX, PASSWORD_HINT } from '../utils/password'
import '../styles/admin.css'

export default function Settings() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  const role = user?.role?.toLowerCase() || 'student'

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [pwBusy, setPwBusy] = useState(false)

  const [clearModal, setClearModal] = useState(false)
  const [clearConfirm, setClearConfirm] = useState('')
  const [clearError, setClearError] = useState('')
  const [clearBusy, setClearBusy] = useState(false)

  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleteBusy, setDeleteBusy] = useState(false)

  const handlePassword = async (e) => {
    e.preventDefault()
    setPwMsg('')
    setPwErr('')
    if (newPw !== confirmPw) {
      setPwErr('New passwords don\'t match.')
      return
    }
    setPwBusy(true)
    try {
      await changePassword(currentPw, newPw)
      setPwMsg('Password changed successfully.')
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
    } catch (err) {
      setPwErr(err.message)
    } finally {
      setPwBusy(false)
    }
  }

  const handleClear = async (e) => {
    e.preventDefault()
    if (clearConfirm !== 'DELETE') return
    setClearError('')
    setClearBusy(true)
    try {
      await clearSchoolData()
      setClearModal(false)
      setClearConfirm('')
      // Stay on the subdomain, just refresh the admin dashboard
      navigate('/admin') 
      window.location.reload()
    } catch (err) {
      setClearError(err.message)
    } finally {
      setClearBusy(false)
    }
  }

  const handleDeleteSchool = async (e) => {
    e.preventDefault()
    if (deleteConfirm !== 'DELETE') return
    setDeleteError('')
    setDeleteBusy(true)
    try {
      await deleteSchool()
      logout()
      
      // FIXED: Strip the subdomain when redirecting to the root
      const host = window.location.host // e.g., "school.localhost:5173"
      const parts = host.split('.')
      const rootUrl = parts.length > 1 
        ? `${window.location.protocol}//${parts.slice(1).join('.')}` 
        : window.location.origin
        
      window.location.href = rootUrl
    } catch (err) {
      setDeleteError(err.message)
      setDeleteBusy(false)
    }
  }

  const strongPw = PASSWORD_REGEX.test(newPw)

  return (
    <AppLayout role={role} title="Settings">
      <div className="page-head">
        <p>Manage your account details and security.</p>
      </div>

      <div className="columns">
        <section className="panel">
          <h2>Account Details</h2>
          <div className="modal__form" style={{ marginTop: '1rem' }}>
            <label className="field">
              <span>Name</span>
              <input value={user?.name || ''} disabled style={{ background: 'var(--slate-50)', color: 'var(--slate-500)' }} />
            </label>
            <label className="field">
              <span>Email</span>
              <input value={user?.email || ''} disabled style={{ background: 'var(--slate-50)', color: 'var(--slate-500)' }} />
            </label>
            <p className="hint">Your name and email address can't be changed here. Ask your school admin if you need help.</p>
          </div>
        </section>

        <section className="panel">
          <h2>Change Password</h2>
          <form className="modal__form" onSubmit={handlePassword} style={{ marginTop: '1rem' }}>
            <PasswordField 
              label="Current password" 
              value={currentPw} 
              onChange={(e) => setCurrentPw(e.target.value)} 
              autoComplete="current-password"
            />
            <PasswordField 
              label="New password" 
              value={newPw} 
              onChange={(e) => setNewPw(e.target.value)} 
              placeholder={PASSWORD_HINT}
              autoComplete="new-password"
              minLength={8}
            />
            <PasswordField 
              label="Confirm new password" 
              value={confirmPw} 
              onChange={(e) => setConfirmPw(e.target.value)} 
              autoComplete="new-password"
              minLength={8}
            />
            {pwErr && <p className="field__error" role="alert">{pwErr}</p>}
            {pwMsg && <p className="saved" role="status">{pwMsg}</p>}
            <button className="btn btn--primary" type="submit" disabled={pwBusy || !currentPw || !strongPw || !confirmPw}>
              {pwBusy ? 'Changing…' : 'Change password'}
            </button>
          </form>
        </section>
      </div>

      {role === 'admin' && (
        <section className="panel" style={{ borderColor: 'var(--danger)', marginTop: '2rem' }}>
          <h2 style={{ color: 'var(--danger)' }}>Danger Zone</h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--slate-100)', paddingBottom: '1.5rem' }}>
            <div>
              <strong>Clear school data</strong>
              <p className="hint" style={{ margin: '0.2rem 0 0' }}>
                Delete all classes, topics, assignments, and users. Only your admin account will remain.
              </p>
            </div>
            <button className="btn btn--danger-solid" onClick={() => { setClearConfirm(''); setClearError(''); setClearModal(true); }}>
              Clear data
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <strong>Delete school</strong>
              <p className="hint" style={{ margin: '0.2rem 0 0' }}>
                Permanently delete this school, its subdomain, and all user accounts. This cannot be undone.
              </p>
            </div>
            <button className="btn btn--danger-solid" onClick={() => { setDeleteConfirm(''); setDeleteError(''); setDeleteModal(true); }}>
              Delete school
            </button>
          </div>
        </section>
      )}

      {clearModal && (
        <Modal title="Clear all school data?" onClose={() => setClearModal(false)}>
          <form className="modal__form" onSubmit={handleClear}>
            <p>This will permanently delete all teachers, students, classes, topics, and grades for this school. Your admin account will remain so you can start fresh.</p>
            <p>Type <strong>DELETE</strong> to confirm.</p>
            <label className="field">
              <input value={clearConfirm} onChange={(e) => setClearConfirm(e.target.value)} placeholder="DELETE" autoComplete="off" />
            </label>
            {clearError && <p className="field__error" role="alert">{clearError}</p>}
            <div className="confirm-actions">
              <button type="button" className="btn btn--ghost" onClick={() => setClearModal(false)}>Cancel</button>
              <button type="submit" className="btn btn--danger-solid" disabled={clearBusy || clearConfirm !== 'DELETE'}>
                {clearBusy ? 'Clearing…' : 'Clear data'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteModal && (
        <Modal title="Delete entire school?" onClose={() => setDeleteModal(false)}>
          <form className="modal__form" onSubmit={handleDeleteSchool}>
            <p style={{ color: 'var(--danger)', fontWeight: 'bold' }}>WARNING: This action is irreversible.</p>
            <p>This will delete the school, the subdomain, all users (including your admin account), and all data permanently.</p>
            <p>Type <strong>DELETE</strong> to confirm.</p>
            <label className="field">
              <input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="DELETE" autoComplete="off" />
            </label>
            {deleteError && <p className="field__error" role="alert">{deleteError}</p>}
            <div className="confirm-actions">
              <button type="button" className="btn btn--ghost" onClick={() => setDeleteModal(false)}>Cancel</button>
              <button type="submit" className="btn btn--danger-solid" disabled={deleteBusy || deleteConfirm !== 'DELETE'}>
                {deleteBusy ? 'Deleting…' : 'Delete school'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  )
}