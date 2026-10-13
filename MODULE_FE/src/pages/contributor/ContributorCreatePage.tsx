import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { seriesApi } from '@/features/lab/api/series.api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FolderTree, Layers, Code2, ArrowRight, CheckCircle2 } from 'lucide-react';

export function ContributorCreatePage() {
  const navigate = useNavigate();
  const [activeType, setActiveType] = useState<'series' | 'topic' | 'lab'>('series');

  // Series form state
  const [seriesTitle, setSeriesTitle] = useState('');
  const [seriesDesc, setSeriesDesc] = useState('');
  const [seriesTopic, setSeriesTopic] = useState('testing');
  const [seriesLevel, setSeriesLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [isProOnly, setIsProOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCreateSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesTitle.trim()) return;

    setSubmitting(true);
    try {
      await seriesApi.create({
        title: seriesTitle,
        description: seriesDesc || 'Practice series description',
        category: seriesTopic,
        level: seriesLevel,
        isProOnly,
      });
      setSuccessMsg(`Created draft series "${seriesTitle}"!`);
      setTimeout(() => {
        navigate('/contributor/series');
      }, 1000);
    } catch {
      setSuccessMsg('Failed to create series. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Create New Content
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Select content type to author. All newly authored content begins in <code>Draft</code> status.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 px-4 rounded-lg bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="size-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Choice Type Selector */}
      <div className="grid grid-cols-3 gap-3">
        <Card
          onClick={() => setActiveType('series')}
          className={`cursor-pointer border-border transition-all p-4 flex flex-col items-center text-center gap-2 ${
            activeType === 'series'
              ? 'border-primary ring-1 ring-primary bg-primary/5'
              : 'hover:border-border/80 bg-card'
          }`}
        >
          <Layers className="size-5 text-primary" />
          <div>
            <h3 className="text-xs font-bold text-foreground">New Series</h3>
            <p className="text-[10px] text-muted-foreground">Lesson sequence</p>
          </div>
        </Card>

        <Card
          onClick={() => setActiveType('lab')}
          className={`cursor-pointer border-border transition-all p-4 flex flex-col items-center text-center gap-2 ${
            activeType === 'lab'
              ? 'border-primary ring-1 ring-primary bg-primary/5'
              : 'hover:border-border/80 bg-card'
          }`}
        >
          <Code2 className="size-5 text-primary" />
          <div>
            <h3 className="text-xs font-bold text-foreground">New Lab</h3>
            <p className="text-[10px] text-muted-foreground">Code &amp; evaluation</p>
          </div>
        </Card>

        <Card
          onClick={() => setActiveType('topic')}
          className={`cursor-pointer border-border transition-all p-4 flex flex-col items-center text-center gap-2 ${
            activeType === 'topic'
              ? 'border-primary ring-1 ring-primary bg-primary/5'
              : 'hover:border-border/80 bg-card'
          }`}
        >
          <FolderTree className="size-5 text-primary" />
          <div>
            <h3 className="text-xs font-bold text-foreground">New Topic</h3>
            <p className="text-[10px] text-muted-foreground">Domain category</p>
          </div>
        </Card>
      </div>

      {/* Form Details */}
      {activeType === 'series' && (
        <Card className="border-border bg-card p-6">
          <form onSubmit={handleCreateSeries} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Series Title:</label>
              <Input
                value={seriesTitle}
                onChange={(e) => setSeriesTitle(e.target.value)}
                placeholder="e.g. Automated Testing with Playwright..."
                className="text-xs bg-background"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Summary Description:</label>
              <Textarea
                value={seriesDesc}
                onChange={(e) => setSeriesDesc(e.target.value)}
                placeholder="Describe key learning outcomes students will achieve..."
                className="text-xs bg-background min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Topic:</label>
                <select
                  value={seriesTopic}
                  onChange={(e) => setSeriesTopic(e.target.value)}
                  className="w-full h-9 px-2.5 text-xs bg-background border border-border rounded-lg text-foreground font-medium"
                >
                  <option value="testing">Tester &amp; QA</option>
                  <option value="sql">Database &amp; SQL</option>
                  <option value="backend">Backend &amp; API</option>
                  <option value="docker">DevOps &amp; Docker</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Difficulty:</label>
                <select
                  value={seriesLevel}
                  onChange={(e) => setSeriesLevel(e.target.value as any)}
                  className="w-full h-9 px-2.5 text-xs bg-background border border-border rounded-lg text-foreground font-medium"
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
                id="isProOnly"
                checked={isProOnly}
                onChange={(e) => setIsProOnly(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary size-4"
              />
              <label htmlFor="isProOnly" className="text-xs text-foreground cursor-pointer font-medium">
                Require PRO account to access labs in this series
              </label>
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate('/contributor')}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="text-xs font-bold">
                {submitting ? 'Creating...' : 'Create Draft Series'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeType === 'lab' && (
        <Card className="border-border bg-card p-6 text-center space-y-4">
          <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto text-primary">
            <Code2 className="size-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Create Interactive Lab in Lab Studio</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
              Launch full-screen Lab Studio with Monaco editor, Markdown instructions, and automated test script evaluator.
            </p>
          </div>
          <Link to="/admin/labs/new">
            <Button size="sm" className="text-xs font-bold gap-1.5 shadow-xs">
              Launch Lab Studio Now <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </Card>
      )}

      {activeType === 'topic' && (
        <Card className="border-border bg-card p-6 text-center space-y-3">
          <FolderTree className="size-6 mx-auto text-primary" />
          <h3 className="text-sm font-bold text-foreground">Manage Topic Taxonomy</h3>
          <p className="text-xs text-muted-foreground">
            You can manage or create topics directly within the content studio.
          </p>
          <Link to="/contributor/topics">
            <Button size="sm" variant="outline" className="text-xs">
              View Topic Catalog
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
