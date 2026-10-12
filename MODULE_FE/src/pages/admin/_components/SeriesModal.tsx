import { Button } from '@/components/ui/button';
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
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-foreground">
          {editingSeries ? 'Edit Topic' : 'Create New Topic'}
        </h2>

        <form onSubmit={onSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-foreground">Topic / Series Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. SQL Fundamentals for QA"
              className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="testing">Testing</option>
                <option value="backend">Backend</option>
                <option value="database">Database / SQL</option>
                <option value="devops">DevOps</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Level</label>
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Cover Emoji</label>
              <input
                type="text"
                value={form.coverEmoji}
                onChange={(e) => setForm({ ...form, coverEmoji: e.target.value })}
                placeholder="🧪"
                className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Display Order</label>
              <input
                type="number"
                value={form.orderIndex}
                onChange={(e) => setForm({ ...form, orderIndex: parseInt(e.target.value, 10) || 0 })}
                className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Overview Description *</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of knowledge and skills acquired in this topic..."
              className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="series-pro"
              checked={form.isProOnly}
              onChange={(e) => setForm({ ...form, isProOnly: e.target.checked })}
              className="rounded text-primary focus:ring-primary"
            />
            <label htmlFor="series-pro" className="text-xs text-foreground font-medium cursor-pointer">
              Pro Only Course (Requires Pro Membership)
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {editingSeries ? 'Save Changes' : 'Create Topic'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
