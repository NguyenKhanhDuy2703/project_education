/**
 * AdminTopicsTab — Course Series / Topics management tab
 */
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Folder, ExternalLink } from 'lucide-react';
import type { LabSeries } from '@/types/lab.types';

interface AdminTopicsTabProps {
  isLoading: boolean;
  filteredSeries: LabSeries[];
  onCreateSeries: () => void;
  onEditSeries: (s: LabSeries) => void;
  onDeleteSeries: (id: string, title: string) => void;
}

export function AdminTopicsTab({
  isLoading,
  filteredSeries,
  onCreateSeries,
  onEditSeries,
  onDeleteSeries,
}: AdminTopicsTabProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-44 rounded-xl border border-border bg-card/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (filteredSeries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3 bg-card/30">
        <p className="text-sm font-semibold text-foreground">No Topics Found</p>
        <p className="text-xs text-muted-foreground">Get started by creating your first course topic.</p>
        <Button onClick={onCreateSeries} size="sm" className="text-xs font-bold">
          + Create First Topic
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {filteredSeries.map((s) => (
        <div
          key={s.id}
          className="rounded-xl border border-border bg-card p-5 hover:border-primary/50 transition-all flex flex-col justify-between shadow-xs group"
        >
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary">
                <Folder className="size-4" />
              </div>
              <div className="flex items-center gap-1.5">
                {s.isProOnly && (
                  <Badge variant="secondary" className="border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 text-[10px] font-bold">
                    PRO
                  </Badge>
                )}
                <Badge variant="outline" className="capitalize text-[10px] font-medium">
                  {s.category || s.topic || 'General'}
                </Badge>
              </div>
            </div>

            <h3 className="font-bold text-foreground text-base mt-3 line-clamp-1 group-hover:text-primary transition-colors">
              {s.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
              {s.description}
            </p>
            <p className="text-[11px] font-mono text-muted-foreground/60 mt-2">
              /{s.slug}
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              {s.totalLabs ?? (s as any)._count?.labs ?? 0} labs
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-7 text-xs px-2 text-primary hover:text-primary gap-1"
              >
                <Link to={`/series/${s.slug}`} target="_blank">
                  View <ExternalLink className="size-3" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditSeries(s)}
                className="h-7 text-xs px-2"
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteSeries(s.id, s.title)}
                className="h-7 text-xs px-2 text-destructive hover:bg-destructive/10"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
