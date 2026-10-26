import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  entitlementsAdminApi,
  type SubscriptionPlanItem,
  type FeatureItem,
} from '@/features/admin/api/entitlements.admin.api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  Check,
  Save,
  Edit2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

export function AdminPlansTab() {
  const qc = useQueryClient();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({
    code: '',
    name: '',
    description: '',
    price: 0,
    billingCycle: 'MONTHLY',
    isDefault: false,
    isPublic: false,
    isSaleReady: false,
  });

  // Edit Plan State
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: 0,
    billingCycle: 'MONTHLY',
    isActive: true,
    isDefault: false,
    isPublic: false,
    isSaleReady: false,
  });

  // Delete Plan State
  const [deletingPlan, setDeletingPlan] = useState<SubscriptionPlanItem | null>(null);

  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  // 1. Fetch Plans
  const { data: plans = [], isLoading: isLoadingPlans } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: () => entitlementsAdminApi.getPlans(),
  });

  // 2. Fetch Features
  const { data: features = [] } = useQuery({
    queryKey: ['admin-features'],
    queryFn: () => entitlementsAdminApi.getFeatures(),
  });

  const activePlan =
    plans.find((p) => p.id === selectedPlanId) || plans[0];

  // Set initial features for selected plan
  const handleSelectPlan = (plan: SubscriptionPlanItem) => {
    setSelectedPlanId(plan.id);
    setSelectedFeatureIds(plan.planFeatures.map((pf) => pf.featureId));
  };

  const handleOpenEdit = (plan: SubscriptionPlanItem) => {
    setEditingPlan(plan);
    setEditForm({
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      billingCycle: plan.billingCycle,
      isActive: plan.isActive ?? true,
      isDefault: plan.isDefault ?? false,
      isPublic: plan.isPublic ?? false,
      isSaleReady: plan.isSaleReady ?? false,
    });
  };

  // Toggle feature mapping in active plan
  const handleToggleFeature = (featureId: string) => {
    const currentMapped =
      selectedPlanId === activePlan?.id
        ? selectedFeatureIds
        : activePlan?.planFeatures.map((pf) => pf.featureId) || [];

    if (currentMapped.includes(featureId)) {
      setSelectedFeatureIds(currentMapped.filter((id) => id !== featureId));
    } else {
      setSelectedFeatureIds([...currentMapped, featureId]);
    }
  };

  // Mutation: Save Plan Features
  const saveFeaturesMutation = useMutation({
    mutationFn: () => {
      const planId = activePlan?.id;
      const featureIds =
        selectedPlanId === activePlan?.id
          ? selectedFeatureIds
          : activePlan?.planFeatures.map((pf) => pf.featureId) || [];
      return entitlementsAdminApi.updatePlanFeatures(planId, featureIds);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-plans'] });
      showFeedback('Plan feature mappings successfully saved');
    },
    onError: () => showFeedback('Failed to save plan feature mappings', 'error'),
  });

  // Mutation: Create Plan
  const createPlanMutation = useMutation({
    mutationFn: () => entitlementsAdminApi.createPlan(newPlan),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-plans'] });
      showFeedback('Subscription plan created successfully');
      setCreateModalOpen(false);
      setNewPlan({
        code: '',
        name: '',
        description: '',
        price: 0,
        billingCycle: 'MONTHLY',
        isDefault: false,
        isPublic: false,
        isSaleReady: false,
      });
    },
    onError: (err: any) =>
      showFeedback(err?.response?.data?.message || 'Failed to create subscription plan', 'error'),
  });

  // Mutation: Update Plan
  const updatePlanMutation = useMutation({
    mutationFn: () => {
      if (!editingPlan) throw new Error('No plan selected');
      return entitlementsAdminApi.updatePlan(editingPlan.id, editForm);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-plans'] });
      showFeedback('Subscription plan updated successfully');
      setEditingPlan(null);
    },
    onError: (err: any) =>
      showFeedback(err?.response?.data?.message || 'Failed to update subscription plan', 'error'),
  });

  // Mutation: Delete Plan
  const deletePlanMutation = useMutation({
    mutationFn: (planId: string) => entitlementsAdminApi.deletePlan(planId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-plans'] });
      showFeedback('Subscription plan deleted successfully');
      setDeletingPlan(null);
      if (selectedPlanId === deletingPlan?.id) {
        setSelectedPlanId(null);
      }
    },
    onError: (err: any) =>
      showFeedback(err?.response?.data?.message || 'Failed to delete subscription plan', 'error'),
  });

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
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

      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Subscription Plans &amp; Feature Entitlements
          </h2>
          <p className="text-xs text-muted-foreground">
            Bundle platform capabilities into distinct tiers. Users inherit these features based on their active subscription.
          </p>
        </div>

        <Button
          onClick={() => setCreateModalOpen(true)}
          className="gap-1.5 text-xs font-semibold shadow-sm"
        >
          <Plus className="size-4" /> Create Plan
        </Button>
      </div>

      {/* 2-Column Layout: Plans List (Left) | Feature Matrix (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Plans List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Available Plans ({plans.length})
          </div>

          <div className="space-y-2.5">
            {isLoadingPlans ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Loading subscription plans...
              </div>
            ) : plans.map((p: SubscriptionPlanItem) => {
              const isSelected = (activePlan?.id === p.id);

              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectPlan(p)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-card border-primary ring-1 ring-primary shadow-sm'
                      : 'bg-card/60 border-border hover:border-muted-foreground/30 hover:bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        {p.name}
                        {p.isDefault && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            Default
                          </Badge>
                        )}
                        {!p.isActive && (
                          <Badge variant="secondary" className="text-[10px] text-rose-500 bg-rose-500/10">
                            Inactive
                          </Badge>
                        )}
                        {p.isPublic && (
                          <Badge variant="outline" className="text-[10px] text-sky-600 border-sky-500/30 bg-sky-500/10">
                            Public
                          </Badge>
                        )}
                        {p.isSaleReady && (
                          <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                            Sale Ready
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                        {p.code} • {p.billingCycle}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-sm text-primary">
                        {p.price > 0 ? `${Number(p.price).toLocaleString()} VND` : 'Free'}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {p.planFeatures?.length || 0} features bundled
                      </div>
                    </div>
                  </div>

                  {p.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {p.description}
                    </p>
                  )}

                  <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-end gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(p);
                      }}
                      className="h-6 text-[11px] px-2 gap-1 font-medium"
                    >
                      <Edit2 className="size-3" /> Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingPlan(p);
                      }}
                      className="h-6 text-[11px] px-2 gap-1 font-medium"
                    >
                      <Trash2 className="size-3" /> Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Feature Toggles for Selected Plan */}
        <div className="lg:col-span-7 bg-card border border-border rounded-xl p-5 space-y-5">
          {activePlan ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <div className="text-sm font-bold text-foreground flex items-center gap-2">
                    Feature Matrix for: <span className="text-primary">{activePlan.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Toggle which platform features are enabled for subscribers of this tier.
                  </p>
                </div>

                <Button
                  size="sm"
                  disabled={saveFeaturesMutation.isPending}
                  onClick={() => saveFeaturesMutation.mutate()}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <Save className="size-3.5" /> Save Changes
                </Button>
              </div>

              {/* Feature checkboxes list */}
              <div className="space-y-2">
                {features.map((f: FeatureItem) => {
                  const currentlySelected =
                    selectedPlanId === activePlan.id
                      ? selectedFeatureIds
                      : activePlan.planFeatures.map((pf) => pf.featureId);

                  const isEnabled = currentlySelected.includes(f.id);

                  return (
                    <div
                      key={f.id}
                      onClick={() => handleToggleFeature(f.id)}
                      className={`p-3.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                        isEnabled
                          ? 'bg-primary/5 border-primary/30'
                          : 'bg-muted/10 border-border hover:bg-muted/20'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                          {f.name}
                          <span className="text-[10px] px-1.5 py-0.2 bg-muted text-muted-foreground rounded uppercase font-mono">
                            {f.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {f.description || f.code}
                        </div>
                      </div>

                      <div
                        className={`size-5 rounded-md border flex items-center justify-center transition-colors ${
                          isEnabled
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-border bg-background'
                        }`}
                      >
                        {isEnabled && <Check className="size-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-xs text-muted-foreground">
              Select a subscription plan on the left to configure features.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Plan */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-foreground">Create Subscription Plan</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">Plan Code (UPPERCASE):</label>
                <input
                  type="text"
                  placeholder="e.g. PRO_ENTERPRISE"
                  value={newPlan.code}
                  onChange={(e) => setNewPlan({ ...newPlan, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Plan Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Enterprise Tier"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">Price (VND):</label>
                  <input
                    type="number"
                    value={newPlan.price}
                    onChange={(e) => setNewPlan({ ...newPlan, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground mb-1">Billing Cycle:</label>
                  <select
                    value={newPlan.billingCycle}
                    onChange={(e) => setNewPlan({ ...newPlan, billingCycle: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none"
                  >
                    <option value="FREE">Free</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="LIFETIME">Lifetime</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Description:</label>
                <textarea
                  rows={2}
                  placeholder="Plan description and target audience..."
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={newPlan.isPublic}
                    onChange={(e) => setNewPlan({ ...newPlan, isPublic: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary size-4"
                  />
                  Public (Hiển thị trang giá)
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={newPlan.isSaleReady}
                    onChange={(e) => setNewPlan({ ...newPlan, isSaleReady: e.target.checked })}
                    disabled={newPlan.price <= 0}
                    className="rounded border-border text-primary focus:ring-primary size-4 disabled:opacity-50"
                  />
                  Sale Ready (Mở bán)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!newPlan.code || !newPlan.name || createPlanMutation.isPending}
                onClick={() => createPlanMutation.mutate()}
                className="font-semibold"
              >
                Create Plan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT PLAN MODAL ─────────────────────────────────────────────────── */}
      <Dialog open={Boolean(editingPlan)} onOpenChange={(open) => !open && setEditingPlan(null)}>
        <DialogContent className="w-[95vw] sm:max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Edit2 className="size-5 text-primary" />
              Edit Subscription Plan: {editingPlan?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update plan pricing, billing cycle, active status, or default tier status.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              updatePlanMutation.mutate();
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Plan Name *</label>
              <Input
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Price (VND)</label>
                <Input
                  type="number"
                  min={0}
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Billing Cycle</label>
                <select
                  value={editForm.billingCycle}
                  onChange={(e) => setEditForm({ ...editForm, billingCycle: e.target.value })}
                  className="w-full h-9 text-xs px-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="FREE">Free</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                  <option value="LIFETIME">Lifetime</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Description</label>
              <Textarea
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary size-4"
                />
                Active (Kích hoạt)
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={editForm.isDefault}
                  onChange={(e) => setEditForm({ ...editForm, isDefault: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary size-4"
                />
                Default Free Plan
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={editForm.isPublic}
                  onChange={(e) => setEditForm({ ...editForm, isPublic: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary size-4"
                />
                Public (Hiển thị bảng giá)
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={editForm.isSaleReady}
                  onChange={(e) => setEditForm({ ...editForm, isSaleReady: e.target.checked })}
                  disabled={editForm.price <= 0}
                  className="rounded border-border text-primary focus:ring-primary size-4 disabled:opacity-50"
                />
                Sale Ready (Mở bán)
              </label>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingPlan(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!editForm.name.trim() || updatePlanMutation.isPending}
                className="text-xs font-bold"
              >
                {updatePlanMutation.isPending ? 'Saving…' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── DELETE PLAN DIALOG ──────────────────────────────────────────────── */}
      <Dialog open={Boolean(deletingPlan)} onOpenChange={(open) => !open && setDeletingPlan(null)}>
        <DialogContent className="w-[95vw] sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Delete Subscription Plan
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
              Are you sure you want to delete plan{' '}
              <strong className="text-foreground">{deletingPlan?.name}</strong> ({deletingPlan?.code})?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive space-y-1 my-2">
            <p className="font-semibold">Subscription Protection Check:</p>
            <p className="text-[11px] leading-relaxed">
              Plans with active paying users cannot be deleted directly. If this plan has active members, please mark it as Inactive in Edit instead.
            </p>
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingPlan(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deletePlanMutation.isPending}
              onClick={() => deletingPlan && deletePlanMutation.mutate(deletingPlan.id)}
              className="text-xs font-bold shadow-xs"
            >
              {deletePlanMutation.isPending ? 'Deleting…' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
