import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Courses from './pages/Courses'
import CourseDetail from './pages/CourseDetail'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

// Test engine
import TestList         from './pages/test/TestList'
import LiveExam         from './pages/test/LiveExam'
import TestInstructions from './pages/test/TestInstructions'
import TestAttempt      from './pages/test/TestAttempt'
import TestResult       from './pages/test/TestResult'

// Admin
import AdminLayout   from './components/admin/AdminLayout'
import AdminLogin    from './pages/admin/AdminLogin'
import AdminOverview from './pages/admin/AdminOverview'
import AdminStudents from './pages/admin/AdminStudents'
import AdminCourses  from './pages/admin/AdminCourses'
import AdminBatches  from './pages/admin/AdminBatches'
import AdminTests    from './pages/admin/AdminTests'
import AdminTestSubmissions from './pages/admin/AdminTestSubmissions'
import AdminVideos   from './pages/admin/AdminVideos'
import AdminNotes    from './pages/admin/AdminNotes'
import AdminPayments from './pages/admin/AdminPayments'
import AdminSettings from './pages/admin/AdminSettings'

// Teacher
import TeacherLayout   from './components/teacher/TeacherLayout'
import TeacherOverview from './pages/teacher/TeacherOverview'
import TeacherCourses  from './pages/teacher/TeacherCourses'
import TeacherTests    from './pages/teacher/TeacherTests'
import TeacherNotes    from './pages/teacher/TeacherNotes'
import TeacherDoubts   from './pages/teacher/TeacherDoubts'
import TeacherStudents from './pages/teacher/TeacherStudents'

function StudentLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"        element={<StudentLayout><Home /></StudentLayout>} />
        <Route path="/courses"    element={<StudentLayout><Courses /></StudentLayout>} />
        <Route path="/courses/:id" element={<StudentLayout><CourseDetail /></StudentLayout>} />
        <Route path="/login"   element={<Login />} />
        <Route path="/dashboard" element={<StudentLayout><Dashboard /></StudentLayout>} />

        {/* Mock test engine */}
        <Route path="/mock-tests"               element={<StudentLayout><TestList /></StudentLayout>} />
        <Route path="/live-exams"                element={<StudentLayout><LiveExam /></StudentLayout>} />
        <Route path="/test/:id/instructions"    element={<StudentLayout><TestInstructions /></StudentLayout>} />
        <Route path="/test/:id/attempt"         element={<TestAttempt />} />
        <Route path="/test/:id/result"          element={<StudentLayout><TestResult /></StudentLayout>} />

        {/* Admin */}
        <Route path="/admin/login"    element={<AdminLogin />} />
        <Route path="/admin"          element={<AdminLayout><AdminOverview /></AdminLayout>} />
        <Route path="/admin/students" element={<AdminLayout><AdminStudents /></AdminLayout>} />
        <Route path="/admin/courses"  element={<AdminLayout><AdminCourses /></AdminLayout>} />
        <Route path="/admin/batches"  element={<AdminLayout><AdminBatches /></AdminLayout>} />
        <Route path="/admin/tests"    element={<AdminLayout><AdminTests /></AdminLayout>} />
        <Route path="/admin/tests/:id/submissions" element={<AdminLayout><AdminTestSubmissions /></AdminLayout>} />
        <Route path="/admin/videos"   element={<AdminLayout><AdminVideos /></AdminLayout>} />
        <Route path="/admin/notes"    element={<AdminLayout><AdminNotes /></AdminLayout>} />
        <Route path="/admin/payments"  element={<AdminLayout><AdminPayments /></AdminLayout>} />
        <Route path="/admin/settings"  element={<AdminLayout><AdminSettings /></AdminLayout>} />

        {/* Teacher */}
        <Route path="/teacher"          element={<TeacherLayout><TeacherOverview /></TeacherLayout>} />
        <Route path="/teacher/courses"  element={<TeacherLayout><TeacherCourses /></TeacherLayout>} />
        <Route path="/teacher/tests"    element={<TeacherLayout><TeacherTests /></TeacherLayout>} />
        <Route path="/teacher/notes"    element={<TeacherLayout><TeacherNotes /></TeacherLayout>} />
        <Route path="/teacher/doubts"   element={<TeacherLayout><TeacherDoubts /></TeacherLayout>} />
        <Route path="/teacher/students" element={<TeacherLayout><TeacherStudents /></TeacherLayout>} />
      </Routes>
    </BrowserRouter>
  )
}
