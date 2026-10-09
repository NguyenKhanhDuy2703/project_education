import { Layers, Code2, Sparkles } from 'lucide-react';

interface AdminStatsCardsProps {
  totalTopics: number;
  totalLabs: number;
  proTopics: number;
}

export function AdminStatsCards({ totalTopics, totalLabs, proTopics }: AdminStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
      <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tổng số Topics</p>
          <p className="text-2xl font-extrabold text-foreground mt-1">{totalTopics}</p>
        </div>
        <div className="p-3 bg-primary/10 rounded-xl text-primary">
          <Layers className="size-5" />
        </div>
      </div>

      <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tổng số Bài Thực hành</p>
          <p className="text-2xl font-extrabold text-foreground mt-1">{totalLabs}</p>
        </div>
        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
          <Code2 className="size-5" />
        </div>
      </div>

      <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Khóa học Pro</p>
          <p className="text-2xl font-extrabold text-amber-500 mt-1">{proTopics} Topics</p>
        </div>
        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
          <Sparkles className="size-5" />
        </div>
      </div>
    </div>
  );
}
