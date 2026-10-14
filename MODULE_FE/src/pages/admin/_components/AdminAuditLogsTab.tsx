import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  RotateCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Ban,
  Layers,
  Info,
} from 'lucide-react';
import {
  entitlementsAdminApi,
  type AuditLogItem,
} from '@/features/admin/api/entitlements.admin.api';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

/**
 * Helper to render color-coded badge for audit actions.
 */
function ActionBadge({ action }: { action: string }) {
  if (action === 'FEATURE_OVERRIDE_DENY') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
        <Ban className="size-3" />
        {action}
      </span>
    );
  }
  if (action === 'FEATURE_OVERRIDE_ALLOW') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
        <ShieldCheck className="size-3" />
        {action}
      </span>
    );
  }
  if (action.includes('SUBSCRIPTION')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
        <Layers className="size-3" />
        {action}
      </span>
    );
  }
  if (action.includes('PLAN')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-500 border border-violet-500/20">
        <Layers className="size-3" />
        {action}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
      <ShieldAlert className="size-3" />
      {action}
    </span>
  );
}

export function AdminAuditLogsTab() {
  const [page, setPage] = useState<number>(1);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const limit = 10;

  const {
    data: auditData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-audit-logs', page, selectedAction],
    queryFn: () =>
      entitlementsAdminApi.getAuditLogs({
        page,
        limit,
        action: selectedAction || undefined,
      }),
  });

  const logs = auditData?.items || [];
  const meta = auditData?.meta || { total: 0, page: 1, limit: 15, totalPages: 1 };

  // Client-side filtering by actor or target user keyword if entered
  const filteredLogs = logs.filter((log) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const actorMatch =
      log.actor.name.toLowerCase().includes(q) ||
      (log.actor.email && log.actor.email.toLowerCase().includes(q));
    const targetMatch =
      log.targetUser &&
      (log.targetUser.name.toLowerCase().includes(q) ||
        (log.targetUser.email && log.targetUser.email.toLowerCase().includes(q)));
    const actionMatch = log.action.toLowerCase().includes(q);
    return actorMatch || targetMatch || actionMatch;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <FileText className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Security &amp; Action Audit Trail</h2>
            <p className="text-xs text-muted-foreground">
              Immutable ledger of administrative actions, plan assignments, and feature overrides.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Actions</option>
            <option value="ASSIGN_SUBSCRIPTION">ASSIGN_SUBSCRIPTION</option>
            <option value="FEATURE_OVERRIDE_ALLOW">FEATURE_OVERRIDE_ALLOW</option>
            <option value="FEATURE_OVERRIDE_DENY">FEATURE_OVERRIDE_DENY</option>
            <option value="REMOVE_FEATURE_OVERRIDE">REMOVE_FEATURE_OVERRIDE</option>
            <option value="CREATE_PLAN">CREATE_PLAN</option>
            <option value="UPDATE_PLAN_FEATURES">UPDATE_PLAN_FEATURES</option>
            <option value="CREATE_FEATURE">CREATE_FEATURE</option>
          </select>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter actor or target user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-48 sm:w-56"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted border border-border rounded-lg transition-colors"
            title="Refresh logs"
          >
            <RotateCw className={`size-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-medium text-muted-foreground">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Target User</th>
                <th className="py-3 px-4">Reason / Notes</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-normal">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <div className="inline-flex items-center gap-2">
                      <RotateCw className="size-4 animate-spin text-primary" />
                      <span>Loading audit trail...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No audit logs recorded for this criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const reason =
                    log.details?.reason ||
                    log.details?.notes ||
                    (log.details?.featureCode
                      ? `Feature: ${log.details.featureCode}`
                      : 'N/A');

                  return (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <ActionBadge action={log.action} />
                      </td>

                      {/* Actor */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">
                          {log.actor.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {log.actor.email || log.actor.role}
                        </div>
                      </td>

                      {/* Target User */}
                      <td className="py-3 px-4">
                        {log.targetUser ? (
                          <div>
                            <div className="font-semibold text-foreground">
                              {log.targetUser.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono">
                              {log.targetUser.email || log.targetUser.id.slice(0, 8)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Platform</span>
                        )}
                      </td>

                      {/* Reason */}
                      <td className="py-3 px-4 text-foreground/80 max-w-xs truncate" title={reason}>
                        {reason}
                      </td>

                      {/* Details View */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-muted hover:bg-muted/80 text-foreground transition-colors"
                        >
                          <Info className="size-3" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <DataTablePagination
          page={meta.page}
          totalPages={meta.totalPages}
          totalItems={meta.total}
          itemName="logs"
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* Snapshot Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <ActionBadge action={selectedLog.action} />
                <h3 className="font-bold text-sm text-foreground">Audit Snapshot</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-muted/40 rounded-lg">
                <span className="text-muted-foreground block text-[11px]">Actor</span>
                <span className="font-semibold text-foreground">{selectedLog.actor.name}</span>
                <span className="block text-muted-foreground text-[10px]">{selectedLog.actor.id}</span>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg">
                <span className="text-muted-foreground block text-[11px]">Target User</span>
                <span className="font-semibold text-foreground">
                  {selectedLog.targetUser ? selectedLog.targetUser.name : 'System / Global'}
                </span>
                <span className="block text-muted-foreground text-[10px]">
                  {selectedLog.targetUserId || 'N/A'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Snapshot Details (JSON)</span>
              <pre className="p-3 bg-muted/60 border border-border rounded-lg text-xs font-mono overflow-auto max-h-48 text-foreground">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border text-[11px] text-muted-foreground">
              <span>IP: {selectedLog.ipAddress || 'Internal'}</span>
              <span>{new Date(selectedLog.createdAt).toUTCString()}</span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
