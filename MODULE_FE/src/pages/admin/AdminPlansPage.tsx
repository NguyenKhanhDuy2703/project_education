import { useState } from 'react';
import { AdminPlansTab } from './_components/AdminPlansTab';
import { AdminGroupsTab } from './_components/AdminGroupsTab';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CreditCard, Shield, Users } from 'lucide-react';

export function AdminPlansPage() {
  const [activeTab, setActiveTab] = useState<'plans' | 'groups'>('plans');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-primary/10 text-primary">
              <Shield className="size-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              IAM Permissions &amp; Plans Management
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            AWS IAM model: Define feature plans and assign them to User Groups to consolidate effective access permissions.
          </p>
        </div>
      </div>

      {/* Tabs navigation */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
        <TabsList className="h-9 p-1 bg-muted/60">
          <TabsTrigger value="plans" className="text-xs font-semibold px-4 gap-1.5">
            <CreditCard className="size-3.5" />
            1. Membership Plans
          </TabsTrigger>
          <TabsTrigger value="groups" className="text-xs font-semibold px-4 gap-1.5">
            <Users className="size-3.5" />
            2. User Groups (IAM Groups)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-4">
          <AdminPlansTab />
        </TabsContent>

        <TabsContent value="groups" className="mt-4">
          <AdminGroupsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
