const TYPE = { TEST: ['Test', 'badge--test'], EXAM: ['Exam', 'badge--exam'] }
const STATUS = { DRAFT: ['Draft', ''], OPEN: ['Open', 'badge--live'], CLOSED: ['Closed', 'badge--closed'] }

export const TypeBadge = ({ category }) => <span className={`badge ${TYPE[category][1]}`}>{TYPE[category][0]}</span>
export const StatusBadge = ({ status }) => <span className={`badge ${STATUS[status][1]}`}>{STATUS[status][0]}</span>
