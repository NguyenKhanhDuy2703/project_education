import { FileCode2, Database, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CreateLabInput } from '@/types/lab.types';
import { renderMarkdown } from '../_utils/renderMarkdown';

interface LabModalProps {
  open: boolean;
  onClose: () => void;
  editingLabId: string | null;
  form: CreateLabInput;
  setForm: (form: CreateLabInput) => void;
  onSubmit: (e: React.FormEvent) => void;
  onApplyPreset: (type: 'js' | 'sql' | 'blog') => void;
  previewTab: 'edit' | 'preview';
  setPreviewTab: (tab: 'edit' | 'preview') => void;
  isPending: boolean;
}

export function LabModal({
  open,
  onClose,
  editingLabId,
  form,
  setForm,
  onSubmit,
  onApplyPreset,
  previewTab,
  setPreviewTab,
  isPending,
}: LabModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-4xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header & Presets */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">
            {editingLabId ? 'Edit Practice Lab / Lesson' : 'Add New Practice Lab'}
          </h2>

          {!editingLabId && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground mr-1">Quick Templates:</span>
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => onApplyPreset('js')}>
                <FileCode2 className="size-3" /> JS
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => onApplyPreset('sql')}>
                <Database className="size-3" /> SQL
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => onApplyPreset('blog')}>
                <BookOpen className="size-3" /> Blog
              </Button>
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-foreground">Lab / Lesson Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Write a SELECT query to filter active customers"
              className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Meta fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Execution Environment</label>
              <select
                value={form.sandboxType}
                onChange={(e) => setForm({ ...form, sandboxType: e.target.value })}
                className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="js_worker">JavaScript Worker</option>
                <option value="sql_worker">SQL Sandbox</option>
                <option value="markdown_only">Theory Only (Markdown)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Estimated Time (minutes)</label>
              <input
                type="number"
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value, 10) || 20 })}
                className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Display Order</label>
              <input
                type="number"
                value={form.orderIndex}
                onChange={(e) => setForm({ ...form, orderIndex: parseInt(e.target.value, 10) || 1 })}
                className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Instructions with live preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-foreground">
                Theory &amp; Task Instructions (Markdown Supported) *
              </label>
              <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewTab('edit')}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                    previewTab === 'edit'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('preview')}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                    previewTab === 'preview'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            {previewTab === 'edit' ? (
              <textarea
                required
                rows={8}
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                placeholder="# Task instructions..."
                className="w-full font-mono text-xs bg-background border border-border rounded-lg p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            ) : (
              <div
                className="w-full min-h-[190px] max-h-[300px] overflow-y-auto bg-muted/20 border border-border rounded-lg p-4 prose prose-sm dark:prose-invert max-w-none text-foreground"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(form.instructions) }}
              />
            )}
          </div>

          {/* Initial Snippet */}
          {form.sandboxType !== 'markdown_only' && (
            <div>
              <label className="text-xs font-semibold text-foreground">Initial Starter Code</label>
              <textarea
                rows={3}
                value={form.initialSnippet}
                onChange={(e) => setForm({ ...form, initialSnippet: e.target.value })}
                placeholder="function solution() { ... }"
                className="w-full mt-1 font-mono text-xs bg-background border border-border rounded-lg p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          {/* Test script */}
          {form.sandboxType !== 'markdown_only' && (
            <div>
              <label className="text-xs font-semibold text-foreground">Automated Test Script</label>
              <textarea
                rows={3}
                value={form.testScript}
                onChange={(e) => setForm({ ...form, testScript: e.target.value })}
                placeholder="assert('Test case 1', solution() === true);"
                className="w-full mt-1 font-mono text-xs bg-background border border-border rounded-lg p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          {/* Solution */}
          <div>
            <label className="text-xs font-semibold text-foreground">Official Solution (Pro / Admin only)</label>
            <textarea
              rows={2}
              value={form.solution}
              onChange={(e) => setForm({ ...form, solution: e.target.value })}
              placeholder="Reference solution code..."
              className="w-full mt-1 font-mono text-xs bg-background border border-border rounded-lg p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Pro flag */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="lab-pro"
              checked={form.isProOnly}
              onChange={(e) => setForm({ ...form, isProOnly: e.target.checked })}
              className="rounded text-primary focus:ring-primary"
            />
            <label htmlFor="lab-pro" className="text-xs text-foreground font-medium cursor-pointer">
              Pro Lab (Requires Pro subscription to unlock solution & run tests)
            </label>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {editingLabId ? 'Save Lab' : 'Add Lab'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
