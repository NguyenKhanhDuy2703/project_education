import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminGroupsApi } from '@/features/admin/api/groups.admin.api';
import { entitlementsAdminApi } from '@/features/admin/api/entitlements.admin.api';
import { usersAdminApi } from '@/features/admin/api/users.admin.api';
import { ALL_PERMISSIONS } from '@/features/auth/permissions';
import { Card } from '@/components/ui/card';
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
  Users,
  Shield,
  Plus,
  Edit,
  UserPlus,
  Trash2,
  CheckCircle2,
  Search,
  Layers,
  Key,
} from 'lucide-react';
import type { PermissionCode, UserGroup } from '@/types/user.types';

export function AdminGroupsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Group Create/Edit Modal
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [groupForm, setGroupForm] = useState({
    name: '',
    code: '',
    description: '',
    planIds: [] as string[],
    isActive: true,
  });

  // Group Members Modal
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [activeGroupForMembers, setActiveGroupForMembers] = useState<UserGroup | null>(null);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Groups and Plans from real API
  const { data: groups = [], refetch: refetchGroups } = useQuery({
    queryKey: ['admin-groups-tab-list'],
    queryFn: () => adminGroupsApi.getAll(),
  });

  const { data: plansData = [] } = useQuery({
    queryKey: ['admin-groups-tab-plans'],
    queryFn: () => entitlementsAdminApi.getPlans(),
  });
  const plans = plansData as any[];

  const { data: usersData } = useQuery({
    queryKey: ['admin-groups-tab-users'],
    queryFn: () => usersAdminApi.getUsers({ limit: 100 }),
  });
  const allUsers = (usersData?.items as any[]) || [];

  // Filter groups
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return groups;
    const q = searchTerm.toLowerCase();
    return groups.filter(
      (g) => g.name.toLowerCase().includes(q) || g.code.toLowerCase().includes(q)
    );
  }, [groups, searchTerm]);


  // Compute effective permissions for a set of planIds
  const computeGroupEffectivePermissions = useCallback(
    (planIds: string[] = []): PermissionCode[] => {
      const permSet = new Set<PermissionCode>();
      const safePlanIds = planIds || [];
      const activePlans = plans.filter((p) => p.isActive && safePlanIds.includes(p.id));
      activePlans.forEach((p: any) => {
        (p.permissionCodes || []).forEach((code: PermissionCode) => permSet.add(code));
      });
      return Array.from(permSet);
    },
    [plans]
  );

  // Handlers: Create/Edit Group
  const handleOpenCreateGroup = () => {
    setEditingGroup(null);
    setGroupForm({
      name: '',
      code: '',
      description: '',
      planIds: plans[0]?.id ? [plans[0].id] : [],
      isActive: true,
    });
    setGroupModalOpen(true);
  };

  const handleOpenEditGroup = (group: any) => {
    setEditingGroup(group);
    const initialPlanIds = group.planIds || group.plans?.map((p: any) => p.id) || [];
    setGroupForm({
      name: group.name,
      code: group.code,
      description: group.description || '',
      planIds: [...initialPlanIds],
      isActive: group.isActive,
    });
    setGroupModalOpen(true);
  };

  const handleTogglePlanInGroup = (planId: string) => {
    setGroupForm((prev) => {
      const currentPlanIds = prev.planIds || [];
      const exists = currentPlanIds.includes(planId);
      const nextPlanIds = exists
        ? currentPlanIds.filter((id) => id !== planId)
        : [...currentPlanIds, planId];
      return { ...prev, planIds: nextPlanIds };
    });
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.name.trim() || !groupForm.code.trim()) return;

    try {
      if (editingGroup) {
        await adminGroupsApi.update(editingGroup.id, {
          name: groupForm.name,
          code: groupForm.code.toUpperCase(),
          description: groupForm.description,
          isActive: groupForm.isActive,
        });
        if (groupForm.planIds) {
          await adminGroupsApi.assignPlans(editingGroup.id, groupForm.planIds);
        }
        showToast(`Group "${groupForm.name}" updated successfully.`);
      } else {
        await adminGroupsApi.create({
          name: groupForm.name,
          code: groupForm.code.toUpperCase(),
          description: groupForm.description,
          planIds: groupForm.planIds,
          isActive: groupForm.isActive,
        });
        showToast(`New group "${groupForm.name}" created successfully.`);
      }
      await refetchGroups();
    } catch {
      showToast('Failed to save group.');
    }

    setGroupModalOpen(false);
  };

  // Handlers: Members Management
  const handleOpenMembersModal = (group: UserGroup) => {
    setActiveGroupForMembers(group);
    setSelectedUserToAdd('');
    setMembersModalOpen(true);
  };

  const handleAddMemberToGroup = async () => {
    if (!activeGroupForMembers || !selectedUserToAdd) return;
    try {
      await adminGroupsApi.addMember(activeGroupForMembers.id, selectedUserToAdd);
      await refetchGroups();
      showToast('Member added to group successfully.');
      setSelectedUserToAdd('');
    } catch {
      showToast('Failed to add member to group.');
    }
  };

  const handleRemoveMemberFromGroup = async (userId: string) => {
    if (!activeGroupForMembers) return;
    try {
      await adminGroupsApi.removeMember(activeGroupForMembers.id, userId);
      await refetchGroups();
      showToast('Removed member from group.');
    } catch {
      showToast('Failed to remove member from group.');
    }
  };

  // Live Effective permissions in the form
  const modalEffectivePermissions = useMemo(() => {
    return computeGroupEffectivePermissions(groupForm.planIds);
  }, [groupForm.planIds, computeGroupEffectivePermissions]);

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 p-3 px-4 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="size-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            User Groups
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Assign subscription plans to groups instead of individual users. A user can belong to multiple groups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by group name or code..."
              className="h-8 pl-8 text-xs bg-card"
            />
          </div>
          <Button size="sm" onClick={handleOpenCreateGroup} className="h-8 text-xs font-bold gap-1.5 shadow-xs">
            <Plus className="size-3.5" />
            Create New Group
          </Button>
        </div>
      </div>

      {/* Group Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGroups.map((group) => {
          const groupPlanIds = group.planIds || (group as any).plans?.map((p: any) => p.id) || [];
          const groupPlans = plans.filter((p) => groupPlanIds.includes(p.id));
          const effectiveCodes = computeGroupEffectivePermissions(groupPlanIds);
          const groupMemberIds = group.memberIds || [];
          const memberUsers = allUsers.filter(
            (u) => u.groupIds?.includes(group.id) || groupMemberIds.includes(u.id)
          );

          return (
            <Card key={group.id} className="border-border bg-card hover:border-primary/40 transition-all flex flex-col justify-between p-5">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground">{group.name}</h3>
                      <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 uppercase">
                        {group.code}
                      </Badge>
                    </div>
                    {group.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {group.description}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={group.isActive ? 'default' : 'secondary'}
                    className={`text-[10px] px-2 py-0.5 ${
                      group.isActive ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : ''
                    }`}
                  >
                    {group.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {/* Assigned Plans */}
                <div className="space-y-1.5 pt-2 border-t border-border/50">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Layers className="size-3 text-primary" />
                    Assigned Plans ({groupPlans.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {groupPlans.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">No plans assigned</span>
                    ) : (
                      groupPlans.map((p) => (
                        <Badge key={p.id} variant="secondary" className="text-[11px] font-medium bg-primary/10 text-primary border-primary/20">
                          {p.name} ({p.code})
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                {/* Effective Permissions Summary */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Key className="size-3 text-amber-500" />
                    Aggregated Effective Permissions ({effectiveCodes.length}):
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                    {effectiveCodes.slice(0, 6).map((code) => (
                      <span
                        key={code}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-mono text-muted-foreground"
                      >
                        {code}
                      </span>
                    ))}
                    {effectiveCodes.length > 6 && (
                      <span className="text-[10px] text-muted-foreground font-mono self-center">
                        +{effectiveCodes.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 mt-3 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Users className="size-3.5 text-primary" />
                  <strong>{memberUsers.length}</strong> members
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenMembersModal(group)}
                    className="h-7 text-xs gap-1"
                  >
                    <UserPlus className="size-3" />
                    Members
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenEditGroup(group)}
                    className="h-7 text-xs gap-1"
                  >
                    <Edit className="size-3" />
                    Edit
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── Create / Edit Group Modal ─────────────────────────────────────── */}
      <Dialog open={groupModalOpen} onOpenChange={setGroupModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-6">
          <DialogHeader className="border-b border-border pb-3 shrink-0">
            <DialogTitle className="text-base flex items-center gap-2">
              <Shield className="size-4 text-primary" />
              {editingGroup ? `Edit Group: ${editingGroup.name}` : 'Create New User Group'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure group details and select Plans to assign to all group members.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveGroup} className="flex-1 overflow-y-auto py-3 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Group Name:</label>
                <Input
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  placeholder="e.g. Instructors & Contributors Group"
                  className="text-xs bg-card"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Group Code:</label>
                <Input
                  value={groupForm.code}
                  onChange={(e) => setGroupForm({ ...groupForm, code: e.target.value })}
                  placeholder="e.g. INSTRUCTOR_GROUP"
                  className="text-xs font-mono uppercase bg-card"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Description &amp; Purpose:</label>
              <Textarea
                value={groupForm.description}
                onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                placeholder="Describe responsibilities or scope of this group..."
                className="text-xs min-h-[60px] bg-card"
              />
            </div>

            {/* Plan Multi-Select Matrix */}
            <div className="space-y-2 pt-2 border-t border-border">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Select Plans Assigned to Group:</span>
                <span className="text-[11px] text-muted-foreground font-normal">
                  {groupForm.planIds.length} plans selected
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {plans.map((plan) => {
                  const isChecked = groupForm.planIds.includes(plan.id);
                  return (
                    <div
                      key={plan.id}
                      onClick={() => handleTogglePlanInGroup(plan.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                        isChecked
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:bg-muted/30'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by div
                        className="mt-0.5 rounded border-border text-primary focus:ring-primary size-4"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-foreground truncate">{plan.name}</p>
                          <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 uppercase">
                            {plan.code}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-primary font-mono mt-0.5">
                          {plan.planFeatures?.length ?? plan.permissionCodes?.length ?? 0} features
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Real-time Effective Permissions Preview */}
            <div className="space-y-2 pt-2 border-t border-border">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Key className="size-3.5 text-amber-500" />
                <span>Effective Aggregated Permissions Preview ({modalEffectivePermissions.length} permissions):</span>
              </label>
              <div className="p-3 rounded-lg border border-border bg-muted/20 flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                {modalEffectivePermissions.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic">
                    No permissions granted yet. Select at least one Plan above.
                  </span>
                ) : (
                  modalEffectivePermissions.map((code) => {
                    const meta = ALL_PERMISSIONS.find((p) => p.code === code);
                    return (
                      <span
                        key={code}
                        title={meta?.description || code}
                        className="text-[11px] px-2 py-0.5 rounded bg-card border border-border font-mono text-foreground"
                      >
                        {code}
                      </span>
                    );
                  })
                )}
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-border gap-2 sm:gap-0 shrink-0">
              <Button type="button" variant="outline" size="sm" onClick={() => setGroupModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs font-bold">
                {editingGroup ? 'Save Changes' : 'Create Group'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Manage Group Members Modal ────────────────────────────────────── */}
      <Dialog open={membersModalOpen} onOpenChange={setMembersModalOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Users className="size-4 text-primary" />
              Members: {activeGroupForMembers?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Manage the list of users assigned to this group.
            </DialogDescription>
          </DialogHeader>

          {/* Add user to group */}
          <div className="flex items-center gap-2 pt-2">
            <select
              value={selectedUserToAdd}
              onChange={(e) => setSelectedUserToAdd(e.target.value)}
              className="flex-1 h-8 px-2.5 text-xs bg-card border border-border rounded-lg text-foreground font-medium"
            >
              <option value="">-- Select user to add to group --</option>
              {allUsers
                .filter((u) => !u.groupIds?.includes(activeGroupForMembers?.id || ''))
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role}) - {u.email}
                  </option>
                ))}
            </select>
            <Button
              size="sm"
              onClick={handleAddMemberToGroup}
              disabled={!selectedUserToAdd}
              className="h-8 text-xs font-bold"
            >
              Add
            </Button>
          </div>

          {/* Current members list */}
          <div className="space-y-1.5 py-2 max-h-64 overflow-y-auto">
            <p className="text-xs font-semibold text-muted-foreground">Current Members:</p>
            {allUsers
              .filter((u) => u.groupIds?.includes(activeGroupForMembers?.id || ''))
              .map((u) => (
                <div
                  key={u.id}
                  className="p-2.5 rounded-lg border border-border bg-card flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-foreground">{u.name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{u.email}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveMemberFromGroup(u.id)}
                    className="h-7 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
          </div>

          <DialogFooter>
            <Button size="sm" onClick={() => setMembersModalOpen(false)} className="text-xs">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
