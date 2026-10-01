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

export const teachers = [
  { id: 1, name: 'Mrs. Adeyemi', email: 'adeyemi@lincoln.edu', classes: 'JSS 2 Blue, SS 1 Science', courses: 6 },
  { id: 2, name: 'Mr. Bello', email: 'bello@lincoln.edu', classes: 'JSS 1 Gold', courses: 3 },
  { id: 3, name: 'Ms. Ibe', email: 'ibe@lincoln.edu', classes: 'SS 2 Arts, SS 3 Commercial', courses: 7 },
  { id: 4, name: 'Mr. Danjuma', email: 'danjuma@lincoln.edu', classes: 'SS 1 Science', courses: 4 },
]

export const students = [
  { id: 1, name: 'Ngozi Eze', email: 'ngozi@mail.com', className: 'SS 1 Science' },
  { id: 2, name: 'Tunde Bakare', email: 'tunde@mail.com', className: 'JSS 2 Blue' },
  { id: 3, name: 'Chidi Obi', email: 'chidi@mail.com', className: 'JSS 1 Gold' },
  { id: 4, name: 'Fatima Sani', email: 'fatima@mail.com', className: 'SS 2 Arts' },
  { id: 5, name: 'Emeka Nwosu', email: 'emeka@mail.com', className: 'SS 3 Commercial' },
  { id: 6, name: 'Zainab Musa', email: 'zainab@mail.com', className: 'SS 1 Science' },
]

export const courses = [
  { id: 1, title: 'Algebra Notes', className: 'JSS 2 Blue', teacher: 'Mrs. Adeyemi', published: true },
  { id: 2, title: 'Basic Chemistry', className: 'SS 1 Science', teacher: 'Mr. Danjuma', published: true },
  { id: 3, title: 'Literature: Poetry', className: 'SS 2 Arts', teacher: 'Ms. Ibe', published: true },
  { id: 4, title: 'Book-keeping', className: 'SS 3 Commercial', teacher: 'Ms. Ibe', published: false },
  { id: 5, title: 'Integrated Science', className: 'JSS 1 Gold', teacher: 'Mr. Bello', published: false },
]

export const teacher = { name: 'Mrs. Adeyemi', email: 'adeyemi@lincoln.edu' }

export const teacherCourses = [
  { id: 1, title: 'Algebra Notes', className: 'JSS 2 Blue', students: 41, assignments: 3, quizzes: 2, published: true },
  { id: 2, title: 'Basic Chemistry', className: 'SS 1 Science', students: 36, assignments: 2, quizzes: 1, published: true },
  { id: 3, title: 'Geometry Basics', className: 'JSS 2 Blue', students: 41, assignments: 0, quizzes: 0, published: false },
  { id: 4, title: 'Statistics', className: 'SS 1 Science', students: 36, assignments: 1, quizzes: 1, published: true },
]

// one sample course body, reused for every course in the template
export const courseDetail = {
  notes: [
    { id: 1, title: 'Introduction to variables', date: '12 Sep' },
    { id: 2, title: 'Solving linear equations', date: '19 Sep' },
    { id: 3, title: 'Worked examples: word problems', date: '26 Sep' },
  ],
  assignments: [
    { id: 1, title: 'Linear equations worksheet', due: '3 Oct, 11:59 pm', submitted: 34, total: 41, toGrade: 12 },
    { id: 2, title: 'Word problems set A', due: '10 Oct, 11:59 pm', submitted: 9, total: 41, toGrade: 9 },
    { id: 3, title: 'Revision exercise', due: '24 Sep, 11:59 pm', submitted: 41, total: 41, toGrade: 0 },
  ],
  quizzes: [
    { id: 1, title: 'Quiz 1: Variables', questions: 10, minutes: 20, published: true, attempts: 39 },
    { id: 2, title: 'Quiz 2: Equations', questions: 15, minutes: 30, published: false, attempts: 0 },
  ],
  students: ['Tunde Bakare', 'Amaka Obi', 'Segun Alade', 'Hauwa Ibrahim', 'Kelechi Nnadi', 'Bisi Coker'],
}

