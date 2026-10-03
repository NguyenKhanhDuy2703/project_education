import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '../hooks/useAuth';
import { UserPlus, Loader2, Eye, EyeOff, Lock, User, Phone, Mail, AlertCircle } from 'lucide-react';

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register, isRegistering } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStrength = (pwd: string) => {
    let s = 0;
    if (pwd.length >= 6) s++;
    if (pwd.length >= 8) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (s <= 2) return { score: 1, label: 'Yếu', color: 'bg-destructive' };
    if (s <= 3) return { score: 2, label: 'Trung bình', color: 'bg-amber-500' };
    return { score: 3, label: 'Mạnh', color: 'bg-emerald-500' };
  };

  const strength = getStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(phone.trim())) return setError('Số điện thoại không hợp lệ');
    if (password.length < 6) return setError('Mật khẩu tối thiểu 6 ký tự');
    if (password !== confirmPassword) return setError('Mật khẩu xác nhận không khớp');
    if (!termsAccepted) return setError('Vui lòng đồng ý điều khoản');
    try {
      await register({ name: name.trim(), phone: phone.trim(), email: email.trim() || undefined, password });
      onSuccess?.();
    } catch {
      setError('Số điện thoại hoặc email đã tồn tại.');
    }
  };

  const handleGoogle = () => {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    window.location.href = `${base}/auth/google`;
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Tạo tài khoản</h1>
        <p className="text-sm text-muted-foreground mt-1">Học IT thực chiến tại StudyIT</p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-semibold">Họ và tên <span className="text-destructive">*</span></Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input id="name" type="text" placeholder="Nguyễn Văn A" autoComplete="name"
              value={name} onChange={(e) => setName(e.target.value)} className="pl-9 h-10" disabled={isRegistering} required />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-xs font-semibold">Số điện thoại <span className="text-destructive">*</span></Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input id="phone" type="tel" placeholder="0912345678" autoComplete="tel"
              value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-9 h-10" disabled={isRegistering} required />
          </div>
        </div>

        {/* Email optional */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="email" className="text-xs font-semibold">Email</Label>
            <span className="text-[11px] text-muted-foreground">Không bắt buộc</span>
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input id="email" type="email" placeholder="email@gmail.com" autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 h-10" disabled={isRegistering} />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold">Mật khẩu <span className="text-destructive">*</span></Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Tối thiểu 6 ký tự"
              autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="pl-9 pr-10 h-10" disabled={isRegistering} required />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Hiện/ẩn">
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {password && (
            <div className="flex items-center gap-2 pt-0.5">
              <div className="flex flex-1 gap-1 h-1.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`flex-1 rounded-full ${strength.score >= i ? strength.color : 'bg-muted'}`} />
                ))}
              </div>
              <span className="text-[11px] text-muted-foreground">{strength.label}</span>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-xs font-semibold">Xác nhận mật khẩu <span className="text-destructive">*</span></Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="Nhập lại mật khẩu"
              autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-9 h-10" disabled={isRegistering} required />
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2 pt-0.5">
          <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(v) => setTermsAccepted(Boolean(v))} className="mt-0.5" />
          <Label htmlFor="terms" className="text-xs text-muted-foreground font-normal cursor-pointer leading-snug">
            Tôi đồng ý <Link to="/terms" className="text-primary hover:underline">Điều khoản</Link> &{' '}
            <Link to="/privacy" className="text-primary hover:underline">Bảo mật</Link>
          </Label>
        </div>

        <Button type="submit" disabled={isRegistering} className="w-full h-10 font-semibold gap-2">
          {isRegistering
            ? <><Loader2 className="size-4 animate-spin" />Đang tạo tài khoản...</>
            : <><UserPlus className="size-4" />Đăng ký</>}
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
      <Button type="button" variant="outline" onClick={handleGoogle} disabled={isRegistering} className="w-full h-10 gap-3">
        <GoogleIcon />
        Đăng ký với Google
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">Đăng nhập</Link>
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
