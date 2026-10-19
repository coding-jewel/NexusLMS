import { useState } from 'react'
import AppLayout from '../components/AppLayout'
import PasswordField from '../components/PasswordField'
import { useAuth } from '../auth/AuthContext'
import { changePassword } from '../api/users'
import '../styles/admin.css'

export default function Settings() {
  const { user } = useAuth()
  // The backend gives us 'ADMIN', 'TEACHER', or 'STUDENT'. AppLayout expects lowercase.
  const role = user?.role?.toLowerCase() || 'student'

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [pwBusy, setPwBusy] = useState(false)

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

  return (
    <AppLayout role={role} title="Settings">
      <div className="page-head">
        <p>Manage your account details and security.</p>
      </div>

      <div className="columns">
        {/* Account Details (Static) */}
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

        {/* Password Form */}
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
            <button className="btn btn--primary" type="submit" disabled={pwBusy || !currentPw || !newPw || !confirmPw}>
              {pwBusy ? 'Changing…' : 'Change password'}
            </button>
          </form>
        </section>
      </div>
    </AppLayout>
  )
}