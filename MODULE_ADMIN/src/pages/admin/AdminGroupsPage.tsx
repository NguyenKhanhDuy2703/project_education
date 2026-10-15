import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminGroupsApi, type CreateGroupPayload } from '@/features/admin/api/groups.admin.api';
import { entitlementsAdminApi } from '@/features/admin/api/entitlements.admin.api';
import { usersAdminApi } from '@/features/admin/api/users.admin.api';
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
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Shield,
  Users,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  Search,
  CheckCircle2,
  UserMinus,
  CreditCard,
  RefreshCw,
  Phone,
} from 'lucide-react';
import type { UserGroup } from '@/types/user.types';

function getInitials(name?: string) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AdminGroupsPage() {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupSearch, setGroupSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Group Create/Edit Modal State
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [groupForm, setGroupForm] = useState<CreateGroupPayload>({
    name: '',
    code: '',
    description: '',
    planIds: [],
    isActive: true,
  });

  // Add Member Modal State
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Delete Group State
  const [deletingGroup, setDeletingGroup] = useState<UserGroup | null>(null);

  // Member pagination: 10/page
  const [memberPage, setMemberPage] = useState(1);
  const memberPageSize = 10;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch All Groups
  const {
    data: groups = [],
    isLoading: isLoadingGroups,
    refetch: refetchGroups,
  } = useQuery({
    queryKey: ['admin-groups-list'],
    queryFn: () => adminGroupsApi.getAll(),
  });

  // Automatically select the first group if none selected
  useEffect(() => {
    if (groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  // 2. Fetch Selected Group Details (with members and plans)
  const {
    data: selectedGroupDetails,
    isLoading: isLoadingSelectedGroup,
    refetch: refetchSelectedGroup,
  } = useQuery({
    queryKey: ['admin-group-detail', selectedGroupId],
    queryFn: () => (selectedGroupId ? adminGroupsApi.getById(selectedGroupId) : null),
    enabled: Boolean(selectedGroupId),
  });

  // 3. Fetch All Plans for assignment
  const { data: plansData = [] } = useQuery({
    queryKey: ['admin-groups-plans'],
    queryFn: () => entitlementsAdminApi.getPlans(),
  });
  const plans = (plansData as any[]) || [];

  // 4. Fetch All Users for adding members
  const { data: usersData } = useQuery({
    queryKey: ['admin-groups-all-users'],
    queryFn: () => usersAdminApi.getUsers({ limit: 100 }),
  });
  const allUsers = (usersData?.items as any[]) || [];

  // Filter Groups List (Left side)
  const filteredGroups = useMemo(() => {
    if (!groupSearch.trim()) return groups;
    const q = groupSearch.toLowerCase();
    return groups.filter(
      (g) => g.name.toLowerCase().includes(q) || g.code.toLowerCase().includes(q)
    );
  }, [groups, groupSearch]);

  // Active Group object
  const activeGroup = useMemo(() => {
    return groups.find((g) => g.id === selectedGroupId) || null;
  }, [groups, selectedGroupId]);

  // Members of selected group
  const groupMembers = useMemo(() => {
    if (!selectedGroupDetails) return [];
    const members = (selectedGroupDetails as any).members || [];
    return members.map((m: any) => m.user || m);
  }, [selectedGroupDetails]);

  // Filtered members in selected group (Right side)
  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return groupMembers;
    const q = memberSearch.toLowerCase();
    return groupMembers.filter(
      (u: any) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q)
    );
  }, [groupMembers, memberSearch]);

  useEffect(() => {
    setMemberPage(1);
  }, [selectedGroupId, memberSearch]);

  const memberTotalPages = Math.ceil(filteredMembers.length / memberPageSize) || 1;
  const paginatedMembers = useMemo(() => {
    const start = (memberPage - 1) * memberPageSize;
    return filteredMembers.slice(start, start + memberPageSize);
  }, [filteredMembers, memberPage, memberPageSize]);

  // Available users to add (exclude users already in this group)
  const availableUsersToAdd = useMemo(() => {
    const currentMemberIds = new Set(groupMembers.map((m: any) => m.id));
    let list = allUsers.filter((u: any) => !currentMemberIds.has(u.id));
    if (userSearchTerm.trim()) {
      const q = userSearchTerm.toLowerCase();
      list = list.filter(
        (u: any) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allUsers, groupMembers, userSearchTerm]);

  // Handlers for Group Modal
  const handleOpenCreateGroup = () => {
    setEditingGroup(null);
    setGroupForm({
      name: '',
      code: '',
      description: '',
      planIds: [],
      isActive: true,
    });
    setGroupModalOpen(true);
  };

  const handleOpenEditGroup = (group: UserGroup) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      code: group.code,
      description: group.description || '',
      planIds: group.planIds || [],
      isActive: group.isActive,
    });
    setGroupModalOpen(true);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
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
        const created = await adminGroupsApi.create({
          name: groupForm.name,
          code: groupForm.code.toUpperCase(),
          description: groupForm.description,
          planIds: groupForm.planIds,
          isActive: groupForm.isActive,
        });
        showToast(`New group "${groupForm.name}" created.`);
        if (created?.id) setSelectedGroupId(created.id);
      }
      await refetchGroups();
      if (selectedGroupId) await refetchSelectedGroup();
      setGroupModalOpen(false);
    } catch {
      showToast('Failed to save user group.');
    }
  };

  const handleDeleteGroup = async () => {
    if (!deletingGroup) return;
    try {
      await adminGroupsApi.delete(deletingGroup.id);
      showToast(`Group "${deletingGroup.name}" deleted.`);
      setDeletingGroup(null);
      if (selectedGroupId === deletingGroup.id) {
        setSelectedGroupId(null);
      }
      await refetchGroups();
    } catch {
      showToast('Failed to delete group.');
    }
  };

  // Handlers for Members
  const handleAddMember = async () => {
    if (!selectedGroupId || !selectedUserToAdd) return;
    try {
      await adminGroupsApi.addMember(selectedGroupId, selectedUserToAdd);
      showToast('User successfully added to group.');
      setSelectedUserToAdd('');
      setAddMemberModalOpen(false);
      await refetchSelectedGroup();
      await refetchGroups();
    } catch {
      showToast('Failed to add user to group.');
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!selectedGroupId) return;
    try {
      await adminGroupsApi.removeMember(selectedGroupId, userId);
      showToast(`Removed "${userName}" from group.`);
      await refetchSelectedGroup();
      await refetchGroups();
    } catch {
      showToast('Failed to remove member.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 p-3 px-4 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="size-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-primary/10 text-primary">
              <Shield className="size-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              User Groups
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Organize users into permission groups and assign collective membership plans.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleOpenCreateGroup}
            className="text-xs font-semibold gap-1.5 bg-primary text-primary-foreground shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Create Group</span>
          </Button>
        </div>
      </div>

      {/* ── SPLIT VIEW CONTAINER (2 TABLES SIDE-BY-SIDE) ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT PANEL (~35% - 4 cols): User Groups List ────────────────── */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Shield className="size-4 text-primary" />
              Groups Directory ({groups.length})
            </h2>
          </div>

          {/* Search Groups */}
          <div className="relative">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
              placeholder="Search groups by name or code..."
              className="h-9 pl-9 text-xs bg-card"
            />
          </div>

          {/* Groups Cards List */}
          <div className="space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {isLoadingGroups ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                <RefreshCw className="size-4 animate-spin mx-auto mb-2 text-primary" />
                Loading groups...
              </div>
            ) : filteredGroups.length === 0 ? (
              <Card className="p-6 text-center text-xs text-muted-foreground border-dashed">
                No user groups found.
              </Card>
            ) : (
              filteredGroups.map((g) => {
                const isSelected = g.id === selectedGroupId;
                const memberCount = g.memberIds?.length ?? 0;
                const planCount = g.planIds?.length ?? 0;

                return (
                  <div
                    key={g.id}
                    onClick={() => setSelectedGroupId(g.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary/30'
                        : 'border-border bg-card hover:border-border/80 hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-foreground truncate">
                            {g.name}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                            {g.code}
                          </Badge>
                          {g.isActive ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-rose-500 font-medium">
                              <span className="size-1.5 rounded-full bg-rose-500" />
                              Disabled
                            </span>
                          )}
                        </div>

                        {g.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {g.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
                          <span className="flex items-center gap-1">
                            <Users className="size-3 text-primary" />
                            <strong>{memberCount}</strong> members
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <CreditCard className="size-3 text-indigo-500" />
                            <strong>{planCount}</strong> plans
                          </span>
                        </div>
                      </div>

                      {/* Group action buttons */}
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenEditGroup(g)}
                          className="size-7 text-muted-foreground hover:text-foreground"
                          title="Edit group"
                        >
                          <Edit className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeletingGroup(g)}
                          className="size-7 text-muted-foreground hover:text-destructive"
                          title="Delete group"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL (~65% - 7 cols): Members in Selected Group ───────── */}
        <div className="lg:col-span-7 space-y-4">
          {activeGroup ? (
            <div className="border border-border rounded-2xl bg-card overflow-hidden shadow-xs">
              {/* Active Group Header */}
              <div className="p-5 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-foreground truncate">
                      {activeGroup.name}
                    </h2>
                    <Badge variant="outline" className="font-mono text-xs font-semibold">
                      {activeGroup.code}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activeGroup.description || 'No description provided for this group.'}
                  </p>

                  {/* Assigned Plans badge list */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground mr-1">Assigned Plans:</span>
                    {activeGroup.planIds && activeGroup.planIds.length > 0 ? (
                      activeGroup.planIds.map((pid) => {
                        const planObj = plans.find((p) => p.id === pid);
                        return (
                          <Badge key={pid} variant="secondary" className="text-[10px] font-sans font-medium px-2 py-0 bg-primary/10 text-primary border-primary/20">
                            {planObj?.name || pid}
                          </Badge>
                        );
                      })
                    ) : (
                      <span className="text-[11px] text-muted-foreground italic">None (free defaults)</span>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => {
                    setUserSearchTerm('');
                    setSelectedUserToAdd('');
                    setAddMemberModalOpen(true);
                  }}
                  className="text-xs font-semibold gap-1.5 bg-primary text-primary-foreground shadow-xs shrink-0 self-start sm:self-center"
                >
                  <UserPlus className="size-3.5" />
                  <span>Add Member</span>
                </Button>
              </div>

              {/* Members Search Bar */}
              <div className="p-3 border-b border-border flex items-center justify-between gap-3 bg-card">
                <div className="relative flex-1 max-w-sm">
                  <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search members in group..."
                    className="h-8 pl-8 text-xs bg-muted/30"
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  Total: <strong>{filteredMembers.length}</strong> user(s)
                </span>
              </div>

              {/* Members Table */}
              <div className="overflow-x-auto">
                {isLoadingSelectedGroup ? (
                  <div className="p-12 text-center text-xs text-muted-foreground">
                    <RefreshCw className="size-4 animate-spin mx-auto mb-2 text-primary" />
                    Loading group members...
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="p-12 text-center space-y-2">
                    <p className="text-xs text-muted-foreground">
                      No members assigned to this group yet.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAddMemberModalOpen(true)}
                      className="text-xs gap-1"
                    >
                      <UserPlus className="size-3" />
                      Add first member
                    </Button>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border text-[11px] font-semibold text-muted-foreground bg-muted/40 uppercase tracking-wider">
                        <th className="py-2.5 px-4">User</th>
                        <th className="py-2.5 px-4">Contact</th>
                        <th className="py-2.5 px-4">Role</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs">
                      {paginatedMembers.map((user: any) => (
                        <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="size-7 border border-border shrink-0">
                                <AvatarImage src={user.avatarUrl || undefined} />
                                <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                                  {getInitials(user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground truncate">{user.name}</p>
                                <p className="text-[11px] text-muted-foreground truncate">{user.email || 'No email'}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-muted-foreground text-[11px] font-mono">
                            {user.phone ? (
                              <span className="flex items-center gap-1">
                                <Phone className="size-3" />
                                {user.phone.startsWith('google_') ? '(OAuth User)' : user.phone}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <Badge variant="outline" className="text-[10px] uppercase font-sans font-semibold">
                              {user.role}
                            </Badge>
                          </td>

                          <td className="py-3 px-4">
                            {user.isActive ? (
                              <span className="text-[11px] text-emerald-500 font-medium">Active</span>
                            ) : (
                              <span className="text-[11px] text-rose-500 font-medium">Suspended</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveMember(user.id, user.name)}
                              className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-2"
                              title="Remove from group"
                            >
                              <UserMinus className="size-3.5" />
                              <span className="hidden sm:inline ml-1">Remove</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Members Pagination */}
              {filteredMembers.length > 0 && (
                <DataTablePagination
                  page={memberPage}
                  totalPages={memberTotalPages}
                  totalItems={filteredMembers.length}
                  itemName="members"
                  onPageChange={setMemberPage}
                />
              )}
            </div>
          ) : (
            <Card className="p-16 text-center text-xs text-muted-foreground border-dashed">
              Select a group on the left to view and manage its members.
            </Card>
          )}
        </div>
      </div>

      {/* ── CREATE / EDIT GROUP MODAL ───────────────────────────────────────── */}
      <Dialog open={groupModalOpen} onOpenChange={setGroupModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Shield className="size-4 text-primary" />
              {editingGroup ? `Edit Group: ${editingGroup.name}` : 'Create New User Group'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define group metadata and associate collective membership plans.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveGroup} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Group Name *</label>
              <Input
                required
                placeholder="e.g. VIP Enterprise Scholars"
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Group Code * (Uppercase Identifier)</label>
              <Input
                required
                placeholder="e.g. VIP_SCHOLARS"
                value={groupForm.code}
                onChange={(e) => setGroupForm({ ...groupForm, code: e.target.value.toUpperCase() })}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Description</label>
              <Textarea
                rows={2}
                placeholder="Describe the purpose or target students of this group..."
                value={groupForm.description}
                onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                className="text-xs"
              />
            </div>

            {/* Plan Assignments Checkboxes */}
            <div className="space-y-1.5 pt-1">
              <label className="font-semibold text-foreground flex items-center gap-1">
                <CreditCard className="size-3 text-primary" />
                Assign Membership Plans
              </label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 rounded-lg border border-border bg-muted/20">
                {plans.map((p) => {
                  const isChecked = groupForm.planIds?.includes(p.id);
                  return (
                    <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer hover:text-primary">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const current = groupForm.planIds || [];
                          const updated = e.target.checked
                            ? [...current, p.id]
                            : current.filter((id) => id !== p.id);
                          setGroupForm({ ...groupForm, planIds: updated });
                        }}
                        className="rounded border-border text-primary focus:ring-primary size-3.5"
                      />
                      <span className="font-medium text-foreground">{p.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">({p.code})</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setGroupModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs font-semibold bg-primary text-primary-foreground"
              >
                {editingGroup ? 'Save Changes' : 'Create Group'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── ADD MEMBER MODAL ─────────────────────────────────────────────────── */}
      <Dialog open={addMemberModalOpen} onOpenChange={setAddMemberModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <UserPlus className="size-4 text-primary" />
              Add Member to {activeGroup?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select an account to add to this group. Members automatically inherit the group's assigned plans.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="relative">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Search candidates by name or email..."
                className="h-8 pl-8 text-xs"
              />
            </div>

            <div className="space-y-1 max-h-56 overflow-y-auto border border-border rounded-lg p-1 divide-y divide-border/50">
              {availableUsersToAdd.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-xs">
                  No eligible candidates found.
                </div>
              ) : (
                availableUsersToAdd.map((u) => {
                  const isSelected = selectedUserToAdd === u.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => setSelectedUserToAdd(u.id)}
                      className={`p-2 rounded-md flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="size-6 shrink-0">
                          <AvatarFallback className="text-[9px]">
                            {getInitials(u.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{u.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{u.email || u.phone}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[9px] uppercase font-sans shrink-0">
                        {u.role}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddMemberModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!selectedUserToAdd}
                onClick={handleAddMember}
                className="text-xs font-semibold bg-primary text-primary-foreground"
              >
                Confirm Add
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── DELETE GROUP CONFIRMATION MODAL ──────────────────────────────────── */}
      {deletingGroup && (
        <Dialog open={Boolean(deletingGroup)} onOpenChange={(open) => !open && setDeletingGroup(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
                <Trash2 className="size-4" />
                Delete User Group
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground pt-1">
                Are you sure you want to delete group <strong>"{deletingGroup.name}"</strong>? Group members will lose the collective entitlements associated with this group.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingGroup(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDeleteGroup}
                className="text-xs font-semibold"
              >
                Delete Group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
