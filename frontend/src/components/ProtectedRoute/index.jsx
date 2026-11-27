import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';

export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === role) return <Outlet/>;

  const portal = { gestao: '/login-admin', monitor: '/login-monitor', aluno: '/login' }[role];
  return <Navigate to={portal || '/'} replace/>;
}
