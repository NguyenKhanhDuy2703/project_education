import { Pencil, Trash2, Eye, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    return <p className="text-sm text-muted-foreground">Loading topics...</p>;
  }

  if (filteredSeries.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-xl p-8">
        <p className="text-muted-foreground text-sm">No matching topics found.</p>
        <Button onClick={onCreateSeries} className="mt-4 gap-2">
          <Plus className="size-4" /> Create New Topic
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {filteredSeries.map((s) => (
        <div
          key={s.id}
          className="rounded-xl border border-border bg-card p-5 hover:border-primary/50 transition-all flex flex-col justify-between shadow-sm group"
        >
          <div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-3xl p-2 bg-muted rounded-lg group-hover:scale-110 transition-transform">
                {s.coverEmoji || '🧪'}
              </span>
              <div className="flex items-center gap-1.5">
                {s.isProOnly && (
                  <Badge variant="outline" className="border-amber-500/40 text-amber-500 text-[10px]">
                    PRO
                  </Badge>
                )}
                <Badge variant="secondary" className="capitalize text-[10px]">
                  {s.category || s.topic}
                </Badge>
              </div>
            </div>

            <h3 className="font-semibold text-foreground text-base mt-3 line-clamp-1">{s.title}</h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{s.description}</p>
            <p className="text-[11px] font-mono text-muted-foreground/70 mt-2">slug: {s.slug}</p>
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {s._count?.labs ?? s.labs?.length ?? 0} practice labs
            </span>

            <div className="flex items-center gap-1.5">
              <Link to={`/series/${s.slug}`} target="_blank">
                <Button variant="ghost" size="icon-sm" title="View on site">
                  <Eye className="size-3.5 text-muted-foreground hover:text-foreground" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onEditSeries(s)}
                title="Edit Topic"
              >
                <Pencil className="size-3.5 text-muted-foreground hover:text-primary" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onDeleteSeries(s.id, s.title)}
                title="Delete Topic"
              >
                <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
