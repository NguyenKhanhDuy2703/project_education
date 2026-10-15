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
  BadgeCheck,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Layers,
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

  const isContributor = user?.isContributor === true || user?.role === 'admin' || user?.role === 'contributor';

  return (
    <div className="space-y-6">
      {/* ── Executive Profile Summary Hero Card ──────────────────────── */}
      <Card className="border-border bg-card shadow-xs overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Avatar & Identity */}
            <div className="flex items-center gap-5">
              <Avatar className="size-16 sm:size-20 border-2 border-border shadow-xs ring-2 ring-primary/10">
                <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name || 'User'} />
                <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                    {user?.name || 'Learner'}
                  </h1>
                  <Badge
                    variant={user?.role === 'admin' ? 'destructive' : user?.role === 'userPro' ? 'default' : 'secondary'}
                    className="uppercase text-[11px] font-bold px-2"
                  >
                    {user?.role || 'user'}
                  </Badge>
                  {isContributor && (
                    <Badge variant="outline" className="text-[11px] font-semibold gap-1 border-primary/30 text-primary bg-primary/5">
                      <BadgeCheck className="size-3.5" />
                      <span>Contributor</span>
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{user?.email || 'No email associated'}</p>
              </div>
            </div>

            {/* Quick Account Badges */}
            <div className="flex items-center gap-2 flex-wrap self-start md:self-auto border-t md:border-t-0 pt-3 md:pt-0 border-border/50">
              <div className="px-3.5 py-2 rounded-xl bg-muted/40 border border-border text-center">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Status</p>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Active</span>
                </div>
              </div>

              <div className="px-3.5 py-2 rounded-xl bg-muted/40 border border-border text-center">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Access</p>
                <p className="text-xs font-semibold text-foreground mt-0.5">
                  {user?.role === 'admin' ? 'Full System' : user?.role === 'userPro' ? 'PRO Member' : 'Standard'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 2-Column Grid: Contact Information vs Contributor Privileges ─ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Contact & Security Info */}
        <Card className="border-border bg-card shadow-xs flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <User className="size-4 text-primary" />
                <span>Contact &amp; Account Details</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Verified identification and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm">
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <Mail className="size-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium">Email Address</p>
                    <p className="text-xs font-semibold text-foreground">{user?.email || '—'}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                  Verified
                </Badge>
              </div>

              <div className="flex items-center gap-3 py-1 border-t border-border/40">
                <Phone className="size-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium">Phone Number</p>
                  <p className="text-xs font-semibold text-foreground">{user?.phone || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 py-1 border-t border-border/40">
                <ShieldCheck className="size-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium">System Role &amp; Permission</p>
                  <p className="text-xs font-semibold text-foreground capitalize">{user?.role || 'Standard User'}</p>
                </div>
              </div>
            </CardContent>
          </div>

          <div className="p-4 border-t border-border/50 bg-muted/10 text-xs text-muted-foreground flex items-center justify-between">
            <span>Authentication: Session Active</span>
            <span className="font-mono text-[10px]">JWT Guarded</span>
          </div>
        </Card>

        {/* Card 2: Contributor Capability & Authoring */}
        <Card className="border-border bg-card shadow-xs flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Award className="size-4 text-primary" />
                <span>Contributor Privileges</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Author and manage curriculum series and practice labs
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {isContributor ? (
                <div className="space-y-3.5">
                  <div className="flex items-start gap-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20">
                    <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold">Active Contributor Access</p>
                      <p className="text-[11px] opacity-90 leading-relaxed text-foreground/80">
                        You can author new curriculum series, design interactive browser labs, and submit content for peer review.
                      </p>
                    </div>
                  </div>

                  <Button size="sm" asChild className="w-full text-xs font-bold gap-2 shadow-xs">
                    <Link to="/user/dashboard/content">
                      <Layers className="size-3.5" />
                      <span>Manage My Content &amp; Studio</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              ) : user?.contributorStatus === 'PENDING' ? (
                <div className="space-y-3.5">
                  <div className="flex items-start gap-3 text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/20">
                    <Clock className="size-4 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold">Application Pending Review</p>
                      <p className="text-[11px] opacity-90 leading-relaxed text-foreground/80">
                        Your application to become a Contributor has been received and is currently being audited by administrators.
                      </p>
                    </div>
                  </div>

                  <Button size="sm" variant="outline" onClick={() => setApplyModalOpen(true)} className="w-full text-xs font-semibold">
                    View Application Status
                  </Button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Share your expertise! Write interactive coding series, craft hands-on labs, and empower developers worldwide.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setApplyModalOpen(true)}
                    className="w-full text-xs font-bold gap-1.5 shadow-xs"
                  >
                    <Award className="size-3.5" />
                    <span>Apply to Become a Contributor</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </div>

          <div className="p-4 border-t border-border/50 bg-muted/10 text-xs text-muted-foreground flex items-center justify-between">
            <span>Authoring Rights</span>
            <span className="font-semibold text-foreground/80">
              {isContributor ? 'Granted' : 'Standard Learner'}
            </span>
          </div>
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
