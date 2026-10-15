import { useState } from 'react';
import { useAppSelector } from '@/stores/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Mail,
  Phone,
  Shield,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { ContributorApplyModal } from '@/features/contributor/components/ContributorApplyModal';
import { Link } from 'react-router-dom';

function getInitials(name?: string) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserProfileView() {
  const { user } = useAppSelector((state) => state.auth);
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  const isContributor = user?.isContributor === true || user?.role === 'admin';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          User Profile &amp; Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your account information, memberships, and contributor privileges.
        </p>
      </div>

      {/* ── Profile Summary Card ───────────────────────────────────── */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <Avatar className="size-20 border-2 border-border shadow-xs">
              <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name || 'User'} />
              <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{user?.name || 'Learner'}</h2>
                <Badge
                  variant={user?.role === 'admin' ? 'destructive' : user?.role === 'userPro' ? 'default' : 'secondary'}
                  className="uppercase text-[11px] font-bold"
                >
                  {user?.role || 'user'}
                </Badge>
                {isContributor && (
                  <Badge variant="outline" className="text-[11px] font-semibold gap-1 border-primary/30 text-primary">
                    <Sparkles className="size-3" /> Contributor
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{user?.email || 'No email associated'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Account Details & Permissions ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="size-4 text-primary" /> Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 border-t border-border pt-4 text-sm">
            <div className="flex items-center gap-3">
              <Mail className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[11px] text-muted-foreground">Email</p>
                <p className="text-xs font-medium text-foreground">{user?.email || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[11px] text-muted-foreground">Phone Number</p>
                <p className="text-xs font-medium text-foreground">{user?.phone || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[11px] text-muted-foreground">Account Role</p>
                <p className="text-xs font-medium text-foreground capitalize">{user?.role || 'User'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Contributor Capability Box ──────────────────────────── */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="size-4 text-primary" /> Contributor Capability
            </CardTitle>
            <CardDescription className="text-xs">
              Author and publish interactive lab series for the community
            </CardDescription>
          </CardHeader>
          <CardContent className="border-t border-border pt-4 flex-1 flex flex-col justify-between space-y-4">
            {isContributor ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>You have active Contributor privileges.</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  You can author new lab series, design browser-based practice environments, and submit content for review.
                </p>
                <Button size="sm" asChild className="w-full text-xs font-semibold gap-1.5">
                  <Link to="/user/dashboard/content">
                    Manage My Content <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </div>
            ) : user?.contributorStatus === 'PENDING' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                  <Clock className="size-4 shrink-0" />
                  <span>Application Under Review</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your application to become a Contributor has been submitted and is currently being audited by administrators.
                </p>
                <Button size="sm" variant="outline" onClick={() => setApplyModalOpen(true)} className="w-full text-xs">
                  View Submitted Application
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Share your expertise! Write interactive coding series, craft hands-on labs, and empower thousands of learners.
                </p>
                <Button
                  size="sm"
                  onClick={() => setApplyModalOpen(true)}
                  className="w-full text-xs font-semibold gap-1.5"
                >
                  <Sparkles className="size-3.5" />
                  Register as Contributor
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contributor Application Modal */}
      <ContributorApplyModal
        open={applyModalOpen}
        onOpenChange={setApplyModalOpen}
      />
    </div>
  );
}
