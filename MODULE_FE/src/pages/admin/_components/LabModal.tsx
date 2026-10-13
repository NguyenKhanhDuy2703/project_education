/**
 * LabModal — Admin Lab Studio Builder
 *
 * Form builder for labs supporting:
 * - General Info & Metadata
 * - Markdown Rich Editor with live preview
 * - Exercise Builder by Sandbox: SQL schema & sample data, Quizlet questions, or JS worker code
 *
 * Powered by shadcn/ui components (Button, Badge, Tabs), zero icons.
 */
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CreateLabInput, QuizQuestion } from '@/types/lab.types';
import { renderMarkdown } from '../_utils/renderMarkdown';

interface LabModalProps {
  open: boolean;
  onClose: () => void;
  editingLabId: string | null;
  form: CreateLabInput;
  setForm: (form: CreateLabInput) => void;
  onSubmit: (e: React.FormEvent) => void;
  onApplyPreset: (type: 'js' | 'sql' | 'quizlet' | 'blog') => void;
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

  const quizQuestions: QuizQuestion[] = form.quizQuestions || [];

  const handleAddQuizQuestion = () => {
    const newQ: QuizQuestion = {
      id: `q-${Date.now()}`,
      question: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      explanation: '',
    };
    setForm({ ...form, quizQuestions: [...quizQuestions, newQ] });
  };

  const handleUpdateQuizQuestion = (index: number, updated: Partial<QuizQuestion>) => {
    const next = [...quizQuestions];
    next[index] = { ...next[index], ...updated };
    setForm({ ...form, quizQuestions: next });
  };

  const handleUpdateQuizOption = (qIndex: number, optIndex: number, val: string) => {
    const next = [...quizQuestions];
    const opts = [...next[qIndex].options];
    opts[optIndex] = val;
    next[qIndex].options = opts;
    setForm({ ...form, quizQuestions: next });
  };

