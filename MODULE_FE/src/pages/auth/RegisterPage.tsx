import { useNavigate } from 'react-router-dom';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export function RegisterPage() {
  const navigate = useNavigate();

  return <RegisterForm onSuccess={() => navigate('/dashboard')} />;
}
