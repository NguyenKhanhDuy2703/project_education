import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '@/stores/store';
import {
  usersAdminApi,
  type AdminUserItem,
  type CreateUserInput,
  type UpdateUserInput,
} from '@/features/admin/api/users.admin.api';
import type { UserRole } from '@/types/user.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Crown,
  Lock,
  Unlock,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  UserPlus,
  Edit2,
  Trash2,
  PenTool,
} from 'lucide-react';
import { UserEntitlementsModal } from './UserEntitlementsModal';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

export function AdminUsersTab() {
  const qc = useQueryClient();
  const currentUser = useAppSelector((s) => s.auth.user);

  const [managingUserId, setManagingUserId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUserItem | null>(null);
  const [pendingRoleChange, setPendingRoleChange] = useState<{ user: AdminUserItem; targetRole: UserRole } | null>(null);

  // Forms
  const [createForm, setCreateForm] = useState<CreateUserInput>({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user',
  });

  const [editForm, setEditForm] = useState<UpdateUserInput>({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user',
  });

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-users', { search, roleFilter, statusFilter, page }],
    queryFn: () =>
      usersAdminApi.getUsers({
        search: search.trim() || undefined,
        role: roleFilter === 'all' ? undefined : (roleFilter as UserRole),
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        page,
        limit: 10,
      }),
  });

  // Create User Mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateUserInput) => usersAdminApi.createUser(input),
    onSuccess: (newUser) => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setCreateModalOpen(false);
      setCreateForm({ name: '', email: '', phone: '', password: '', role: 'user' });
      showFeedback(`User "${newUser.name}" created successfully.`);
    },
    onError: (err: any) => {
      showFeedback(err?.response?.data?.message || 'Failed to create user', 'error');
    },
  });

  // Update User Mutation
  const updateMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserInput }) =>
      usersAdminApi.updateUser(userId, data),
    onSuccess: (updatedUser) => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingUser(null);
      showFeedback(`User "${updatedUser.name}" updated successfully.`);
    },
    onError: (err: any) => {
      showFeedback(err?.response?.data?.message || 'Failed to update user', 'error');
    },
  });

  // Delete User Mutation
  const deleteMutation = useMutation({
    mutationFn: (userId: string) => usersAdminApi.deleteUser(userId, true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setDeletingUser(null);
      showFeedback('User account deleted successfully.');
    },
    onError: (err: any) => {
      showFeedback(err?.response?.data?.message || 'Failed to delete user', 'error');
    },
  });

  // Role Mutation
  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      usersAdminApi.updateRole(userId, role),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      showFeedback(`User role successfully updated to ${variables.role.toUpperCase()}`);
    },
    onError: (err: any) => {
      showFeedback(err?.response?.data?.message || 'Failed to update user role', 'error');
    },
  });

  // Status Mutation
  const statusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      usersAdminApi.updateStatus(userId, isActive),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      showFeedback(
        variables.isActive
          ? 'Account activated successfully'
          : 'Account suspended successfully'
      );
    },
    onError: (err: any) => {
      showFeedback(err?.response?.data?.message || 'Failed to update account status', 'error');
    },
  });

  const users = data?.items ?? [];
  const meta = data?.meta;

  const handleOpenEdit = (user: AdminUserItem) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email || '',
      phone: user.phone || '',
      role: user.role,
      password: '',
    });
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-red-500/10 text-red-500 border border-red-500/20 gap-1 font-semibold">
            <ShieldAlert className="size-3" /> Admin
          </Badge>
        );
      case 'contributor':
        return (
          <Badge className="bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 gap-1 font-semibold">
            <PenTool className="size-3" /> Contributor
          </Badge>
        );
      case 'userPro':
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 gap-1 font-semibold">
            <Crown className="size-3" /> Pro Member
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground gap-1">
            <UserCheck className="size-3" /> Student
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback banner */}
      {feedbackMsg && (
        <div
          className={`px-4 py-3 rounded-lg text-sm font-medium border transition-all ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
          }`}
        >
          {feedbackMsg.text}
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, phone number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-medium bg-background border border-border rounded-lg text-foreground focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="user">Student (Free)</option>
            <option value="userPro">Pro Member</option>
            <option value="contributor">Contributor</option>
            <option value="admin">Administrator</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-medium bg-background border border-border rounded-lg text-foreground focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Suspended</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {/* Create User Button */}
          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="gap-1.5 text-xs font-bold shadow-xs bg-primary text-primary-foreground"
          >
            <UserPlus className="size-3.5" />
            + Add New User
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="py-4 px-4 bg-muted/10 h-14" />
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Users className="size-8 mx-auto mb-2 opacity-40" />
                    No users found matching current filters.
                  </td>
                </tr>
              ) : (
                users.map((u: AdminUserItem) => {
                  const isSelf = currentUser?.id === u.id;
                  const isRootAdmin = u.email === 'admin@studyweb.dev';

                  return (
                    <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                      {/* User profile details */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt={u.name}
                              className="size-9 rounded-full object-cover border border-border"
                            />
                          ) : (
                            <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                              {u.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              {u.name}
                              {isSelf && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary font-bold rounded">
                                  You
                                </span>
                              )}
                              {isRootAdmin && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold rounded border border-amber-500/20">
                                  Root Admin
                                </span>
                              )}
                              {u.googleId && (
                                <span
                                  className="text-[10px] px-1.5 py-0.2 bg-muted text-muted-foreground rounded"
                                  title="Authenticated via Google OAuth"
                                >
                                  Google
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="size-3" />
                              {u.email || 'No email registered'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone Number */}
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1 font-mono">
                          <Phone className="size-3" />
                          {u.phone?.startsWith('google_') ? '(OAuth User)' : u.phone}
                        </div>
                      </td>

                      {/* Role & Quick Assign Dropdown */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getRoleBadge(u.role)}
                          <select
                            value={u.role}
                            disabled={roleMutation.isPending || isSelf || isRootAdmin}
                            onChange={(e) =>
                              setPendingRoleChange({
                                user: u,
                                targetRole: e.target.value as UserRole,
                              })
                            }
                            title={
                              isSelf
                                ? 'Cannot demote your own account'
                                : isRootAdmin
                                ? 'Root administrator role is protected'
                                : 'Assign new role'
                            }
                            className="text-xs py-1 px-2 bg-background border border-border rounded-md text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <option value="user">Student</option>
                            <option value="userPro">Pro Member</option>
                            <option value="contributor">Contributor</option>
                            <option value="admin">Administrator</option>
                          </select>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-500 font-medium">
                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-rose-500 font-medium">
                            <span className="size-2 rounded-full bg-rose-500" />
                            Suspended
                          </span>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {new Date(u.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Plan & Entitlements Modal */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setManagingUserId(u.id)}
                            className="h-8 text-xs gap-1 text-primary hover:bg-primary/10 border-primary/20"
                            title="Plans & Permissions"
                          >
                            <ShieldCheck className="size-3.5" /> Plans
                          </Button>

                          {/* Edit User Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(u)}
                            className="h-8 text-xs px-2 text-muted-foreground hover:text-foreground"
                            title="Edit User Details"
                          >
                            <Edit2 className="size-3.5" />
                          </Button>

                          {/* Suspend / Activate Toggle */}
                          {u.isActive ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={statusMutation.isPending || isSelf || isRootAdmin}
                              onClick={() =>
                                statusMutation.mutate({ userId: u.id, isActive: false })
                              }
                              className="h-8 text-xs text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 px-2 disabled:opacity-40"
                              title={isSelf ? 'Cannot suspend yourself' : 'Suspend Account'}
                            >
                              <Lock className="size-3.5" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={statusMutation.isPending}
                              onClick={() =>
                                statusMutation.mutate({ userId: u.id, isActive: true })
                              }
                              className="h-8 text-xs text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 px-2"
                              title="Activate Account"
                            >
                              <Unlock className="size-3.5" />
                            </Button>
                          )}

                          {/* Delete User Button (Soft-delete with Admin Protection) */}
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={deleteMutation.isPending || isSelf || isRootAdmin}
                            onClick={() => setDeletingUser(u)}
                            className="h-8 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 px-2 disabled:opacity-30 disabled:cursor-not-allowed"
                            title={
                              isSelf
                                ? 'Security Violation: Cannot delete your own account'
                                : isRootAdmin
                                ? 'Security Violation: Root Admin is protected'
                                : 'Soft-Delete User'
                            }
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && (
          <DataTablePagination
            page={meta.page}
            totalPages={meta.totalPages}
            totalItems={meta.total}
            itemName="users"
            onPageChange={(p) => setPage(p)}
          />
        )}
      </div>

      {/* ── CREATE USER MODAL ──────────────────────────────────────────────── */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <UserPlus className="size-5 text-primary" />
              Add New User
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Manually create an account with credentials and assign an initial system role.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(createForm);
            }}
            className="space-y-3.5 py-2"
          >
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Full Name *</label>
              <Input
                required
                placeholder="e.g. Nguyen Van B"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Email Address *</label>
              <Input
                type="email"
                required
                placeholder="e.g. user@example.com"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Phone Number *</label>
              <Input
                required
                placeholder="e.g. 0912345678"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Initial Password * (min 8 chars)</label>
              <Input
                type="password"
                required
                minLength={8}
                placeholder="Password123!"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Account Role *</label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
                className="w-full h-9 text-xs px-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="user">Student</option>
                <option value="userPro">Pro Member</option>
                <option value="contributor">Contributor</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending}
                className="text-xs font-bold bg-primary text-primary-foreground"
              >
                {createMutation.isPending ? 'Creating…' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── EDIT USER MODAL ────────────────────────────────────────────────── */}
      <Dialog open={Boolean(editingUser)} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="w-[95vw] sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Edit2 className="size-5 text-primary" />
              Edit User: {editingUser?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update user details, contact information, or reset account password.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingUser) return;
              updateMutation.mutate({
                userId: editingUser.id,
                data: {
                  name: editForm.name,
                  email: editForm.email,
                  phone: editForm.phone,
                  role: editForm.role,
                  password: editForm.password?.trim() ? editForm.password : undefined,
                },
              });
            }}
            className="space-y-3.5 py-2"
          >
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Full Name</label>
              <Input
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Email Address</label>
              <Input
                type="email"
                required
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Phone Number</label>
              <Input
                required
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Account Role</label>
              <select
                value={editForm.role}
                disabled={currentUser?.id === editingUser?.id || editingUser?.email === 'admin@studyweb.dev'}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                className="w-full h-9 text-xs px-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
              >
                <option value="user">Student</option>
                <option value="userPro">Pro Member</option>
                <option value="contributor">Contributor</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Reset Password (Optional — leave empty to keep unchanged)
              </label>
              <Input
                type="password"
                minLength={8}
                placeholder="New password (optional)"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingUser(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={updateMutation.isPending}
                className="text-xs font-bold bg-primary text-primary-foreground"
              >
                {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── DELETE USER DIALOG ────────────── */}
      <Dialog open={Boolean(deletingUser)} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <DialogContent className="w-[95vw] sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" />
              Delete User Account
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
              Are you sure you want to delete user{' '}
              <strong className="text-foreground">{deletingUser?.name}</strong> (
              {deletingUser?.email || deletingUser?.phone})?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive space-y-1 my-2">
            <p className="font-semibold">Notice: Permanent Cleanup</p>
            <p className="text-[11px] leading-relaxed">
              This action will remove the user account, associated group memberships, subscriptions, and personal overrides.
            </p>
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingUser(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={() => deletingUser && deleteMutation.mutate(deletingUser.id)}
              className="text-xs font-bold shadow-xs"
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Confirmation Dialog */}
      <Dialog
        open={Boolean(pendingRoleChange)}
        onOpenChange={(open) => !open && setPendingRoleChange(null)}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <ShieldAlert className="size-5 text-amber-500" />
              <span>Confirm Role Change</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to change the role for user{' '}
              <strong className="text-foreground">{pendingRoleChange?.user.name}</strong> from{' '}
              <Badge variant="outline" className="capitalize text-[10px] mx-1">
                {pendingRoleChange?.user.role}
              </Badge>{' '}
              to{' '}
              <Badge variant="default" className="capitalize text-[10px] mx-1">
                {pendingRoleChange?.targetRole}
              </Badge>?
              This operation immediately modifies security entitlements and permissions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPendingRoleChange(null)}
              disabled={roleMutation.isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={roleMutation.isPending}
              onClick={() => {
                if (pendingRoleChange) {
                  roleMutation.mutate({
                    userId: pendingRoleChange.user.id,
                    role: pendingRoleChange.targetRole,
                  });
                  setPendingRoleChange(null);
                }
              }}
              className="text-xs font-semibold gap-1.5"
            >
              {roleMutation.isPending && <RefreshCw className="size-3.5 animate-spin" />}
              <span>Confirm Change</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Entitlements & Overrides Modal */}
      <UserEntitlementsModal
        userId={managingUserId}
        onClose={() => setManagingUserId(null)}
      />
    </div>
  );
}
