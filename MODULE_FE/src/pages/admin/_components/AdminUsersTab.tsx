import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAdminApi, type AdminUserItem } from '@/features/admin/api/users.admin.api';
import type { UserRole } from '@/types/user.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import { UserEntitlementsModal } from './UserEntitlementsModal';

export function AdminUsersTab() {
  const qc = useQueryClient();
  const [managingUserId, setManagingUserId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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
        limit: 15,
      }),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      usersAdminApi.updateRole(userId, role),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      showFeedback(`User role successfully updated to ${variables.role.toUpperCase()}`);
    },
    onError: () => {
      showFeedback('Failed to update user role', 'error');
    },
  });

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
    onError: () => {
      showFeedback('Failed to update account status', 'error');
    },
  });

  const users = data?.items ?? [];
  const meta = data?.meta;

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-red-500/10 text-red-500 border border-red-500/20 gap-1 font-semibold">
            <ShieldAlert className="size-3" /> Admin
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
                users.map((u: AdminUserItem) => (
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

                    {/* Role & Quick Upgrade Dropdown */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getRoleBadge(u.role)}
                        <select
                          value={u.role}
                          disabled={roleMutation.isPending}
                          onChange={(e) =>
                            roleMutation.mutate({
                              userId: u.id,
                              role: e.target.value as UserRole,
                            })
                          }
                          className="text-xs py-1 px-2 bg-background border border-border rounded-md text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="user">Assign: Student</option>
                          <option value="userPro">Assign: Pro Member ⭐</option>
                          <option value="admin">Assign: Administrator 🛡️</option>
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
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setManagingUserId(u.id)}
                          className="text-xs gap-1 text-primary hover:bg-primary/10 border-primary/20"
                        >
                          <ShieldCheck className="size-3.5" /> Plan &amp; Entitlements
                        </Button>

                        {u.isActive ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={statusMutation.isPending}
                            onClick={() =>
                              statusMutation.mutate({ userId: u.id, isActive: false })
                            }
                            className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 gap-1"
                          >
                            <Lock className="size-3.5" /> Suspend
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={statusMutation.isPending}
                            onClick={() =>
                              statusMutation.mutate({ userId: u.id, isActive: true })
                            }
                            className="text-xs text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 gap-1"
                          >
                            <Unlock className="size-3.5" /> Activate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Showing page <strong>{meta.page}</strong> / {meta.totalPages} (Total{' '}
              <strong>{meta.total}</strong> users)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* User Entitlements & Overrides Modal */}
      <UserEntitlementsModal
        userId={managingUserId}
        onClose={() => setManagingUserId(null)}
      />
    </div>
  );
}
