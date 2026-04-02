// src/App.jsx — Router + protected route wiring
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Landing         from './pages/Landing';
import Login           from './pages/Login';
import Register        from './pages/Register';
import Subscribe       from './pages/Subscribe';
import Dashboard       from './pages/Dashboard';
import CharityDirectory from './pages/CharityDirectory';
import CharityDetail   from './pages/CharityDetail';
import DrawResults     from './pages/DrawResults';

// Admin pages
import AdminLayout    from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers     from './pages/admin/AdminUsers';
import AdminDraws     from './pages/admin/AdminDraws';
import AdminCharities from './pages/admin/AdminCharities';
import AdminWinners   from './pages/admin/AdminWinners';

import Navbar from './components/Navbar';

// ── Guard: redirect to login if not authenticated ─────────────
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
};

// ── Guard: redirect to home if not admin ──────────────────────
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading…</div>;
  if (!user)              return <Navigate to="/login"   replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

// ── App inner (needs AuthContext already mounted) ─────────────
const AppInner = () => (
  <>
    <Navbar />
    <Routes>
      {/* Public */}
      <Route path="/"           element={<Landing />} />
      <Route path="/login"      element={<Login />} />
      <Route path="/register"   element={<Register />} />
      <Route path="/charities"  element={<CharityDirectory />} />
      <Route path="/charities/:id" element={<CharityDetail />} />
      <Route path="/draws"      element={<DrawResults />} />

      {/* Subscriber */}
      <Route path="/subscribe"  element={<ProtectedRoute><Subscribe /></ProtectedRoute>} />
      <Route path="/dashboard"  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index           element={<AdminDashboard />} />
        <Route path="users"    element={<AdminUsers />} />
        <Route path="draws"    element={<AdminDraws />} />
        <Route path="charities" element={<AdminCharities />} />
        <Route path="winners"  element={<AdminWinners />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </>
);

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
