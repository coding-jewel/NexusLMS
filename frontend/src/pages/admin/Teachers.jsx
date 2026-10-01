import { useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import CopyButton from '../../components/CopyButton'
import Modal from '../../components/Modal'
import { school, teachers } from '../../data/mock'

const makePassword = () => Math.random().toString(36).slice(2, 6) + '-' + Math.random().toString(36).slice(2, 6)

export default function Teachers() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [created, setCreated] = useState(null)
  const address = `${school.subdomain}.nexuslms.com`
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const close = () => { setOpen(false); setCreated(null); setForm({ name: '', email: '', password: '' }) }

  const details = created && `Sign in to ${school.name}\nAddress: https://${address}\nEmail: ${created.email}\nPassword: ${created.password}`

  return (
    <AdminLayout title="Teachers">
      <div className="page-head">
        <p>Teachers can’t sign themselves up. Add them here and share their details.</p>
        <button className="btn btn--primary" onClick={() => setOpen(true)}>Add teacher</button>
      </div>
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Classes</th><th>Courses</th></tr></thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id}><td><strong>{t.name}</strong></td><td>{t.email}</td><td>{t.classes}</td><td>{t.courses}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {open && (
        <Modal title={created ? 'Teacher added' : 'Add teacher'} onClose={close}>
          {created ? (
            <div className="modal__form">
              <p>Share these details with {created.name}. The password won’t be shown again.</p>
              <dl className="credentials">
                <div><dt>Address</dt><dd>{address}</dd></div>
                <div><dt>Email</dt><dd>{created.email}</dd></div>
                <div><dt>Password</dt><dd>{created.password}</dd></div>
              </dl>
              <CopyButton text={details} label="Copy details" className="btn btn--primary btn--block" />
              <button className="btn btn--ghost btn--block" onClick={close}>Done</button>
            </div>
          ) : (
            <form className="modal__form" onSubmit={(e) => { e.preventDefault(); setCreated(form) }}>
              <label className="field"><span>Full name</span><input value={form.name} onChange={set('name')} placeholder="Mr. Bello" required /></label>
              <label className="field"><span>Email</span><input type="email" value={form.email} onChange={set('email')} placeholder="bello@school.edu" required /></label>
              <label className="field">
                <span>Starting password</span>
                <div className="input-action">
                  <input value={form.password} onChange={set('password')} minLength={8} required />
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => setForm({ ...form, password: makePassword() })}>Generate</button>
                </div>
              </label>
              <button className="btn btn--primary btn--block" type="submit">Add teacher</button>
            </form>
          )}
        </Modal>
      )}
    </AdminLayout>
  )
}
