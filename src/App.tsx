import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LayoutHome } from './components/LayoutHome';
import { Layout } from './components/layout/Layout';

// Auth Components
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';

// Public Pages
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { SettingsPage } from './pages/SettingsPage';

// Dashboard Pages - UPDATED
import { AdminDashboard } from './pages/AdminDashboard';
import { ParentDashboard } from './pages/ParentDashboard';
import { StudentDashboard } from './pages/StudentDashboard';

// Feature Pages
import  { TeachingMode }  from './pages/TeachingMode';
import { PDFLibrary } from './pages/PDFLibrary';
import { ManageSubjectsPage } from './pages/ManageSubjectsPage';
import { ManageUsersPage } from './pages/ManageUsersPage';
import { MyProgressPage } from './pages/MyProgressPage';
import { StudentProgressPage } from './pages/StudentProgressPage';
import { DoubtsPage } from './pages/DoubtsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes with Home Layout */}
          <Route path="/" element={
            <LayoutHome>
              <HomePage />
            </LayoutHome>
          } />
          <Route path="/about" element={
            <LayoutHome>
              <AboutPage />
            </LayoutHome>
          } />
          <Route path="/contact" element={
            <LayoutHome>
              <ContactPage />
            </LayoutHome>
          } />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />

          {/* Protected Routes with Dashboard Layout - UPDATED */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                {/* This will redirect to appropriate dashboard based on role */}
                <RoleBasedDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/student" element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout>
                <StudentDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/progress" element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout>
                <MyProgressPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/parent" element={
            <ProtectedRoute allowedRoles={['parent']}>
              <Layout>
                <ParentDashboard />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Feature Routes */}
          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <ManageUsersPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/progress" element={
            <ProtectedRoute allowedRoles={['admin', 'parent']}>
              <Layout>
                <StudentProgressPage />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/parent/progress" element={
            <ProtectedRoute allowedRoles={['parent']}>
              <Layout>
                <StudentProgressPage />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/admin/progress" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <StudentProgressPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/parent/doubts" element={
            <ProtectedRoute allowedRoles={['parent']}>
              <Layout>
                <DoubtsPage />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/admin/doubts" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <DoubtsPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/subjects" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <ManageSubjectsPage />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <SettingsPage />
                </Layout>
              </ProtectedRoute>
            } />
          
          <Route path="/pdfs" element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <Layout>
                <PDFLibrary />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/teaching" element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout>
                <TeachingMode />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Redirect to home for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

// RoleBasedDashboard component to redirect to appropriate dashboard
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/useAuth';

function RoleBasedDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'student':
          navigate('/student');
          break;
        case 'parent':
          navigate('/parent');
          break;
        default:
          navigate('/');
      }
    }
  }, [user, navigate]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

export default App;