import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { LabLayout } from '@/layouts/LabLayout';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { GoogleCallbackPage } from '@/pages/auth/GoogleCallbackPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { SeriesHubPage } from '@/pages/lab/SeriesHubPage';
import { SeriesDetailPage } from '@/pages/lab/SeriesDetailPage';
import { LabWorkspacePage } from '@/pages/lab/LabWorkspacePage';
import { AdminContentPage } from '@/pages/admin/AdminContentPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProtectedRoute } from './ProtectedRoute';

export const router = createBrowserRouter([
  // ── Public + MainLayout routes ─────────────────────────────────────────────
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },

      // Public series catalog
      { path: 'series', element: <SeriesHubPage /> },
      { path: 'series/:slug', element: <SeriesDetailPage /> },

      // Protected routes (must be logged in)
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'user/dashboard', element: <DashboardPage /> },
          { path: 'user', element: <Navigate to="/user/dashboard" replace /> },
          { path: 'dashboard', element: <Navigate to="/user/dashboard" replace /> },
        ],
      },

      // Admin routes (must have role: 'admin')
      {
        element: <ProtectedRoute allowedRoles={['admin']} />,
        children: [
          { path: 'admin', element: <AdminContentPage /> },
          { path: 'admin/content', element: <AdminContentPage /> },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },

  // ── Lab Workspace (full-screen, no footer, no large navbar) ───────────────
  {
    path: '/',
    element: <LabLayout />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'labs/:labId', element: <LabWorkspacePage /> },
        ],
      },
    ],
  },

  // ── Auth routes ───────────────────────────────────────────────────────────
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },

  // ── Google OAuth callback (standalone — no layout) ─────────────────────
  {
    path: '/auth/callback',
    element: <GoogleCallbackPage />,
  },
]);
