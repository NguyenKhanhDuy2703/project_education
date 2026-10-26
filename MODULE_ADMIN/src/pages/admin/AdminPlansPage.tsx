import { useState } from 'react';
import { CreditCard, Inbox, Settings } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AdminPlansTab } from './_components/AdminPlansTab';
import { AdminBillingSettingsTab } from './_components/AdminBillingSettingsTab';
import { AdminUpgradeRequestsTab } from './_components/AdminUpgradeRequestsTab';

export function AdminPlansPage() {
  const [activeTab, setActiveTab] = useState<'plans' | 'queue' | 'settings'>('plans');

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
              Plans & Billing Management
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Quản lý gói cước Pro, đối soát hàng đợi chuyển khoản ngân hàng và cấu hình thông tin mở bán.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="space-y-6">
        <TabsList className="grid w-full sm:w-[500px] grid-cols-3">
          <TabsTrigger value="plans" className="text-xs gap-1.5">
            <CreditCard className="size-3.5" />
            <span>Gói cước & Quyền</span>
          </TabsTrigger>
          <TabsTrigger value="queue" className="text-xs gap-1.5">
            <Inbox className="size-3.5" />
            <span>Hàng đợi nâng cấp</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs gap-1.5">
            <Settings className="size-3.5" />
            <span>Cấu hình & Mở bán</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="m-0">
          <AdminPlansTab />
        </TabsContent>

        <TabsContent value="queue" className="m-0">
          <AdminUpgradeRequestsTab />
        </TabsContent>

        <TabsContent value="settings" className="m-0">
          <AdminBillingSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
