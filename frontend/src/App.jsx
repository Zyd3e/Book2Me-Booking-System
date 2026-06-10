import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './context/store';

// Auth Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';

// Customer Portal
import RoomsPage from './pages/CustomerPortal/RoomsPage';
import BookRoomPage from './pages/CustomerPortal/BookRoomPage';
import HallsPage from './pages/CustomerPortal/HallsPage';
import BookingsPage from './pages/CustomerPortal/BookingsPage';

// Admin Dashboard
import AdminDashboard from './pages/AdminDashboard/DashboardPage';
import ManageRoomsPage from './pages/AdminDashboard/ManageRoomsPage';
import ManageHallsPage from './pages/AdminDashboard/ManageHallsPage';
import BookingsManagementPage from './pages/AdminDashboard/BookingsManagementPage';

// HR Module
import StaffPage from './pages/HRModule/StaffPage';

// Protected Route
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
  }));

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Customer Portal */}
        <Route path="/customer/rooms" element={<ProtectedRoute requiredRole="customer"><RoomsPage /></ProtectedRoute>} />
        <Route path="/customer/book-room/:roomId" element={<ProtectedRoute requiredRole="customer"><BookRoomPage /></ProtectedRoute>} />
        <Route path="/customer/halls" element={<ProtectedRoute requiredRole="customer"><HallsPage /></ProtectedRoute>} />
        <Route path="/customer/bookings" element={<ProtectedRoute requiredRole="customer"><BookingsPage /></ProtectedRoute>} />

        {/* Admin Dashboard */}
        <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/rooms" element={<ProtectedRoute requiredRole="admin"><ManageRoomsPage /></ProtectedRoute>} />
        <Route path="/admin/halls" element={<ProtectedRoute requiredRole="admin"><ManageHallsPage /></ProtectedRoute>} />
        <Route path="/admin/bookings" element={<ProtectedRoute requiredRole="admin"><BookingsManagementPage /></ProtectedRoute>} />

        {/* HR Module */}
        <Route path="/hr/staff" element={<ProtectedRoute requiredRole="hr_manager"><StaffPage /></ProtectedRoute>} />

        {/* Public home route */}
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
