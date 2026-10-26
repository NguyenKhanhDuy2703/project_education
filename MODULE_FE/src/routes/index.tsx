import { createBrowserRouter, Navigate, useParams } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { LabLayout } from '@/layouts/LabLayout';
import { UserDashboardLayout } from '@/layouts/UserDashboardLayout';

import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { GoogleCallbackPage } from '@/pages/auth/GoogleCallbackPage';
import { TermsPage } from '@/pages/legal/TermsPage';
import { PrivacyPage } from '@/pages/legal/PrivacyPage';
import { PricingPage } from '@/pages/PricingPage';

import { DashboardOverviewView } from '@/pages/dashboard/views/DashboardOverviewView';
import { UserProfileView } from '@/pages/dashboard/views/UserProfileView';
import { UserContentManagementView } from '@/pages/dashboard/views/UserContentManagementView';
import { UserReviewFeedbackView } from '@/pages/dashboard/views/UserReviewFeedbackView';
import { UserSavedSeriesView } from '@/pages/dashboard/views/UserSavedSeriesView';
import { UserLabSubmissionsView } from '@/pages/dashboard/views/UserLabSubmissionsView';
import { UserMembershipView } from '@/pages/dashboard/views/UserMembershipView';
import { UserNotificationsView } from '@/pages/dashboard/views/UserNotificationsView';

import { SeriesHubPage } from '@/pages/lab/SeriesHubPage';
import { SeriesDetailPage } from '@/pages/lab/SeriesDetailPage';
import { RoadmapsPage } from '@/pages/lab/RoadmapsPage';
import { LabWorkspacePage } from '@/pages/lab/LabWorkspacePage';
import { LabStudioPage } from '@/pages/lab/LabStudioPage';

import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProtectedRoute } from './ProtectedRoute';

// Helper to dynamically redirect legacy /contributor/labs/:labId/edit with actual param
function LegacyLabEditRedirect() {
  const { labId } = useParams<{ labId: string }>();
  return <Navigate to={`/user/dashboard/labs/${labId}/edit`} replace />;
}

export const router = createBrowserRouter([
  // ── Public catalog & Landing routes ───────────────────────────────────────
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'series', element: <SeriesHubPage /> },
      { path: 'series/:slug', element: <SeriesDetailPage /> },
      { path: 'roadmaps', element: <RoadmapsPage /> },
      { path: 'pricing', element: <PricingPage /> },
      { path: 'membership', element: <Navigate to="/user/dashboard/membership" replace /> },
      { path: 'notifications', element: <Navigate to="/user/dashboard/notifications" replace /> },
      { path: 'terms', element: <TermsPage /> },
      { path: 'privacy', element: <PrivacyPage /> },
      { path: 'user', element: <Navigate to="/user/dashboard" replace /> },
      { path: 'dashboard', element: <Navigate to="/user/dashboard" replace /> },
      { path: 'settings', element: <Navigate to="/user/dashboard/profile" replace /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },

  // ── Unified User Dashboard & Contributor Hub routes ───────────────────────
  {
    path: '/user/dashboard',
    element: <ProtectedRoute />,
    children: [
      {
        element: <UserDashboardLayout />,
        children: [
          { index: true, element: <DashboardOverviewView /> },
          { path: 'profile', element: <UserProfileView /> },
          { path: 'saved', element: <UserSavedSeriesView /> },
          { path: 'submissions', element: <UserLabSubmissionsView /> },
          { path: 'membership', element: <UserMembershipView /> },
          { path: 'notifications', element: <UserNotificationsView /> },

          // Contributor capability views (Protected by Contributor permission)
          {
            element: <ProtectedRoute requireContributor />,
            children: [
              { path: 'content', element: <UserContentManagementView /> },
              { path: 'feedback', element: <UserReviewFeedbackView /> },
              { path: 'series', element: <Navigate to="/user/dashboard/content?tab=series" replace /> },
              { path: 'labs', element: <Navigate to="/user/dashboard/content?tab=labs" replace /> },
              { path: 'labs/new', element: <LabStudioPage /> },
              { path: 'labs/:labId/edit', element: <LabStudioPage /> },
            ],
          },
        ],
      },
    ],
  },

  // ── Backward Compatibility Redirects from legacy /contributor routes ─────
  {
    path: '/contributor',
    element: <ProtectedRoute requireContributor />,
    children: [
      { index: true, element: <Navigate to="/user/dashboard/content" replace /> },
      { path: 'series', element: <Navigate to="/user/dashboard/content?tab=series" replace /> },
      { path: 'labs', element: <Navigate to="/user/dashboard/content?tab=labs" replace /> },
      { path: 'labs/new', element: <Navigate to="/user/dashboard/labs/new" replace /> },
      { path: 'labs/:labId/edit', element: <LegacyLabEditRedirect /> },
      { path: 'feedback', element: <Navigate to="/user/dashboard/feedback" replace /> },
      { path: 'published', element: <Navigate to="/user/dashboard/content?tab=published" replace /> },
      { path: '*', element: <Navigate to="/user/dashboard/content" replace /> },
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
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
    ],
  },

  // ── Google OAuth callback (standalone — no layout) ─────────────────────
  {
    path: '/auth/callback',
    element: <GoogleCallbackPage />,
  },
]);
