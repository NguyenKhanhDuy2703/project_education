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

  // Field-level touched / error states
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const validatePhone = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) return 'Phone number is required.';
    if (!/^(\+84|0)[0-9]*$/.test(trimmed)) {
      return 'Phone number must contain digits only.';
    }
    if (trimmed.startsWith('0') && trimmed.length !== 10) {
      return `Phone number must be exactly 10 digits (current: ${trimmed.length}).`;
    }
    if (trimmed.startsWith('+84') && trimmed.length !== 12) {
      return `Phone number with +84 must be 12 characters (current: ${trimmed.length}).`;
    }
    const vnRegex = /^(?:\+84|0)(?:3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/;
    if (!vnRegex.test(trimmed)) {
      return 'Invalid carrier prefix (valid: 03, 05, 07, 08, 09).';
    }
    return null;
  };

  const validateEmail = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) return 'Email address is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return 'Please enter a valid email address (e.g. user@example.com).';
    }
    return null;
  };

  const getStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-muted' };
    let s = 0;
    if (pwd.length >= 8) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) s++;
    if (pwd.length < 8 || s <= 1) return { score: 1, label: 'Weak (min 8 chars)', color: 'bg-destructive' };
    if (s === 2) return { score: 2, label: 'Medium', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getStrength(password);

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (phoneError) setPhoneError(null);
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (emailError) setEmailError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate Name
    if (!name.trim() || name.trim().length < 2) {
      setError('Full name must be at least 2 characters long.');
      return;
    }

    // Validate Phone
    const pErr = validatePhone(phone);
    if (pErr) {
      setPhoneError(pErr);
      setError(pErr);
      return;
    }

    // Validate Email
    const eErr = validateEmail(email);
    if (eErr) {
      setEmailError(eErr);
      setError(eErr);
      return;
    }

    // Validate Password
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!termsAccepted) {
      setError('You must accept the Terms of Service & Privacy Policy.');
      return;
    }

    try {
      await register({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
      });
      onSuccess?.();
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message;
      if (Array.isArray(serverMsg)) {
        setError(serverMsg.join(', '));
      } else if (typeof serverMsg === 'string') {
        if (serverMsg === 'Email already in use') {
          setError('This email address is already registered.');
          setEmailError('Email already in use');
        } else if (serverMsg === 'Phone number already in use') {
          setError('This phone number is already registered.');
          setPhoneError('Phone number already in use');
        } else {
          setError(serverMsg);
        }
      } else {
        setError('Registration failed. Please check your information and try again.');
      }
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Account</h1>
        <p className="text-sm text-muted-foreground mt-1">Start your hands-on IT journey with StudyIT</p>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-semibold">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-9 h-10 text-sm"
              disabled={isRegistering}
              required
            />
          </div>
        </div>

        {/* Phone Number */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="phone" className="text-xs font-semibold">
              Phone Number <span className="text-destructive">*</span>
            </Label>
            <span className="text-[11px] text-muted-foreground">10 digits (03, 05, 07, 08, 09)</span>
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              placeholder="0912345678"
              autoComplete="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onBlur={() => setPhoneError(validatePhone(phone))}
              className={`pl-9 h-10 text-sm ${phoneError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              disabled={isRegistering}
              required
            />
          </div>
          {phoneError && (
            <p className="text-[11px] text-destructive font-medium">{phoneError}</p>
          )}
        </div>

        {/* Email Address */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold">
            Email Address <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onBlur={() => setEmailError(validateEmail(email))}
              className={`pl-9 h-10 text-sm ${emailError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              disabled={isRegistering}
              required
            />
          </div>
          {emailError && (
            <p className="text-[11px] text-destructive font-medium">{emailError}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-semibold">
              Password <span className="text-destructive">*</span>
            </Label>
            <span className="text-[11px] text-muted-foreground">Min 8 characters</span>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9 pr-10 h-10 text-sm"
              disabled={isRegistering}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {password && (
            <div className="flex items-center gap-2 pt-0.5">
              <div className="flex flex-1 gap-1 h-1.5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-full ${
                      strength.score >= i ? strength.color : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] text-muted-foreground">{strength.label}</span>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-xs font-semibold">
            Confirm Password <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-9 h-10 text-sm"
              disabled={isRegistering}
              required
            />
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2 pt-0.5">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(v) => setTermsAccepted(Boolean(v))}
            className="mt-0.5"
          />
          <Label htmlFor="terms" className="text-xs text-muted-foreground font-normal cursor-pointer leading-snug">
            I agree to the{' '}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            &{' '}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </Label>
        </div>

        {/* Submit */}
        <Button type="submit" disabled={isRegistering} className="w-full h-10 font-semibold gap-2 mt-1">
          {isRegistering ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              <UserPlus className="size-4" />
              Create Account
            </>
          )}
        </Button>
      </form>

      {/* Footer Link (Clean and simple, no Google OAuth button) */}
      <p className="text-center text-sm text-muted-foreground pt-2">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}
