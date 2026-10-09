import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  entitlementsAdminApi,
  type SubscriptionPlanItem,
} from '@/features/admin/api/entitlements.admin.api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X,
  ShieldAlert,
  Ban,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface UserEntitlementsModalProps {
  userId: string | null;
  onClose: () => void;
}

export function UserEntitlementsModal({ userId, onClose }: UserEntitlementsModalProps) {
  const qc = useQueryClient();
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

  // 1. Fetch user entitlements
  const { data, isLoading } = useQuery({
    queryKey: ['admin-user-entitlements', userId],
    queryFn: () => entitlementsAdminApi.getUserEntitlements(userId!),
    enabled: !!userId,
  });

  // 2. Fetch available plans
  const { data: plans = [] } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: () => entitlementsAdminApi.getPlans(),
    enabled: !!userId,
  });

  // 3. Mutation: Assign Plan
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

  // 4. Mutation: Set Feature Override (Allow or Deny)
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

  // 5. Mutation: Remove Override
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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <ShieldAlert className="size-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                User Access &amp; Entitlement Controls
              </h2>
              <p className="text-xs text-muted-foreground">
                Manage subscription tier, individual feature overrides, and suspension rules.
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

        {/* Feedback message */}
        {feedback && (
          <div
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold border ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
            }`}
          >
            {feedback.text}
          </div>
        )}

        {isLoading ? (
          <div className="py-20 text-center text-sm text-muted-foreground animate-pulse">
            Loading user entitlement profile...
          </div>
        ) : (
          <>
            {/* User Profile & Subscription Section */}
            <div className="bg-muted/30 border border-border rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-base font-bold text-foreground">{data?.user.name}</div>
                  <div className="text-xs text-muted-foreground">{data?.user.email}</div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Current Plan:</span>
                  <Badge className="bg-primary/10 text-primary border border-primary/20 font-bold">
                    {data?.currentSubscription?.planName || 'Free Tier (Default)'}
                  </Badge>
                </div>
              </div>

              {/* Plan Switcher */}
              <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none"
                >
                  <option value="">Select new subscription plan...</option>
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

            {/* Feature Entitlements & Ban Matrix */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Feature Access &amp; Individual Overrides
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Explicit DENY takes precedence over plan features. Use ALLOW to gift premium capabilities.
                  </p>
                </div>
              </div>

              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                      <th className="py-2.5 px-3">Feature</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Effective Status</th>
                      <th className="py-2.5 px-3">Active Override</th>
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

                          {/* Effective Status */}
                          <td className="py-3 px-3">
                            {f.isBanned ? (
                              <Badge className="bg-rose-500/10 text-rose-500 border border-rose-500/20 gap-1">
                                <Ban className="size-3" /> Banned (Deny)
                              </Badge>
                            ) : f.hasAccess ? (
                              <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 gap-1">
                                <CheckCircle2 className="size-3" /> Granted (Active)
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                Locked (Plan Required)
                              </Badge>
                            )}
                          </td>

                          {/* Override details */}
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
                              <span className="text-muted-foreground/60 italic">Inherited from Plan</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Gift (ALLOW) */}
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={setOverrideMutation.isPending}
                                onClick={() =>
                                  setOverrideMutation.mutate({
                                    featureCode: f.code,
                                    effect: 'ALLOW',
                                    reason: 'Gifted by administrator',
                                  })
                                }
                                className="h-7 text-[11px] gap-1 hover:text-amber-500"
                                title="Grant access regardless of plan"
                              >
                                <Sparkles className="size-3" /> Gift
                              </Button>

                              {/* Ban (DENY) */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setBanFeatureCode(f.code)}
                                className="h-7 text-[11px] text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 gap-1"
                                title="Ban user from this feature"
                              >
                                <Ban className="size-3" /> Ban
                              </Button>

                              {/* Reset */}
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
            </div>

            {/* Ban Modal Dialog Prompt */}
            {banFeatureCode && (
              <div className="bg-rose-500/5 border border-rose-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-rose-500 font-bold text-sm">
                  <AlertTriangle className="size-4" />
                  Restrict Access to [{banFeatureCode}]
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-muted-foreground mb-1">Reason for Ban (Audit Trail):</label>
                    <input
                      type="text"
                      placeholder="e.g. Scripting detected, cheating..."
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-foreground focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-1">Duration (Days):</label>
                    <select
                      value={banDays}
                      onChange={(e) => setBanDays(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-foreground focus:outline-none"
                    >
                      <option value={1}>1 Day</option>
                      <option value={3}>3 Days</option>
                      <option value={7}>7 Days (1 Week)</option>
                      <option value={30}>30 Days (1 Month)</option>
                      <option value={0}>Permanent (No expiration)</option>
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
                    Confirm Restriction
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
