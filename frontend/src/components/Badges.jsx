const TYPE = {
  QUIZ: ['Quiz', 'badge--test'],
  TEST: ['Test', 'badge--test'],
  EXAM: ['Exam', 'badge--exam'],
}
const STATUS = { DRAFT: ['Draft', ''], OPEN: ['Open', 'badge--live'], CLOSED: ['Closed', 'badge--closed'] }

export const TypeBadge = ({ category }) => {
  const entry = TYPE[category] ?? ['—', '']
  return <span className={`badge ${entry[1]}`}>{entry[0]}</span>
}
export const StatusBadge = ({ status }) => {
  const entry = STATUS[status] ?? ['—', '']
  return <span className={`badge ${entry[1]}`}>{entry[0]}</span>
}