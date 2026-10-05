// Words dropped from the short first guess, so "Lincoln High School" suggests "lincoln".
const FILLER = ['high', 'school', 'academy', 'college', 'institute', 'secondary', 'international', 'the', 'of']

const words = (name) => name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').split(/\s+/).filter(Boolean)
const tidy = (s) => s.replace(/-+/g, '-').slice(0, 30).replace(/^-|-$/g, '')

// The short first guess.
export function generateSubdomain(name) {
  const all = words(name)
  const kept = all.filter((w) => !FILLER.includes(w))
  return tidy((kept.length ? kept : all).join('-'))
}

// Every word kept. Offered when the short guess is already taken.
export function fullSlug(name) {
  return tidy(words(name).join('-'))
}