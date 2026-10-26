import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminLoginPage } from '@/pages/auth/AdminLoginPage';

import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminReviewPage } from '@/pages/admin/AdminReviewPage';
import { AdminContentPage } from '@/pages/admin/AdminContentPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminContributorApplicationsPage } from '@/pages/admin/AdminContributorApplicationsPage';
import { AdminPlansPage } from '@/pages/admin/AdminPlansPage';
import { AdminGroupsPage } from '@/pages/admin/AdminGroupsPage';
import { AdminAuditPage } from '@/pages/admin/AdminAuditPage';
import { AdminLabStudioPage } from '@/pages/admin/AdminLabStudioPage';
import { AdminFeedbackPage } from '@/pages/admin/AdminFeedbackPage';
import { AdminAnnouncementsPage } from '@/pages/admin/AdminAnnouncementsPage';

export const router = createBrowserRouter([
  // Public Admin Login
  {
    path: '/login',
    element: <AdminLoginPage />,
  },

  // Protected Admin Routes
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: <Navigate to="/admin" replace />,
      },
      {
        path: 'admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'review', element: <AdminReviewPage /> },
          { path: 'content', element: <AdminContentPage /> },
          { path: 'labs/new', element: <AdminLabStudioPage /> },
          { path: 'labs/:labId/edit', element: <AdminLabStudioPage /> },
          { path: 'users', element: <AdminUsersPage /> },
          { path: 'contributors', element: <AdminContributorApplicationsPage /> },
          { path: 'plans', element: <AdminPlansPage /> },
          { path: 'groups', element: <AdminGroupsPage /> },
          { path: 'feedback', element: <AdminFeedbackPage /> },
          { path: 'announcements', element: <AdminAnnouncementsPage /> },
          { path: 'audit', element: <AdminAuditPage /> },
        ],
      },
    ],
  },

  // Fallback
  {
    path: '*',
    element: <Navigate to="/admin" replace />,
  },
]);
