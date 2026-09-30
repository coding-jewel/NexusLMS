// Words dropped so "Lincoln High School" becomes "lincoln".
const FILLER = ['high', 'school', 'academy', 'college', 'institute', 'secondary', 'international', 'the', 'of']
export const RESERVED = ['www', 'app', 'api', 'admin', 'mail', 'support', 'help']

export function generateSubdomain(name) {
  const words = name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').split(/\s+/).filter(Boolean)
  const kept = words.filter((w) => !FILLER.includes(w))
  const slug = (kept.length ? kept : words).join('-').replace(/-+/g, '-')
  return slug.slice(0, 30)
}
