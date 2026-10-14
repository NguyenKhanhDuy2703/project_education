import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import {
  closeCreateDialog,
  addOptimisticSeries,
} from '@/stores/slices/contributor.slice';
import { seriesApi } from '@/features/lab/api/series.api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Layers, Code2, ArrowRight, CheckCircle2, Tag } from 'lucide-react';
import { getSystemTopicTags, type TopicTag } from '@/services/topicTags.service';

export function CreateContentDialog() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);
  const { isCreateDialogOpen, createDialogDefaultType } = useAppSelector(
    (state) => state.contributor
  );

  const [activeTab, setActiveTab] = useState<'series' | 'lab'>('series');
  const [systemTags, setSystemTags] = useState<TopicTag[]>(() => getSystemTopicTags());

  useEffect(() => {
    const handleUpdate = () => setSystemTags(getSystemTopicTags());
    window.addEventListener('studyweb:topic-tags-updated', handleUpdate);
    return () => window.removeEventListener('studyweb:topic-tags-updated', handleUpdate);
  }, []);

  // Series form state
  const [seriesTitle, setSeriesTitle] = useState('');
  const [seriesDesc, setSeriesDesc] = useState('');
  const [seriesTopic, setSeriesTopic] = useState('testing');
  const [seriesLevel, setSeriesLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [isProOnly, setIsProOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (createDialogDefaultType) {
      setActiveTab(createDialogDefaultType);
    }
  }, [createDialogDefaultType]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      dispatch(closeCreateDialog());
      setSuccessMsg(null);
    }
  };

  const handleCreateSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesTitle.trim()) return;

    setIsSubmitting(true);
    setSuccessMsg(null);

    // Create temporary optimistic object
    const tempId = `temp-${Date.now()}`;
    const optimisticSeries: any = {
      id: tempId,
      slug: seriesTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      title: seriesTitle.trim(),
      description: seriesDesc.trim() || 'New draft series',
      category: seriesTopic,
      level: seriesLevel,
      isProOnly,
      status: 'draft',
      authorId: user?.id,
      totalLabs: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Optimistic Update in Redux
    dispatch(addOptimisticSeries(optimisticSeries));

    // 2. Optimistic Update in TanStack Query Cache
    queryClient.setQueryData(
      ['contributor-my-series', user?.id],
      (old: any[] | undefined) => [optimisticSeries, ...(old || [])]
    );

    try {
      // 3. Save to Backend
      const saved = await seriesApi.create({
        title: seriesTitle.trim(),
        description: seriesDesc.trim() || 'New draft series',
        category: seriesTopic,
        level: seriesLevel,
        isProOnly,
      });

      // Replace optimistic item with server result
      dispatch(addOptimisticSeries(saved));
      queryClient.setQueryData(
        ['contributor-my-series', user?.id],
        (old: any[] | undefined) =>
          (old || []).map((item) => (item.id === tempId ? saved : item))
      );
      queryClient.invalidateQueries({ queryKey: ['contributor-my-series'] });

      setSuccessMsg(`Created series "${seriesTitle}" successfully!`);
      setTimeout(() => {
        dispatch(closeCreateDialog());
        // Reset form
        setSeriesTitle('');
        setSeriesDesc('');
        setSuccessMsg(null);
      }, 700);
    } catch (err: any) {
      console.error('Failed to create series:', err);
      // Revert cache on error
      queryClient.invalidateQueries({ queryKey: ['contributor-my-series'] });
      setSuccessMsg('Error creating series. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isCreateDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-6 border-border bg-card">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg font-bold text-foreground">
            Create Content
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Author new learning modules. All initial submissions are saved as <code>Draft</code>.
          </DialogDescription>
        </DialogHeader>

        {successMsg && (
          <div className="p-3 px-3.5 rounded-lg bg-emerald-600/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 mb-4 h-9 bg-muted/60 p-1">
            <TabsTrigger value="series" className="text-xs gap-1.5 font-semibold">
              <Layers className="size-3.5" />
              <span>Series</span>
            </TabsTrigger>
            <TabsTrigger value="lab" className="text-xs gap-1.5 font-semibold">
              <Code2 className="size-3.5" />
              <span>Practice Lab</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: NEW SERIES */}
          <TabsContent value="series">
            <form onSubmit={handleCreateSeries} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Series Title <span className="text-destructive">*</span>
                </label>
                <Input
                  value={seriesTitle}
                  onChange={(e) => setSeriesTitle(e.target.value)}
                  placeholder="e.g. Modern PostgreSQL & Query Optimization..."
                  className="text-xs h-9 bg-background"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Description
                </label>
                <Textarea
                  value={seriesDesc}
                  onChange={(e) => setSeriesDesc(e.target.value)}
                  placeholder="Short overview of key outcomes and practice skills..."
                  className="text-xs bg-background min-h-[75px]"
                />
              </div>

              {/* Topic Category Tags Chip Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Tag className="size-3.5 text-primary" />
                    <span>Gắn Thẻ Topic (Topic Tag) *</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground font-mono">Quản lý bởi Admin</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {systemTags.map((tag) => {
                    const isSelected = seriesTopic === tag.key;
                    return (
                      <button
                        key={tag.key}
                        type="button"
                        onClick={() => setSeriesTopic(tag.key)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? `${tag.tagColor} ring-2 ring-primary ring-offset-1 font-bold shadow-xs`
                            : 'border-border bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        }`}
                      >
                        <span className="size-1.5 rounded-full bg-current opacity-80" />
                        <span>{tag.title}</span>
                        {isSelected && <span className="text-[10px] ml-0.5">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Difficulty Level
                  </label>
                  <select
                    value={seriesLevel}
                    onChange={(e) => setSeriesLevel(e.target.value as any)}
                    className="w-full h-9 px-2.5 text-xs bg-background border border-border rounded-md text-foreground font-medium outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="dialogIsProOnly"
                  checked={isProOnly}
                  onChange={(e) => setIsProOnly(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary size-4"
                />
                <label
                  htmlFor="dialogIsProOnly"
                  className="text-xs text-foreground cursor-pointer font-medium"
                >
                  Require PRO membership for this series
                </label>
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => dispatch(closeCreateDialog())}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !seriesTitle.trim()}
                  className="text-xs font-bold"
                >
                  {isSubmitting ? 'Creating...' : 'Create Draft Series'}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* TAB 2: NEW LAB */}
          <TabsContent value="lab">
            <div className="p-4 border border-border rounded-lg bg-muted/20 space-y-3 text-center">
              <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Code2 className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Launch Interactive Lab Studio
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Full 2-step authoring wizard: Step 1 Theory &amp; Guidelines (split markdown editor) and Step 2 Exercise Builder (JS / SQL / Quizlet).
                </p>
              </div>
              <Button
                size="sm"
                className="text-xs font-bold gap-1.5 shadow-sm"
                onClick={() => {
                  dispatch(closeCreateDialog());
                  navigate('/contributor/labs/new');
                }}
              >
                <span>Launch Lab Studio</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
