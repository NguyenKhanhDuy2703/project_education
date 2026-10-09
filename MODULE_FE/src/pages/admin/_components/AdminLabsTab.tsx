import { Clock, ExternalLink, Pencil, Trash2, Plus } from 'lucide-react';
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
    <div className="mt-6 space-y-6">
      {/* Topic selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-foreground">Chọn Topic kiến thức:</span>
          <select
            value={activeSeries?.slug || ''}
            onChange={(e) => onSelectSeries(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {seriesList.map((s) => (
              <option key={s.id} value={s.slug}>
                {s.coverEmoji} {s.title} ({s._count?.labs ?? s.labs?.length ?? 0} bài)
              </option>
            ))}
          </select>
        </div>

        <Button onClick={onCreateLab} size="sm" className="gap-2 font-semibold">
          <Plus className="size-4" /> Thêm Bài Thực hành
        </Button>
      </div>

      {/* Labs Table */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải danh sách bài lab...</p>
      ) : filteredLabs.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-xl p-8">
          <p className="text-muted-foreground text-sm">Không tìm thấy bài thực hành hoặc blog nào.</p>
          <Button onClick={onCreateLab} className="mt-4 gap-2">
            <Plus className="size-4" /> Thêm bài đầu tiên
          </Button>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Tiêu đề bài học / Blog</th>
                <th className="py-3 px-4">Loại môi trường</th>
                <th className="py-3 px-4">Thời lượng</th>
                <th className="py-3 px-4">Phân quyền</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
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
                    <Badge variant="outline" className="font-mono text-[11px]">
                      {lab.sandboxType || 'js_worker'}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" /> {lab.durationMinutes || 20}p
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {lab.isProOnly ? (
                      <Badge variant="outline" className="border-amber-500/40 text-amber-500 text-[10px]">
                        Pro Only
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 text-[10px]">
                        Free
                      </Badge>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link to={`/labs/${lab.slug}`} target="_blank">
                        <Button variant="ghost" size="icon-sm" title="Mở trang Workspace làm bài">
                          <ExternalLink className="size-3.5 text-muted-foreground hover:text-foreground" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onEditLab(lab)}
                        title="Sửa nội dung"
                      >
                        <Pencil className="size-3.5 text-muted-foreground hover:text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onDeleteLab(lab.id, lab.title)}
                        title="Xóa bài"
                      >
                        <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
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
