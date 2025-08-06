import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { isTokenExpired } from '../utils/tokenUtils';

/* ***Layouts**** */
const FullLayout = lazy(() => import('../layouts/full/FullLayout'));
const BlankLayout = lazy(() => import('../layouts/blank/BlankLayout'));

/* ****Pages***** */
const Dashboard = lazy(() => import('../views/dashboard/Dashboard'));
const Error = lazy(() => import('../views/authentication/Error'));
const Register = lazy(() => import('../views/authentication/Register'));
const Login = lazy(() => import('../views/authentication/Login'));

// Enhanced authentication check function
const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const rememberToken = localStorage.getItem('rememberToken');
  
  // Check main token first
  if (token && !isTokenExpired(token)) {
    return true;
  }
  
  // Check remember token if main token is invalid
  if (rememberToken && !isTokenExpired(rememberToken)) {
    // Restore the main token from remember token
    localStorage.setItem('token', rememberToken);
    return true;
  }
  
  // No valid tokens found
  return false;
};

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const Router = [
  {
    path: '/',
    element: (
      <PublicRoute>
        <BlankLayout />
      </PublicRoute>
    ),
    children: [
      { index: true, element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/auth/404', element: <Error /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <FullLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/dashboard', element: <Dashboard /> },
    ],
  },
];

const router = createBrowserRouter(Router);

export default router;