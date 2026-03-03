import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Bartender from './pages/Bartender';
import Guest from './pages/Guest';
import GuestPortal from './pages/GuestPortal';

const ProtectedRoute: React.FC<{ children: React.ReactNode; role?: 'admin' | 'bartender' }> = ({ children, role }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (role && user?.role !== role) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/bartender'} />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/guest/:code" element={<Guest />} />
          <Route path="/portal" element={<GuestPortal />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute role="admin">
                <Admin />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bartender" 
            element={
              <ProtectedRoute role="bartender">
                <Bartender />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
