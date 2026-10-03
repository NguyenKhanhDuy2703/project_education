import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '../hooks/useAuth';
import { LogIn, Loader2, Eye, EyeOff, Lock, User as UserIcon, AlertCircle } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, isLoggingIn } = useAuth();
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

  const MOCK_ACCOUNTS = [
    { label: 'User (free)', email: 'user@test.com', role: 'user' },
    { label: 'User Pro', email: 'pro@test.com', role: 'userPro' },
    { label: 'Admin', email: 'admin@test.com', role: 'admin' },
  ];

  const fillMockAccount = (email: string) => {
    setPhoneOrEmail(email);
    setPassword('Test@123');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await login({ phoneOrEmail: phoneOrEmail.trim(), password });
      onSuccess?.();
    } catch {
      setErrorMessage('Thông tin đăng nhập không chính xác.');
    }
  };

  const handleGoogle = () => {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    window.location.href = `${base}/auth/google`;
  };

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Đăng nhập</h1>
        <p className="text-sm text-muted-foreground mt-1">Tiếp tục học trên StudyIT</p>
      </div>

      {/* Mock account hint — only shown in dev mock mode */}
      {IS_MOCK && (
        <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 space-y-2">
          <p className="text-[11px] font-semibold text-primary uppercase tracking-wide">
            🧪 Mock mode — Click để điền nhanh
          </p>
          <div className="flex flex-wrap gap-2">
            {MOCK_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => fillMockAccount(acc.email)}
                className="text-[11px] px-2 py-1 rounded bg-card border border-border hover:border-primary/60 hover:bg-accent transition-colors text-foreground"
              >
                {acc.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">Mật khẩu chung: <code className="font-mono bg-muted px-1 rounded">Test@123</code></p>
        </div>
      )}

      {/* Error */}
      {errorMessage && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Identifier */}
        <div className="space-y-1.5">
          <Label htmlFor="phoneOrEmail" className="text-xs font-semibold">SĐT hoặc Email <span className="text-destructive">*</span></Label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="phoneOrEmail"
              type="text"
              placeholder="0912345678 hoặc email@..."
              autoComplete="username"
              value={phoneOrEmail}
              onChange={(e) => setPhoneOrEmail(e.target.value)}
              className="pl-9 h-10"
              disabled={isLoggingIn}
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-semibold">Mật khẩu <span className="text-destructive">*</span></Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">Quên mật khẩu?</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9 pr-10 h-10"
              disabled={isLoggingIn}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Hiện/ẩn mật khẩu"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-2">
          <Checkbox id="remember" checked={rememberMe} onCheckedChange={(v) => setRememberMe(Boolean(v))} />
          <Label htmlFor="remember" className="text-xs text-muted-foreground font-normal cursor-pointer">Ghi nhớ đăng nhập</Label>
        </div>

        <Button type="submit" disabled={isLoggingIn} className="w-full h-10 font-semibold gap-2">
          {isLoggingIn ? <><Loader2 className="size-4 animate-spin" />Đang xác thực...</> : <><LogIn className="size-4" />Đăng nhập</>}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Hoặc</span>
        </div>
      </div>

      {/* Google */}
      <Button type="button" variant="outline" onClick={handleGoogle} disabled={isLoggingIn} className="w-full h-10 gap-3">
        <GoogleIcon />
        Đăng nhập với Google
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="font-semibold text-primary hover:underline">Đăng ký miễn phí</Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}
