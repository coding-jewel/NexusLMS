import { Routes, Route } from 'react-router-dom'
import RequireRole from './auth/RequireRole'
import Landing from './pages/Landing'
import Register from './pages/Register'
import Login from './pages/Login'
import Join from './pages/Join'
import NotFound from './pages/NotFound'
import AdminDashboard from './pages/admin/AdminDashboard'
import Classes from './pages/admin/Classes'
import Teachers from './pages/admin/Teachers'
import Students from './pages/admin/Students'
import Courses from './pages/admin/Courses'
import Grading from './pages/admin/Grading'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import CourseDetail from './pages/teacher/CourseDetail'
import QuizBuilder from './pages/teacher/QuizBuilder'
import GradeSubmissions from './pages/teacher/GradeSubmissions'
import Gradebook from './pages/teacher/Gradebook'
import Assignments from './pages/teacher/Assignments'
import Quizzes from './pages/teacher/Quizzes'
import MarkQuiz from './pages/teacher/MarkQuiz'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentCourse from './pages/student/StudentCourse'
import StudentAssignment from './pages/student/StudentAssignment'
import TakeTest from './pages/student/TakeTest'
import MyGrades from './pages/student/MyGrades'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/join" element={<Join />} />

      <Route element={<RequireRole role="ADMIN" />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/classes" element={<Classes />} />
        <Route path="/admin/teachers" element={<Teachers />} />
        <Route path="/admin/students" element={<Students />} />
        <Route path="/admin/courses" element={<Courses />} />
        <Route path="/admin/grading" element={<Grading />} />
      </Route>

      <Route element={<RequireRole role="TEACHER" />}>
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/teacher/courses/:id" element={<CourseDetail />} />
        <Route path="/teacher/courses/:id/quizzes/new" element={<QuizBuilder />} />
        <Route path="/teacher/courses/:id/assignments/:aid/grade" element={<GradeSubmissions />} />
        <Route path="/teacher/courses/:id/quizzes/:qid/mark" element={<MarkQuiz />} />
        <Route path="/teacher/gradebook" element={<Gradebook />} />
        <Route path="/teacher/assignments" element={<Assignments />} />
        <Route path="/teacher/quizzes" element={<Quizzes />} />
      </Route>

      <Route element={<RequireRole role="STUDENT" />}>
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/courses/:id" element={<StudentCourse />} />
        <Route path="/student/courses/:id/assignments/:aid" element={<StudentAssignment />} />
        <Route path="/student/courses/:id/tests/:tid" element={<TakeTest />} />
        <Route path="/student/grades" element={<MyGrades />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}