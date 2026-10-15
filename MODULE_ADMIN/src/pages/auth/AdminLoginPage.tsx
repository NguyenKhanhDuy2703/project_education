import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Lock, User as UserIcon, AlertCircle, Loader2 } from 'lucide-react';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, logout, isLoggingIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      const result = await login({ phoneOrEmail: email.trim(), password });
      if (result?.user?.role !== 'admin') {
        await logout();
        setErrorMessage('Access denied. Administrator privileges are required to enter this system.');
        return;
      }
      navigate('/', { replace: true });
    } catch {
      setErrorMessage('Invalid credentials or network error.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 select-none">
      <Card className="w-full max-w-md border-border/80 shadow-lg">
        <CardHeader className="space-y-2 text-center pb-4">
          <div className="size-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto shadow-xs">
            <Shield className="size-6" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            StudyIT Admin Studio
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Restricted control plane for system administration and content review.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email" className="text-xs font-semibold">
                Admin Email
              </Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="admin@studyit.dev"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-password" className="text-xs font-semibold">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoggingIn}
              className="w-full text-xs font-semibold gap-1.5 bg-primary text-primary-foreground shadow-xs"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="size-3.5" />
                  Sign In to Admin Studio
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
