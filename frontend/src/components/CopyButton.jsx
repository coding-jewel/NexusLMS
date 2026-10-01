import { useState } from 'react'

export default function CopyButton({ text, label = 'Copy', className = 'btn btn--ghost btn--sm' }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try { await navigator.clipboard.writeText(text) } catch { /* clipboard blocked: ignore in template */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return <button type="button" className={className} onClick={copy}>{copied ? 'Copied' : label}</button>
}
