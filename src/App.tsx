import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Bartender from './pages/Bartender';
import Guest from './pages/Guest';
import GuestPortal from './pages/GuestPortal';
import Dashboard from './pages/Dashboard';
import Projectable from './pages/Projectable';

const ProtectedRoute: React.FC<{ children: React.ReactNode; role?: 'admin' | 'bartender' | 'supervisor' }> = ({ children, role }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (role && user?.role !== role && user?.role !== 'admin') {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/bartender'} />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/guest/:code" element={<Guest />} />
            <Route path="/portal" element={<GuestPortal />} />
            <Route path="/projectable" element={<Projectable />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute role="admin">
                  <Admin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute role="admin">
                  <Dashboard />
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
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
