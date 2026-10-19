import { Routes, Route } from 'react-router-dom'
import RequireRole from './auth/RequireRole'
import Landing from './pages/Landing'
import Register from './pages/Register'
import Login from './pages/Login'
import Join from './pages/Join'
import NotFound from './pages/NotFound'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Settings from './pages/Settings'

import AdminDashboard from './pages/admin/AdminDashboard'
import Classes from './pages/admin/Classes'
import Teachers from './pages/admin/Teachers'
import Students from './pages/admin/Students'
import Courses from './pages/admin/Courses'
import Grading from './pages/admin/Grading'

import TeacherOverview from './pages/teacher/TeacherOverview'
import TeacherClasses from './pages/teacher/TeacherClasses'
import TeacherCourses from './pages/teacher/TeacherCourses'
import CourseDetail from './pages/teacher/CourseDetail'
import QuizBuilder from './pages/teacher/QuizBuilder'
import TestsAndExams from './pages/teacher/TestsAndExams'
import GradeSubmissions from './pages/teacher/GradeSubmissions'
import Gradebook from './pages/teacher/Gradebook'
import Assignments from './pages/teacher/Assignments'
import MarkQuiz from './pages/teacher/MarkQuiz'

import StudentDashboard from './pages/student/StudentDashboard'
import StudentTopics from './pages/student/StudentTopics'
import StudentCourse from './pages/student/StudentCourse'
import StudentAssignment from './pages/student/StudentAssignment'
import StudentAssessments from './pages/student/StudentAssessments'
import TakeTest from './pages/student/TakeTest'
import MyGrades from './pages/student/MyGrades'

export default function App() {
  return (
    <Routes>
      {/* --- Public Routes --- */}
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/join" element={<Join />} />

      {/* --- Admin Routes --- */}
      <Route element={<RequireRole role="ADMIN" />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/classes" element={<Classes />} />
        <Route path="/admin/teachers" element={<Teachers />} />
        <Route path="/admin/students" element={<Students />} />
        <Route path="/admin/courses" element={<Courses />} />
        <Route path="/admin/grading" element={<Grading />} />
      </Route>

      {/* --- Teacher Routes --- */}
      <Route element={<RequireRole role="TEACHER" />}>
        <Route path="/teacher" element={<TeacherOverview />} />
        <Route path="/teacher/classes" element={<TeacherClasses />} />
        <Route path="/teacher/courses" element={<TeacherCourses />} />
        <Route path="/teacher/courses/:id" element={<CourseDetail />} />
        <Route path="/teacher/quizzes" element={<TestsAndExams />} />
        <Route path="/teacher/quizzes/new" element={<QuizBuilder />} />
        <Route path="/teacher/quizzes/:id/edit" element={<QuizBuilder />} />
        <Route path="/teacher/courses/:id/assignments/:aid/grade" element={<GradeSubmissions />} />
        <Route path="/teacher/quizzes/:qid/mark" element={<MarkQuiz />} />
        <Route path="/teacher/gradebook" element={<Gradebook />} />
        <Route path="/teacher/assignments" element={<Assignments />} />
      </Route>

      {/* --- Student Routes --- */}
      <Route element={<RequireRole role="STUDENT" />}>
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/topics" element={<StudentTopics />} />
        <Route path="/student/courses/:id" element={<StudentCourse />} />
        <Route path="/student/courses/:id/assignments/:aid" element={<StudentAssignment />} />
        <Route path="/student/assessments" element={<StudentAssessments />} />
        <Route path="/student/quizzes/:qid/take" element={<TakeTest />} />
        <Route path="/student/grades" element={<MyGrades />} />
      </Route>

      {/* --- Shared Authenticated Routes --- */}
      <Route element={<RequireRole />}>
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}