  const handleRemoveQuizQuestion = (index: number) => {
    const next = quizQuestions.filter((_, i) => i !== index);
    setForm({ ...form, quizQuestions: next });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-4xl p-6 space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header & Presets */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {editingLabId ? 'Edit Practice Lab / Article' : 'Create New Practice Lab (Studio Builder)'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Author rich Markdown theory instructions and configure interactive coding exercises.
            </p>
          </div>

          {!editingLabId && (
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              <span className="text-[11px] text-muted-foreground mr-1">Insert Template:</span>
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs px-2.5 font-mono" onClick={() => onApplyPreset('sql')}>
                SQL
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs px-2.5 font-mono" onClick={() => onApplyPreset('quizlet')}>
                Quizlet
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs px-2.5 font-mono" onClick={() => onApplyPreset('js')}>
                JS Code
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs px-2.5 font-mono" onClick={() => onApplyPreset('blog')}>
                Blog
              </Button>
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* ── 1. GENERAL INFO ────────────────────────────────────────── */}
          <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/15">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              1. General Lab Information
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-8">
                <label className="text-xs font-semibold text-foreground">Lab Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Filter VIP Customers with SQL WHERE"
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="text-xs font-semibold text-foreground">Exercise Type</label>
                <select
                  value={form.sandboxType}
                  onChange={(e) => setForm({ ...form, sandboxType: e.target.value })}
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                >
                  <option value="sql_worker">SQL Code (Database Sandbox)</option>
                  <option value="quizlet">Quizlet Assessment (Multiple Choice)</option>
                  <option value="js_worker">JavaScript Code (Web Worker)</option>
                  <option value="markdown_only">Theory Article (Markdown Only)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="text-xs font-semibold text-foreground">Estimated Duration (Minutes)</label>
                <input
                  type="number"
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value, 10) || 20 })}
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Order Index</label>
                <input
                  type="number"
                  value={form.orderIndex}
                  onChange={(e) => setForm({ ...form, orderIndex: parseInt(e.target.value, 10) || 1 })}
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="lab-pro-check"
                  checked={form.isProOnly}
                  onChange={(e) => setForm({ ...form, isProOnly: e.target.checked })}
                  className="rounded text-primary focus:ring-primary size-4"
                />
                <label htmlFor="lab-pro-check" className="text-xs font-semibold text-foreground cursor-pointer flex items-center gap-1.5">
                  Require PRO Tier <Badge variant="secondary" className="text-[10px] font-bold h-4.5 px-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/20">PRO</Badge>
                </label>
              </div>
            </div>
          </div>

          {/* ── 2. INSTRUCTIONS & THEORY (MARKDOWN) ─────────────────────────── */}
          <div className="space-y-2 p-4 rounded-xl border border-border bg-muted/15">
            <div className="flex items-center justify-between pb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                2. Theory &amp; Challenge Instructions (Markdown Rich Editor) *
              </label>

              <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as any)}>
                <TabsList className="h-7 p-0.5">
                  <TabsTrigger value="edit" className="text-xs px-2.5">
                    Write
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="text-xs px-2.5">
                    Preview
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {previewTab === 'edit' ? (
              <textarea
                required
                rows={7}
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                placeholder="# 1. Concepts...&#10;&#10;## Exercise Requirements..."
                className="w-full font-mono text-xs bg-background border border-border rounded-lg p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
              />
            ) : (
              <div
                className="w-full min-h-[170px] max-h-[250px] overflow-y-auto bg-card border border-border rounded-lg p-4 prose prose-sm dark:prose-invert max-w-none text-foreground"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(form.instructions) }}
              />
            )}
          </div>

          {/* ── 3. EXERCISE CONFIGURATION ───────────────────────────── */}
          <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/15">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              3. Exercise Configuration ({form.sandboxType})
            </div>

            {/* A. SQL PRACTICE BUILDER */}
            {form.sandboxType === 'sql_worker' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Initial Schema &amp; Seed Data (CREATE TABLE &amp; INSERT)
                  </label>
                  <textarea
                    rows={3}
                    value={form.sqlSchema || ''}
                    onChange={(e) => setForm({ ...form, sqlSchema: e.target.value })}
                    placeholder="CREATE TABLE customers (id INT, full_name VARCHAR, total_spent DECIMAL);&#10;INSERT INTO customers VALUES (1, 'Alice Smith', 1500000);"
                    className="w-full mt-1 font-mono text-xs bg-background border border-border rounded-lg p-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Starter Code (Initial Snippet)</label>
                  <textarea
                    rows={2}
                    value={form.initialSnippet || ''}
                    onChange={(e) => setForm({ ...form, initialSnippet: e.target.value })}
                    placeholder="SELECT id, full_name, total_spent FROM customers WHERE ...;"
                    className="w-full mt-1 font-mono text-xs bg-background border border-border rounded-lg p-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Model Solution</label>
                  <textarea
                    rows={2}
                    value={form.solution || ''}
                    onChange={(e) => setForm({ ...form, solution: e.target.value })}
                    placeholder="SELECT id, full_name, total_spent FROM customers WHERE total_spent > 1000000 ORDER BY total_spent DESC;"
                    className="w-full mt-1 font-mono text-xs bg-background border border-border rounded-lg p-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            {/* B. QUIZLET BUILDER */}
            {form.sandboxType === 'quizlet' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Create multiple-choice questions (A/B/C/D). Learners receive instant scoring and explanations.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddQuizQuestion}
                    className="h-7 text-xs font-semibold"
                  >
                    + Add Question
                  </Button>
                </div>

                {quizQuestions.length === 0 ? (
                  <div className="p-4 border border-dashed border-border rounded-xl text-center text-xs text-muted-foreground space-y-2">
                    <p>No quiz questions added yet.</p>
                    <Button type="button" size="sm" variant="ghost" onClick={handleAddQuizQuestion} className="text-xs font-semibold">
                      + Click to add first question
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quizQuestions.map((q, qIndex) => (
                      <div key={q.id || qIndex} className="p-3.5 rounded-xl border border-border bg-card space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-foreground">
                            Question {qIndex + 1}:
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveQuizQuestion(qIndex)}
                            className="h-6 text-xs text-destructive hover:bg-destructive/10 px-2"
                          >
                            Delete Question
                          </Button>
                        </div>

                        <input
                          type="text"
                          required
                          value={q.question}
                          onChange={(e) => handleUpdateQuizQuestion(qIndex, { question: e.target.value })}
                          placeholder="e.g. Which index type is default in PostgreSQL?"
                          className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-1.5">
                              <input
                                type="radio"
                                name={`correct-${qIndex}`}
                                checked={q.correctIndex === optIndex}
                                onChange={() => handleUpdateQuizQuestion(qIndex, { correctIndex: optIndex })}
                                className="size-3.5 text-primary"
                                title="Mark as correct answer"
                              />
                              <span className="text-[11px] font-mono text-muted-foreground w-4">
                                {String.fromCharCode(65 + optIndex)}.
                              </span>
                              <input
                                type="text"
                                required
                                value={opt}
                                onChange={(e) => handleUpdateQuizOption(qIndex, optIndex, e.target.value)}
                                placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                className="flex-1 bg-background border border-border rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                          ))}
                        </div>

                        {/* Explanation */}
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground">Explanation for correct answer:</label>
                          <input
                            type="text"
                            value={q.explanation || ''}
                            onChange={(e) => handleUpdateQuizQuestion(qIndex, { explanation: e.target.value })}
                            placeholder="Explain why this answer is correct..."
                            className="w-full mt-1 bg-background border border-border rounded-md px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* C. JAVASCRIPT BUILDER */}
            {form.sandboxType === 'js_worker' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Initial Snippet (Starter Code)</label>
                  <textarea
                    rows={2}
                    value={form.initialSnippet || ''}
                    onChange={(e) => setForm({ ...form, initialSnippet: e.target.value })}
                    placeholder="function solve() { ... }"
                    className="w-full mt-1 font-mono text-xs bg-background border border-border rounded-lg p-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Automated Test Script (assert)</label>
                  <textarea
                    rows={2}
                    value={form.testScript || ''}
                    onChange={(e) => setForm({ ...form, testScript: e.target.value })}
                    placeholder="assert('Test 1', solve() === true);"
                    className="w-full mt-1 font-mono text-xs bg-background border border-border rounded-lg p-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Reference Solution</label>
                  <textarea
                    rows={2}
                    value={form.solution || ''}
                    onChange={(e) => setForm({ ...form, solution: e.target.value })}
                    placeholder="function solve() { return true; }"
                    className="w-full mt-1 font-mono text-xs bg-background border border-border rounded-lg p-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            {/* D. BLOG ONLY */}
            {form.sandboxType === 'markdown_only' && (
              <div className="p-3 bg-muted/40 rounded-xl text-xs text-muted-foreground">
                Article-only mode: Students read the material and mark as completed without running code.
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="ghost" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="text-xs font-bold shadow-xs">
              {editingLabId ? 'Save Changes' : 'Publish New Lab'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
