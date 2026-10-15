/**
 * AdminStatsCards — Thẻ thống kê tổng quan trong Admin Studio
 *
 * Zero icons, styled with shadcn/ui.
 */
import { Badge } from '@/components/ui/badge';

interface AdminStatsCardsProps {
  totalTopics: number;
  totalLabs: number;
  proTopics: number;
}

export function AdminStatsCards({ totalTopics, totalLabs, proTopics }: AdminStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
      <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Curriculum Series
          </p>
          <p className="text-2xl font-extrabold text-foreground mt-1">{totalTopics}</p>
        </div>
        <Badge variant="outline" className="font-mono text-xs">
          LEVEL 2
        </Badge>
      </div>

      <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Practice Labs
          </p>
          <p className="text-2xl font-extrabold text-foreground mt-1">{totalLabs}</p>
        </div>
        <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
          LEVEL 3
        </Badge>
      </div>

      <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            PRO Tier Series
          </p>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {proTopics} Series
          </p>
        </div>
        <Badge variant="secondary" className="font-bold text-xs bg-amber-500/10 text-amber-600 border border-amber-500/20">
          PRO
        </Badge>
      </div>
    </div>
  );
}
