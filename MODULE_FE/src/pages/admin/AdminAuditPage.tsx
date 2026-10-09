import { AdminAuditLogsTab } from './_components/AdminAuditLogsTab';
import { FileText } from 'lucide-react';

export function AdminAuditPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-primary/10 text-primary">
              <FileText className="size-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Security &amp; Action Audit Trail
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Tamper-resistant audit ledger capturing all administrative changes, subscription assignments, and overrides.
          </p>
        </div>
      </div>

      {/* Audit Logs Component */}
      <AdminAuditLogsTab />
    </div>
  );
}
