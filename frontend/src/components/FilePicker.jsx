import { useState } from 'react'

const MAX_MB = 10
const size = (b) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(b / 1024)} KB`)

// Template only: keeps the chosen files in state. The real version uploads each one to /api/files/upload.
export default function FilePicker({ label = 'Attachments' }) {
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')

  const onPick = (e) => {
    const picked = [...e.target.files]
    const tooBig = picked.find((f) => f.size > MAX_MB * 1024 * 1024)
    setError(tooBig ? `${tooBig.name} is over ${MAX_MB} MB.` : '')
    setFiles((prev) => [...prev, ...picked.filter((f) => f.size <= MAX_MB * 1024 * 1024)])
    e.target.value = ''
  }

  return (
    <div className="file-picker">
      <span className="file-picker__label">{label}</span>
      <label className="btn btn--ghost btn--sm file-picker__btn">
        Choose files
        <input type="file" multiple onChange={onPick} hidden />
      </label>
      <span className="hint">Up to {MAX_MB} MB each.</span>
      {error && <p className="field__error">{error}</p>}
      {files.length > 0 && (
        <ul className="file-list">
          {files.map((f, i) => (
            <li key={f.name + i}>
              <span>{f.name} <small>{size(f.size)}</small></span>
              <button type="button" className="link-btn" onClick={() => setFiles(files.filter((_, k) => k !== i))}>Remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
