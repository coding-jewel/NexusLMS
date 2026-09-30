// All template data lives here so real API calls can replace it later.
export const school = { name: 'Lincoln High School', subdomain: 'lincoln' }
export const admin = { name: 'Amara Okafor', email: 'amara@lincoln.edu' }

export const stats = [
  { label: 'Classes', value: 12, note: '2 added this term' },
  { label: 'Teachers', value: 18, note: '3 pending first login' },
  { label: 'Students', value: 426, note: '31 joined this week' },
  { label: 'Courses', value: 64, note: '58 published' },
]

export const classes = [
  { id: 1, name: 'JSS 1 Gold', teachers: 4, students: 38, courses: 9, code: 'GLD-4K7Q' },
  { id: 2, name: 'JSS 2 Blue', teachers: 5, students: 41, courses: 10, code: 'BLU-9M2X' },
  { id: 3, name: 'SS 1 Science', teachers: 6, students: 36, courses: 12, code: 'SCI-7P3W' },
  { id: 4, name: 'SS 2 Arts', teachers: 4, students: 33, courses: 8, code: 'ART-2H8D' },
  { id: 5, name: 'SS 3 Commercial', teachers: 5, students: 29, courses: 9, code: 'COM-5T6R' },
]

export const activity = [
  { id: 1, text: 'Ngozi Eze joined SS 1 Science with a class code', time: '12 min ago' },
  { id: 2, text: 'You added Mr. Bello as a teacher', time: '1 hour ago' },
  { id: 3, text: 'Mrs. Adeyemi published Algebra Notes in JSS 2 Blue', time: '3 hours ago' },
  { id: 4, text: 'You created the class SS 3 Commercial', time: 'Yesterday' },
  { id: 5, text: '14 students joined JSS 1 Gold', time: 'Yesterday' },
]

export const features = [
  ['Classes', 'Group students into classes and sections. Each class has its own join code.'],
  ['Courses and notes', 'Teachers publish notes and materials for their class, and students read them anywhere.'],
  ['Assignments and file uploads', 'Set a due date, attach files, and collect student work in one place.'],
  ['Quizzes with auto-grading', 'Multiple-choice questions are marked instantly. Open-ended answers wait for the teacher.'],
  ['Gradebook', 'Every score for every student, by course, without a spreadsheet.'],
  ['Roles and permissions', 'Admins, teachers and students each see only what they need.'],
]
