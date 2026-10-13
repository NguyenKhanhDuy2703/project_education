/**
 * AdminLabsTab — Quản lý danh sách Bài thực hành (Labs) trong Series
 *
 * Chỉ đơn giản: xem danh sách, thêm bài lab mới và sửa bài lab (kèm bài tập).
 * Zero icons, styled with shadcn/ui.
 */
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { LabSeries } from '@/types/lab.types';

interface AdminLabsTabProps {
  isLoading: boolean;
  seriesList: LabSeries[];
  activeSeries: LabSeries | undefined;
  filteredLabs: any[];
  onSelectSeries: (slug: string) => void;
  onCreateLab: () => void;
  onEditLab: (lab: any) => void;
  onDeleteLab: (id: string, title: string) => void;
}

export function AdminLabsTab({
  isLoading,
  seriesList,
  activeSeries,
  filteredLabs,
  onSelectSeries,
  onCreateLab,
  onEditLab,
  onDeleteLab,
}: AdminLabsTabProps) {
  return (
    <div className="space-y-6">
      {/* Series selector bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-foreground">Curriculum Series:</span>
          <select
            value={activeSeries?.slug || ''}
            onChange={(e) => onSelectSeries(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
          >
            {seriesList.map((s) => (
              <option key={s.id} value={s.slug}>
                {s.title} ({s._count?.labs ?? s.labs?.length ?? 0} labs)
              </option>
            ))}
          </select>
        </div>

        <Button
          onClick={onCreateLab}
          size="sm"
          className="text-xs font-bold px-3 shadow-xs"
        >
          + Add New Lab
        </Button>
      </div>

      {/* Labs Table */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading practice labs...</p>
      ) : filteredLabs.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-xl p-8 bg-card space-y-3">
          <p className="text-muted-foreground text-sm font-medium">No practice labs found in this series.</p>
          <Button
            onClick={onCreateLab}
            className="text-xs font-bold"
          >
            + Create First Lab
          </Button>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden bg-card shadow-xs">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Lab Title</th>
                <th className="py-3 px-4">Sandbox Type</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Access Tier</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLabs.map((lab: any, idx: number) => (
                <tr key={lab.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-muted-foreground text-xs">{idx + 1}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-foreground">{lab.title}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">/{lab.slug}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant="outline" className="font-mono text-[11px] uppercase">
                      {lab.sandboxType === 'sql_worker'
                        ? 'SQL'
                        : lab.sandboxType === 'quizlet'
                        ? 'Quizlet'
                        : lab.sandboxType === 'markdown_only'
                        ? 'Blog'
                        : 'JavaScript'}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-muted-foreground">
                    {lab.durationMinutes || 20} mins
                  </td>
                  <td className="py-3.5 px-4">
                    {lab.isProOnly ? (
                      <Badge variant="secondary" className="border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 text-[10px] font-bold">
                        PRO
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground text-[10px]">
                        Free
                      </Badge>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="h-7 text-xs px-2.5 font-medium"
                      >
                        <Link to={`/labs/${lab.slug || lab.id}`} target="_blank">
                          Preview
                        </Link>
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onEditLab(lab)}
                        className="h-7 text-xs px-2.5 font-semibold"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteLab(lab.id, lab.title)}
                        className="h-7 text-xs px-2 text-destructive hover:bg-destructive/10"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
