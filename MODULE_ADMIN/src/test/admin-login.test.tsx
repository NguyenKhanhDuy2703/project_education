import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { AdminLoginPage } from '@/pages/auth/AdminLoginPage';

const mockNavigate = vi.fn();
const mockLogin = vi.fn();
const mockLogout = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    logout: mockLogout,
    isLoggingIn: false,
    user: null,
    isAuthenticated: false,
  }),
}));

describe('AdminLoginPage Component Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders login form with title, badge, example placeholders, and action button', () => {
    render(<AdminLoginPage />);

    expect(screen.getByText('StudyIT Admin Studio')).toBeTruthy();
    expect(screen.getByText('Zero-Trust Control Plane')).toBeTruthy();
    expect(screen.getByLabelText(/Admin Email or Phone/i)).toBeTruthy();
    expect(screen.getByPlaceholderText('e.g. admin@studyit.dev')).toBeTruthy();
    expect(screen.getByLabelText(/^Password$/i)).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter your password')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Sign In to Admin Studio/i })).toBeTruthy();
    // Default credentials fill button should NOT exist
    expect(screen.queryByText(/Fill Default Admin Credentials/i)).toBeNull();
  });

  it('toggles password visibility when clicking eye button', () => {
    render(<AdminLoginPage />);

    const passwordInput = screen.getByLabelText(/^Password$/i) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleButton = screen.getByLabelText(/Show password/i);
    fireEvent.click(toggleButton);

    expect(passwordInput.type).toBe('text');
    expect(screen.getByLabelText(/Hide password/i)).toBeTruthy();

    fireEvent.click(screen.getByLabelText(/Hide password/i));
    expect(passwordInput.type).toBe('password');
  });

  it('opens Forgot Password recovery dialog with standard recovery and reset command', () => {
    render(<AdminLoginPage />);

    const forgotBtn = screen.getByRole('button', { name: /Forgot password\?/i });
    fireEvent.click(forgotBtn);

    expect(screen.getByText('Administrator Account Recovery')).toBeTruthy();
    expect(screen.getByText('Standard Recovery Procedure')).toBeTruthy();
    expect(screen.getByText('cd MODULE_BE && npx prisma db seed')).toBeTruthy();
    // No hardcoded credentials in modal
    expect(screen.queryByText('nguyenkhanhduy270304@gmail.com')).toBeNull();
  });

  it('denies login and shows error if user does not have admin role', async () => {
    mockLogin.mockResolvedValueOnce({
      user: { id: 'u1', role: 'student', email: 'student@example.com' },
    });

    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText(/Admin Email or Phone/i), {
      target: { value: 'student@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In to Admin Studio/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        phoneOrEmail: 'student@example.com',
        password: 'password123',
      });
      expect(mockLogout).toHaveBeenCalled();
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('Access denied');
    });
  });

  it('navigates to dashboard on successful admin login', async () => {
    mockLogin.mockResolvedValueOnce({
      user: { id: 'u-admin', role: 'admin', email: 'admin@studyit.dev' },
      accessToken: 'token-abc',
    });

    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText(/Admin Email or Phone/i), {
      target: { value: 'admin@studyit.dev' },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: 'SecureAdminPass!1' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In to Admin Studio/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        phoneOrEmail: 'admin@studyit.dev',
        password: 'SecureAdminPass!1',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });
});
