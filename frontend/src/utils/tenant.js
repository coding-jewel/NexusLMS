const ROOT = import.meta.env.VITE_ROOT_DOMAIN || 'nexuslms.com'

// "lincoln.nexuslms.com" -> "lincoln"
// "lincoln.localhost"    -> "lincoln" (local development)
// the main site          -> null
export function getSubdomain() {
  const host = window.location.hostname
  if (host.endsWith(`.${ROOT}`)) {
    const sub = host.slice(0, -(ROOT.length + 1))
    return sub === 'www' ? null : sub
  }
  if (host.endsWith('.localhost')) return host.slice(0, -'.localhost'.length)
  // optional shortcut for development: set VITE_DEV_SUBDOMAIN=lincoln in .env
  return (import.meta.env.DEV && import.meta.env.VITE_DEV_SUBDOMAIN) || null
}

// Builds the address of a school's page, e.g. schoolUrl('lincoln', '/login')
// -> https://lincoln.nexuslms.com/login (or http://lincoln.localhost:5173/login in development)
export function schoolUrl(subdomain, path = '/') {
  const { protocol, hostname, port } = window.location
  const root = hostname.endsWith('localhost') ? 'localhost' : ROOT
  return `${protocol}//${subdomain}.${root}${port ? `:${port}` : ''}${path}`
}

// The main site's own address, with no school subdomain in front of it.
// Used when we need to get off a bad subdomain and back to the root.
export function rootUrl(path = '/') {
  const { protocol, hostname, port } = window.location
  const root = hostname.endsWith('localhost') ? 'localhost' : ROOT
  return `${protocol}//${root}${port ? `:${port}` : ''}${path}`
}