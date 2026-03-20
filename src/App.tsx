import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Modal } from '@/components/Modal';
import { Preloader } from '@/components/Preloader';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Tests } from '@/pages/Tests';
import { TestView } from '@/pages/TestView';
import { ResultsView } from '@/pages/ResultsView';
import { Profile } from '@/pages/Profile';
import { Matrix } from '@/pages/Matrix';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { CreateUser } from '@/pages/admin/CreateUser';
import { CreateTest } from '@/pages/admin/CreateTest';
import { EditTest } from '@/pages/admin/EditTest';
import { CreateCategory } from '@/pages/admin/CreateCategory';
import { EditCategory } from '@/pages/admin/EditCategory';
import { UserProfileView } from '@/pages/admin/UserProfileView';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';

const ProtectedRoute = ({ children, role }: { children: React.ReactNode; role?: 'curator' | 'user' }) => {
  const { user, profile, loading: authLoading, profileLoaded } = useAuth();
  const { loading: appLoading } = useApp();

  if (authLoading || appLoading) return <Preloader />;
  if (!user) return <Navigate to="/login" replace />;
  
  // Wait for profile to load before checking role
  if (user && !profileLoaded) return <Preloader />;
  
  if (role === 'curator' && profile?.role !== 'curator' && profile?.role !== 'admin') return <Navigate to="/" replace />;
  if (role === 'user' && profile?.role !== 'user' && profile?.role !== 'admin') return <Navigate to="/" replace />;

  return <>{children}</>;
};

function App() {
  const { user, loading: authLoading } = useAuth();
  
  // Do not block the entire app (like the login screen) on appLoading
  if (authLoading) return <Preloader />;

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
          
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tests" element={<Tests />} />
            <Route path="/test" element={<TestView />} />
            <Route path="/results/:id" element={<ResultsView />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/matrix" element={<Matrix />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute role="curator"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/user/create" element={<ProtectedRoute role="curator"><CreateUser /></ProtectedRoute>} />
            <Route path="/admin/user/:id" element={<ProtectedRoute role="curator"><UserProfileView /></ProtectedRoute>} />
            <Route path="/admin/test/create" element={<ProtectedRoute role="curator"><CreateTest /></ProtectedRoute>} />
            <Route path="/admin/test/edit" element={<ProtectedRoute role="curator"><EditTest /></ProtectedRoute>} />
            <Route path="/admin/category/create" element={<ProtectedRoute role="curator"><CreateCategory /></ProtectedRoute>} />
            <Route path="/admin/category/edit" element={<ProtectedRoute role="curator"><EditCategory /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Modal />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
