import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  entitlementsAdminApi,
  type SubscriptionPlanItem,
} from '@/features/admin/api/entitlements.admin.api';
import { adminGroupsApi } from '@/features/admin/api/groups.admin.api';
import { ALL_PERMISSIONS } from '@/features/auth/permissions';
import type { PermissionCode } from '@/types/user.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  X,
  ShieldAlert,
  Ban,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  Users,
  Key,
  Layers,
  Search,
  Check,
} from 'lucide-react';

interface UserEntitlementsModalProps {
  userId: string | null;
  onClose: () => void;
}

export function UserEntitlementsModal({ userId, onClose }: UserEntitlementsModalProps) {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'iam' | 'subscription'>('iam');

  // IAM Inspector search & filter state
  const [permSearch, setPermSearch] = useState('');
  const [permModuleFilter, setPermModuleFilter] = useState<string>('all');

  // Subscriptions & Overrides state
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [assignReason, setAssignReason] = useState<string>('');
  const [banFeatureCode, setBanFeatureCode] = useState<string | null>(null);
  const [banReason, setBanReason] = useState<string>('');
  const [banDays, setBanDays] = useState<number>(7);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // 1. Fetch user entitlements from backend/mock API
  const { data, isLoading } = useQuery({
    queryKey: ['admin-user-entitlements', userId],
    queryFn: () => entitlementsAdminApi.getUserEntitlements(userId!),
    enabled: !!userId,
  });

  // 2. Fetch available plans from backend
  const { data: plans = [] } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: () => entitlementsAdminApi.getPlans(),
    enabled: !!userId,
  });

  // 3. IAM Groups from real backend API
  const { data: allGroups = [], refetch: refetchGroups } = useQuery({
    queryKey: ['admin-groups-list'],
    queryFn: () => adminGroupsApi.getAll(),
    enabled: !!userId,
  });

  const allPlans = (plans as any[]) || [];

  // Handler: Toggle Group Membership for User (UI-507)
  const handleToggleGroup = async (groupId: string) => {
    if (!userId) return;
    try {
      const targetGroup = allGroups.find((g) => g.id === groupId);
      const isMember = targetGroup?.memberIds?.includes(userId);
      if (isMember) {
        await adminGroupsApi.removeMember(groupId, userId);
      } else {
        await adminGroupsApi.addMember(groupId, userId);
      }
      await refetchGroups();
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-user-entitlements', userId] });
      showFeedback('User IAM group memberships updated successfully.');
    } catch {
      showFeedback('Failed to update group membership.', 'error');
    }
  };

  // Effective Permissions Inspector breakdown (UI-508)
  const effectiveAnalysis = useMemo(() => {
    const userGroups = allGroups.filter((g) => g.isActive && g.memberIds?.includes(userId!));

    // Map each permission code to its grant sources
    const permissionSources: Record<string, Array<{ groupName: string; groupCode: string; planName: string }>> = {};

    userGroups.forEach((group) => {
      group.planIds.forEach((planId) => {
        const plan = allPlans.find((p) => p.id === planId && p.isActive);
        if (plan) {
          (plan.permissionCodes || []).forEach((permCode: any) => {
            if (!permissionSources[permCode]) {
              permissionSources[permCode] = [];
            }
            permissionSources[permCode].push({
              groupName: group.name,
              groupCode: group.code,
              planName: plan.name,
            });
          });
        }
      });
    });

    const grantedCodes = new Set(Object.keys(permissionSources));

    // Fallback: If user has effectiveFeatures in API response
    if (data?.effectiveFeatures) {
      data.effectiveFeatures.filter((f) => f.hasAccess).forEach((f) => grantedCodes.add(f.code));
    }

    return {
      permissionSources,
      grantedCodes,
      userGroups,
    };
  }, [data, allGroups, allPlans, userId]);

  // Filtered permissions list for the table
  const displayedPermissions = useMemo(() => {
    return ALL_PERMISSIONS.filter((p) => {
      const matchSearch =
        !permSearch.trim() ||
        p.name.toLowerCase().includes(permSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(permSearch.toLowerCase()) ||
        p.description?.toLowerCase().includes(permSearch.toLowerCase());

      const matchModule =
        permModuleFilter === 'all' || p.module === permModuleFilter;

      return matchSearch && matchModule;
    });
  }, [permSearch, permModuleFilter]);

  // 4. Mutations for Subscription & Overrides
  const assignPlanMutation = useMutation({
    mutationFn: () =>
      entitlementsAdminApi.assignSubscription(userId!, {
        planId: selectedPlanId,
        reason: assignReason || 'Administrative plan assignment',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-user-entitlements', userId] });
      showFeedback('Subscription plan successfully assigned');
      setAssignReason('');
    },
    onError: () => showFeedback('Failed to assign subscription plan', 'error'),
  });

  const setOverrideMutation = useMutation({
    mutationFn: (payload: { featureCode: string; effect: 'ALLOW' | 'DENY'; reason: string; expiresAt?: string }) =>
      entitlementsAdminApi.setFeatureOverride(userId!, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-user-entitlements', userId] });
      showFeedback(`Feature ${vars.featureCode} set to ${vars.effect}`);
      setBanFeatureCode(null);
      setBanReason('');
    },
    onError: () => showFeedback('Failed to update feature override', 'error'),
  });

  const removeOverrideMutation = useMutation({
    mutationFn: (featureCode: string) =>
      entitlementsAdminApi.removeFeatureOverride(userId!, featureCode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-user-entitlements', userId] });
      showFeedback('Override removed; restored plan defaults');
    },
    onError: () => showFeedback('Failed to remove override', 'error'),
  });

  if (!userId) return null;

  const displayName = data?.user?.name || `User ${userId}`;
  const displayEmail = data?.user?.email || 'N/A';
  const displayRole = data?.user?.role || 'user';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <ShieldAlert className="size-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">
                  Permissions &amp; Groups Management
                </h2>
                <Badge variant="outline" className="text-xs uppercase font-semibold">
                  {displayRole}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure user groups, trace permission provenance, and manage feature overrides.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tab Switcher & User Profile Summary */}
        <div className="px-6 pt-4 pb-2 border-b border-border bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">{displayName}</div>
              <div className="text-xs text-muted-foreground">{displayEmail}</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab('iam')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'iam'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="size-3.5 text-primary" />
              User Groups &amp; Permissions Analysis
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'subscription'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="size-3.5 text-amber-500" />
              Direct Plans &amp; Overrides
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mx-6 mt-4 px-4 py-2.5 rounded-lg text-xs font-semibold border flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
            }`}
          >
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="text-xs underline ml-2">Close</button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'iam' ? (
            /* ─────────────────────────────────────────────────────────────
               TAB 1: IAM GROUPS & EFFECTIVE PERMISSIONS INSPECTOR (UI-507 & UI-508)
               ───────────────────────────────────────────────────────────── */
            <div className="space-y-6">
              {/* UI-507: Assign Users to Group Flow */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Users className="size-4 text-primary" />
                      User Group Memberships
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      User permissions are aggregated (Union) from all active plans attached to assigned groups.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold text-primary">
                    Enrolled in {effectiveAnalysis.userGroups.length} of {allGroups.length} groups
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {allGroups.map((group) => {
                    const isMember = group.memberIds?.includes(userId!) ?? false;
                    const groupPlanIds = group.planIds || (group as any).plans?.map((p: any) => p.id) || [];
                    const groupPlans = allPlans.filter((p) => groupPlanIds.includes(p.id));

                    return (
                      <div
                        key={group.id}
                        onClick={() => handleToggleGroup(group.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                          isMember
                            ? 'bg-primary/5 border-primary/40 shadow-xs'
                            : 'bg-muted/20 border-border hover:bg-muted/40 opacity-80'
                        }`}
                      >
                        <div
                          className={`mt-0.5 size-5 rounded-md border flex items-center justify-center transition-all ${
                            isMember
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-muted-foreground/40 bg-background'
                          }`}
                        >
                          {isMember && <Check className="size-3.5 stroke-[3]" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-foreground truncate">
                              {group.name}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] font-mono shrink-0 uppercase"
                            >
                              {group.code}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            {group.description || 'No description provided'}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="text-[10px] text-muted-foreground">Attached plans:</span>
                            {groupPlans.length > 0 ? (
                              groupPlans.map((gp) => (
                                <Badge
                                  key={gp.id}
                                  variant="secondary"
                                  className="text-[9px] px-1.5 py-0 h-4 bg-background border border-border"
                                >
                                  {gp.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">No plans attached</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* UI-508: Effective Permissions Inspector */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Key className="size-4 text-emerald-500" />
                      Effective Permissions Inspector
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Trace the exact provenance of every permission (which Group and Plan granted it).
                    </p>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-xs self-start sm:self-auto">
                    {effectiveAnalysis.grantedCodes.size} / {ALL_PERMISSIONS.length} Permissions Granted
                  </Badge>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search permission code or action name..."
                      value={permSearch}
                      onChange={(e) => setPermSearch(e.target.value)}
                      className="pl-8 text-xs h-8"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {['all', 'content', 'learning', 'users', 'access'].map((mod) => (
                      <button
                        key={mod}
                        onClick={() => setPermModuleFilter(mod)}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-all shrink-0 capitalize ${
                          permModuleFilter === mod
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {mod === 'all' ? 'All Modules' : mod}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table Breakdown */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                        <th className="py-2.5 px-3">Permission Name &amp; Code</th>
                        <th className="py-2.5 px-3">Module</th>
                        <th className="py-2.5 px-3">Effective Status</th>
                        <th className="py-2.5 px-3">Provenance (Grant Source)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {displayedPermissions.map((perm) => {
                        const isGranted = effectiveAnalysis.grantedCodes.has(perm.code as PermissionCode);
                        const sources = effectiveAnalysis.permissionSources[perm.code] || [];

                        return (
                          <tr
                            key={perm.code}
                            className={`transition-colors ${
                              isGranted ? 'hover:bg-muted/20' : 'bg-muted/10 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-foreground flex items-center gap-1.5">
                                {perm.name}
                              </div>
                              <div className="text-[10px] font-mono text-muted-foreground">
                                {perm.code}
                              </div>
                            </td>

                            <td className="py-2.5 px-3">
                              <Badge variant="outline" className="text-[10px] uppercase font-mono">
                                {perm.module}
                              </Badge>
                            </td>

                            <td className="py-2.5 px-3">
                              {isGranted ? (
                                <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 gap-1 text-[11px] font-semibold">
                                  <CheckCircle2 className="size-3" /> Granted
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground text-[11px]">
                                  Locked
                                </Badge>
                              )}
                            </td>

                            <td className="py-2.5 px-3">
                              {sources.length > 0 ? (
                                <div className="space-y-1">
                                  {sources.map((s, idx) => (
                                    <div
                                      key={idx}
                                      className="inline-flex items-center gap-1 text-[11px] bg-muted/60 px-2 py-0.5 rounded-md border border-border text-foreground mr-1.5 mb-1"
                                    >
                                      <Users className="size-2.5 text-primary" />
                                      <span className="font-medium">{s.groupName}</span>
                                      <span className="text-muted-foreground">→</span>
                                      <Layers className="size-2.5 text-amber-500" />
                                      <span className="text-muted-foreground">{s.planName}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : isGranted ? (
                                <span className="text-[11px] text-muted-foreground italic">
                                  Granted via default role ({displayRole})
                                </span>
                              ) : (
                                <span className="text-[11px] text-muted-foreground/60 italic">
                                  Not granted by any assigned group
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* ─────────────────────────────────────────────────────────────
               TAB 2: SUBSCRIPTION PLANS & FEATURE OVERRIDES (LEGACY / DIRECT)
               ───────────────────────────────────────────────────────────── */
            <div className="space-y-6">
              {/* Direct Subscription Assignment */}
              <div className="bg-muted/30 border border-border rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-base font-bold text-foreground">Direct Subscription Plan</div>
                    <div className="text-xs text-muted-foreground">
                      Assign subscription plan directly without groups (Direct Subscription)
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Current Plan:</span>
                    <Badge className="bg-primary/10 text-primary border border-primary/20 font-bold">
                      {data?.currentSubscription?.planName || 'Free Tier (Default)'}
                    </Badge>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none"
                  >
                    <option value="">Select subscription plan...</option>
                    {plans.map((p: SubscriptionPlanItem) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.billingCycle}) — {p.price.toLocaleString()} VND
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Reason for change..."
                    value={assignReason}
                    onChange={(e) => setAssignReason(e.target.value)}
                    className="w-full sm:w-64 px-3 py-2 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none"
                  />

                  <Button
                    size="sm"
                    disabled={!selectedPlanId || assignPlanMutation.isPending}
                    onClick={() => assignPlanMutation.mutate()}
                    className="text-xs font-semibold"
                  >
                    Apply Plan
                  </Button>
                </div>
              </div>

              {/* Feature Overrides & Ban Matrix */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Feature Overrides &amp; Ban Matrix
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      DENY takes highest precedence. Use ALLOW to grant feature bypasses.
                    </p>
                  </div>
                </div>

                {isLoading ? (
                  <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
                    Loading overrides...
                  </div>
                ) : (
                  <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                          <th className="py-2.5 px-3">Feature</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Effective Status</th>
                          <th className="py-2.5 px-3">Current Override</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {data?.effectiveFeatures.map((f) => {
                          const activeOverride = data.overrides.find((o) => o.featureCode === f.code);

                          return (
                            <tr key={f.code} className="hover:bg-muted/20 transition-colors">
                              <td className="py-3 px-3">
                                <div className="font-semibold text-foreground">{f.name}</div>
                                <div className="text-[10px] font-mono text-muted-foreground">{f.code}</div>
                              </td>

                              <td className="py-3 px-3 text-muted-foreground">
                                <span className="capitalize">{f.category.replace('_', ' ')}</span>
                              </td>

                              <td className="py-3 px-3">
                                {f.isBanned ? (
                                  <Badge className="bg-rose-500/10 text-rose-500 border border-rose-500/20 gap-1">
                                    <Ban className="size-3" /> Denied (Deny)
                                  </Badge>
                                ) : f.hasAccess ? (
                                  <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 gap-1">
                                    <CheckCircle2 className="size-3" /> Active (Allow)
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground">
                                    Plan Required
                                  </Badge>
                                )}
                              </td>

                              <td className="py-3 px-3 text-muted-foreground">
                                {activeOverride ? (
                                  <div>
                                    <span
                                      className={`font-semibold ${
                                        activeOverride.effect === 'DENY' ? 'text-rose-500' : 'text-amber-500'
                                      }`}
                                    >
                                      {activeOverride.effect}:
                                    </span>{' '}
                                    {activeOverride.reason}
                                    {activeOverride.expiresAt && (
                                      <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                        <Clock className="size-2.5" />
                                        Expires: {new Date(activeOverride.expiresAt).toLocaleDateString()}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground/60 italic">Inherited from plan</span>
                                )}
                              </td>

                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={setOverrideMutation.isPending}
                                    onClick={() =>
                                      setOverrideMutation.mutate({
                                        featureCode: f.code,
                                        effect: 'ALLOW',
                                        reason: 'Granted by Administrator',
                                      })
                                    }
                                    className="h-7 text-[11px] gap-1 hover:text-amber-500"
                                  >
                                    <Sparkles className="size-3" /> Grant
                                  </Button>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setBanFeatureCode(f.code)}
                                    className="h-7 text-[11px] text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 gap-1"
                                  >
                                    <Ban className="size-3" /> Ban
                                  </Button>

                                  {activeOverride && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      disabled={removeOverrideMutation.isPending}
                                      onClick={() => removeOverrideMutation.mutate(f.code)}
                                      className="h-7 text-[11px] text-muted-foreground"
                                    >
                                      Reset
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Ban Modal Prompt */}
              {banFeatureCode && (
                <div className="bg-rose-500/5 border border-rose-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-rose-500 font-bold text-sm">
                    <AlertTriangle className="size-4" />
                    Ban Feature [{banFeatureCode}]
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-muted-foreground mb-1">Ban Reason (Audit Log):</label>
                      <input
                        type="text"
                        placeholder="e.g. Terms violation, excessive usage..."
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                        className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-foreground focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-muted-foreground mb-1">Ban Duration:</label>
                      <select
                        value={banDays}
                        onChange={(e) => setBanDays(parseInt(e.target.value, 10))}
                        className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-foreground focus:outline-none"
                      >
                        <option value={1}>1 Day</option>
                        <option value={3}>3 Days</option>
                        <option value={7}>7 Days (1 Week)</option>
                        <option value={30}>30 Days (1 Month)</option>
                        <option value={0}>Permanent</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setBanFeatureCode(null)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={!banReason || setOverrideMutation.isPending}
                      onClick={() => {
                        const expiresAt =
                          banDays > 0
                            ? new Date(Date.now() + banDays * 86400000).toISOString()
                            : undefined;
                        setOverrideMutation.mutate({
                          featureCode: banFeatureCode,
                          effect: 'DENY',
                          reason: banReason,
                          expiresAt,
                        });
                      }}
                      className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      Confirm Ban
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
