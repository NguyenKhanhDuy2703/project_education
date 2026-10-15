import { AdminUsersTab } from './_components/AdminUsersTab';
import { Users } from 'lucide-react';

export function AdminUsersPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-primary/10 text-primary">
              <Users className="size-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Users
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Manage user accounts, role allocations, access statuses, and permissions.
          </p>
        </div>
      </div>

      {/* Users Management Component */}
      <AdminUsersTab />
    </div>
  );
}
