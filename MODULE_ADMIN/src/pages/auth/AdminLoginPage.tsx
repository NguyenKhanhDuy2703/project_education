import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  ShieldCheck,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  KeyRound,
  Terminal,
  Copy,
  Check,
  LifeBuoy,
} from 'lucide-react';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, logout, isLoggingIn } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = identifier.trim();
    if (!trimmed || !password) {
      setErrorMessage('Please provide both your administrator email/phone and password.');
      return;
    }

    try {
      const result = await login({ phoneOrEmail: trimmed, password });
      if (result?.user?.role !== 'admin') {
        await logout();
        setErrorMessage('Access denied. Administrator privileges are required to enter the StudyIT Control Plane.');
        return;
      }
      navigate('/', { replace: true });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Invalid administrator credentials or unable to reach authentication service.';
      setErrorMessage(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial-[ellipse_80%_80%_at_50%_-20%] from-blue-900/15 via-background to-background px-4 py-8 select-none relative overflow-hidden">
      {/* Background ambient grid pattern */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="w-full max-w-md relative z-10 space-y-4">
        <Card className="border-border/80 bg-card/95 backdrop-blur-md shadow-2xl transition-all duration-200">
          <CardHeader className="space-y-3 text-center pb-4 pt-6">
            <div className="relative mx-auto">
              <div className="size-13 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto shadow-sm ring-4 ring-primary/5">
                <ShieldCheck className="size-7" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex size-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-3.5 bg-emerald-500 border-2 border-background" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5">
                <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                  StudyIT Admin Studio
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Enterprise control plane for content review, IAM governance, and system administration.
              </CardDescription>
            </div>

            <div className="pt-1 flex items-center justify-center">
              <Badge
                variant="outline"
                className="text-[10px] font-mono uppercase tracking-wider py-0.5 px-2 bg-muted/50 border-border text-muted-foreground"
              >
                Zero-Trust Control Plane
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-1">
            {errorMessage && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2 animate-in fade-in duration-200"
              >
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-identifier" className="text-xs font-semibold text-foreground">
                  Admin Email or Phone
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="admin-identifier"
                    type="text"
                    autoComplete="username"
                    required
                    autoFocus
                    placeholder="e.g. admin@studyit.dev"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="pl-9 text-xs font-medium focus-visible:ring-primary h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="admin-password" className="text-xs font-semibold text-foreground">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    className="text-[11px] text-primary hover:text-primary/80 font-medium hover:underline focus:outline-none focus:ring-1 focus:ring-primary rounded cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="pl-9 pr-9 text-xs font-mono focus-visible:ring-primary h-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoggingIn}
                className="w-full text-xs font-semibold gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 shadow-sm cursor-pointer transition-all"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Authenticating Administrator...
                  </>
                ) : (
                  <>
                    <KeyRound className="size-3.5" />
                    Sign In to Admin Studio
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="pt-0 pb-4 text-center justify-center">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Lock className="size-2.5" />
              <span>256-bit TLS Encrypted Session • Protected by Role-Based Access Control</span>
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* ── Forgot Password & Recovery Dialog ─────────────────────────────── */}
      <Dialog open={isForgotModalOpen} onOpenChange={setIsForgotModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-1">
              <KeyRound className="size-5" />
            </div>
            <DialogTitle className="text-base font-bold">Administrator Account Recovery</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Administrator accounts are protected by enterprise zero-trust governance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-1 text-xs">
            {/* Standard IAM Recovery Procedure */}
            <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <LifeBuoy className="size-4 text-blue-500 shrink-0" />
                <span>Standard Recovery Procedure</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Contact your organization&apos;s Lead System Administrator or DevOps security team to request a credential reset or temporary access delegation through the IAM security console.
              </p>
            </div>

            {/* CLI Reset Instruction for Developers & DevOps */}
            <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-card p-3 space-y-1.5">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Terminal className="size-3.5 text-blue-500" />
                Development & Local Database Reset
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                For local development or testing environments, you can reset all admin credentials and seed data using the backend CLI command:
              </p>
              <div className="p-2 rounded bg-zinc-900 text-zinc-200 font-mono text-[11px] flex items-center justify-between">
                <code>cd MODULE_BE && npx prisma db seed</code>
                <button
                  type="button"
                  onClick={() => handleCopy('cd MODULE_BE && npx prisma db seed', 'cmd')}
                  className="p-1 hover:text-primary transition-colors cursor-pointer"
                  title="Copy command"
                >
                  {copiedField === 'cmd' ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3 text-zinc-400" />}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="text-xs cursor-pointer">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
