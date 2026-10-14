import { AdminPlansTab } from './_components/AdminPlansTab';
import { CreditCard } from 'lucide-react';

export function AdminPlansPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-primary/10 text-primary">
              <CreditCard className="size-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Plans
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Configure subscription membership tiers, feature access quotas, and pricing plans.
          </p>
        </div>
      </div>

      {/* Plans Content */}
      <AdminPlansTab />
    </div>
  );
}
