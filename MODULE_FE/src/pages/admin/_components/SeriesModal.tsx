/**
 * SeriesModal — Create / Edit Topic & Course Series Modal
 */
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CreateSeriesInput, LabSeries } from '@/types/lab.types';

interface SeriesModalProps {
  open: boolean;
  onClose: () => void;
  editingSeries: LabSeries | null;
  form: CreateSeriesInput;
  setForm: (form: CreateSeriesInput) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export function SeriesModal({
  open,
  onClose,
  editingSeries,
  form,
  setForm,
  onSubmit,
  isPending,
}: SeriesModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="space-y-1 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">
              {editingSeries ? 'Edit Topic / Series' : 'Create New Topic / Series'}
            </h2>
            <Badge variant="outline" className="text-[10px] font-mono">
              LEVEL 2
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Create a course topic to group related practice labs and quiz flashcards.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground">Topic / Series Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. SQL Fundamentals for QA Testers"
              className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Slug URL Path (optional)</label>
            <input
              type="text"
              value={form.slug || ''}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="auto-generated-if-empty"
              className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              >
                <option value="testing">QA & Testing</option>
                <option value="database">Database & SQL</option>
                <option value="backend">Backend API</option>
                <option value="devops">DevOps & Cloud</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Difficulty Level</label>
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Topic Badge Code</label>
              <input
                type="text"
                value={form.coverEmoji || ''}
                onChange={(e) => setForm({ ...form, coverEmoji: e.target.value })}
                placeholder="SQL / QA / API"
                className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono uppercase"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Display Order Index</label>
              <input
                type="number"
                value={form.orderIndex}
                onChange={(e) => setForm({ ...form, orderIndex: parseInt(e.target.value, 10) || 0 })}
                className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Series Overview Description *</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the learning objectives and skills covered in this topic..."
              className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="series-pro"
              checked={form.isProOnly}
              onChange={(e) => setForm({ ...form, isProOnly: e.target.checked })}
              className="rounded text-primary focus:ring-primary size-4"
            />
            <label htmlFor="series-pro" className="text-xs text-foreground font-semibold cursor-pointer flex items-center gap-1.5">
              Exclusive to PRO Plan Members
              <Badge variant="secondary" className="text-[10px] font-bold h-4 px-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/20">
                PRO
              </Badge>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending} className="text-xs font-bold shadow-xs">
              {editingSeries ? 'Save Changes' : 'Create Topic'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
