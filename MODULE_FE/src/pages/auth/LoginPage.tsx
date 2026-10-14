import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoginForm } from '@/features/auth/components/LoginForm';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  return <LoginForm onSuccess={() => navigate(redirectUrl, { replace: true })} />;
}
