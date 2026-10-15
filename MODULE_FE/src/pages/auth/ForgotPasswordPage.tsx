import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    // Simulate brief request and user feedback
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 600);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Reset Password
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Enter your registered email address to receive password reset instructions.
        </p>
      </div>

      {isSubmitted ? (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>Request received!</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              If an account with <strong className="text-foreground">{email}</strong> exists, you will receive password reset instructions shortly.
            </p>
            <p className="text-[11px] text-muted-foreground pt-1 border-t border-emerald-500/20">
              Need urgent help? Contact our support at{' '}
              <a href="mailto:support@studyit.dev" className="text-primary font-medium hover:underline">
                support@studyit.dev
              </a>
            </p>
          </div>

          <Button asChild className="w-full h-10 font-semibold gap-2">
            <Link to="/login">
              <ArrowLeft className="size-4" />
              Back to Sign In
            </Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 h-10"
                disabled={isSubmitting}
                required
                autoFocus
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-10 font-semibold gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending instructions...
              </>
            ) : (
              <>
                <Send className="size-4" />
                Send Reset Instructions
              </>
            )}
          </Button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              <ArrowLeft className="size-3.5" />
              Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
