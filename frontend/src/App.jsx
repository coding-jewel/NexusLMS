import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Register from './pages/Register'
import Login from './pages/Login'
import Join from './pages/Join'
import AdminDashboard from './pages/admin/AdminDashboard'
import Classes from './pages/admin/Classes'
import Teachers from './pages/admin/Teachers'
import Students from './pages/admin/Students'
import Courses from './pages/admin/Courses'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import CourseDetail from './pages/teacher/CourseDetail'
import QuizBuilder from './pages/teacher/QuizBuilder'
import GradeSubmissions from './pages/teacher/GradeSubmissions'
import Gradebook from './pages/teacher/Gradebook'
import Assignments from './pages/teacher/Assignments'
import Quizzes from './pages/teacher/Quizzes'
import MarkQuiz from './pages/teacher/MarkQuiz'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/join" element={<Join />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/classes" element={<Classes />} />
      <Route path="/admin/teachers" element={<Teachers />} />
      <Route path="/admin/students" element={<Students />} />
      <Route path="/admin/courses" element={<Courses />} />
      <Route path="/teacher" element={<TeacherDashboard />} />
      <Route path="/teacher/courses/:id" element={<CourseDetail />} />
      <Route path="/teacher/courses/:id/quizzes/new" element={<QuizBuilder />} />
      <Route path="/teacher/courses/:id/assignments/:aid/grade" element={<GradeSubmissions />} />
      <Route path="/teacher/gradebook" element={<Gradebook />} />
      <Route path="/teacher/assignments" element={<Assignments />} />
      <Route path="/teacher/quizzes" element={<Quizzes />} />
      <Route path="/teacher/courses/:id/quizzes/:qid/mark" element={<MarkQuiz />} />
    </Routes>
  )
}