export const submissions = [
  { id: 1, student: 'Tunde Bakare', at: '2 Oct, 9:14 pm', text: 'I solved questions 1 to 8 and attached my workings. I was unsure about question 6.', files: ['linear-equations.pdf'], graded: false, grade: '', feedback: '' },
  { id: 2, student: 'Amaka Obi', at: '2 Oct, 6:40 pm', text: 'All questions answered. Workings are in the file.', files: ['amaka-worksheet.pdf', 'extra-notes.png'], graded: false, grade: '', feedback: '' },
  { id: 3, student: 'Segun Alade', at: '1 Oct, 11:02 am', text: 'Done.', files: ['segun.pdf'], graded: true, grade: '78', feedback: 'Good method. Show your steps on questions 5 and 6.' },
  { id: 4, student: 'Hauwa Ibrahim', at: '1 Oct, 8:15 am', text: 'Submitted with workings.', files: ['hauwa-algebra.pdf'], graded: true, grade: '92', feedback: 'Excellent work.' },
]

export const gradebook = {
  items: [
    { title: 'Linear equations worksheet', type: 'Assignment', total: 100 },
    { title: 'Word problems set A', type: 'Assignment', total: 50 },
    { title: 'Quiz 1: Variables', type: 'Quiz', total: 20 },
  ],
  rows: [
    { student: 'Tunde Bakare', scores: [85, 40, 16] },
    { student: 'Amaka Obi', scores: [92, 45, 18] },
    { student: 'Segun Alade', scores: [78, null, 14] },
    { student: 'Hauwa Ibrahim', scores: [92, 38, 19] },
    { student: 'Kelechi Nnadi', scores: [null, null, 11] },
    { student: 'Bisi Coker', scores: [66, 30, null] },
  ],
}

export const teacherAssignments = [
  { id: 1, courseId: 1, title: 'Linear equations worksheet', course: 'Algebra Notes', className: 'JSS 2 Blue', due: '3 Oct, 11:59 pm', submitted: 34, total: 41, toGrade: 12 },
  { id: 2, courseId: 1, title: 'Word problems set A', course: 'Algebra Notes', className: 'JSS 2 Blue', due: '10 Oct, 11:59 pm', submitted: 9, total: 41, toGrade: 9 },
  { id: 1, courseId: 2, title: 'Periodic table task', course: 'Basic Chemistry', className: 'SS 1 Science', due: '5 Oct, 11:59 pm', submitted: 30, total: 36, toGrade: 4 },
  { id: 3, courseId: 1, title: 'Revision exercise', course: 'Algebra Notes', className: 'JSS 2 Blue', due: '24 Sep, 11:59 pm', submitted: 41, total: 41, toGrade: 0 },
]

export const teacherQuizzes = [
  { id: 1, courseId: 1, title: 'Quiz 1: Variables', course: 'Algebra Notes', className: 'JSS 2 Blue', questions: 3, minutes: 20, published: true, attempts: 39, toMark: 2 },
  { id: 2, courseId: 1, title: 'Quiz 2: Equations', course: 'Algebra Notes', className: 'JSS 2 Blue', questions: 15, minutes: 30, published: false, attempts: 0, toMark: 0 },
  { id: 1, courseId: 2, title: 'Atoms and elements', course: 'Basic Chemistry', className: 'SS 1 Science', questions: 12, minutes: 25, published: true, attempts: 31, toMark: 0 },
]

export const quizSample = {
  questions: [
    { type: 'MULTIPLE_CHOICE', text: 'What is the value of x in x + 5 = 12?', options: ['5', '7', '12', '17'], correct: 1, marks: 2 },
    { type: 'MULTIPLE_CHOICE', text: 'Which of these is a variable?', options: ['7', 'y', '+', '='], correct: 1, marks: 2 },
    { type: 'OPEN_ENDED', text: 'Explain what a variable is in your own words.', marks: 6 },
  ],
  attempts: [
    { id: 1, student: 'Tunde Bakare', answers: [1, 1, 'A letter that stands for a number we do not know yet.'], graded: false, extra: '' },
    { id: 2, student: 'Amaka Obi', answers: [0, 1, 'It is something that can change, like x or y.'], graded: false, extra: '' },
    { id: 3, student: 'Segun Alade', answers: [1, 1, 'A symbol for a value.'], graded: true, extra: '4' },
  ],
}
