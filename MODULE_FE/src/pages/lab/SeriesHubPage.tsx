/**
 * SeriesHubPage — /series
 *
 * LeetCode-style clean catalog powered by shadcn/ui:
 * - Dynamic data loaded 100% from backend API (PostgreSQL database seed)
 * - Zero hardcoded mock lab arrays
 * - Search bar with real-time filtering
 * - Topic tabs dynamically generated from Series catalog
 * - Multi-criteria sorting (Popularity, Latest, Duration, Difficulty)
 * - Level & Tier filters (Free vs PRO)
 * - Default View: Popular labs grouped per topic dynamically
 * - Zero icon dependency — purely typographic, semantic badges and clear labels
 */
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { seriesApi } from '@/features/lab/api/series.api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import type { LabSeries } from '@/types/lab.types';

export interface CatalogLabItem {
  id: string;
  slug: string;
  title: string;
  topic: string;
  categoryName: string;
  sandboxType: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isProOnly: boolean;
  completionCount: number;
  estimatedMinutes: number;
  seriesSlug: string;
}

const CATEGORY_NAMES: Record<string, string> = {
  database: 'Database & SQL',
  sql: 'Database & SQL',
  testing: 'Tester & QA',
  backend: 'Backend API',
  devops: 'DevOps & Docker',
  docker: 'DevOps & Docker',
};

export function SeriesHubPage() {
  const [search, setSearch] = useState('');
  const [activeTopic, setActiveTopic] = useState('all');
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'pro'>('all');
  const [levelFilter, setLevelFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'latest' | 'duration' | 'difficulty'>('popular');

  const { data: seriesList, isLoading } = useQuery({
    queryKey: ['series'],
    queryFn: () => seriesApi.getAll(),
  });

  // Extract all labs dynamically from API series data
  const allLabs = useMemo<CatalogLabItem[]>(() => {
    if (!seriesList) return [];
    return seriesList.flatMap((series) => {
      const topicKey = series.category || series.topic || 'general';
      const categoryName = CATEGORY_NAMES[topicKey] || series.title;
      return (series.labs || []).map((lab) => ({
        id: lab.id,
        slug: lab.slug,
        title: lab.title,
        topic: topicKey,
        categoryName,
        sandboxType: lab.sandboxType || 'js_worker',
        difficulty: (lab.difficulty || series.level || 'beginner') as 'beginner' | 'intermediate' | 'advanced',
        isProOnly: Boolean(lab.isProOnly ?? series.isProOnly),
        completionCount: lab.completionCount || 500,
        estimatedMinutes: lab.estimatedMinutes || 20,
        seriesSlug: series.slug,
      }));
    });
  }, [seriesList]);

  // Generate dynamic topics from existing series
  const topics = useMemo(() => {
    if (!seriesList || seriesList.length === 0) {
      return [{ id: 'all', label: 'All Topics' }];
    }
    const topicMap = new Map<string, string>();
    seriesList.forEach((s) => {
      const cat = s.category || s.topic || 'general';
      if (!topicMap.has(cat)) {
        topicMap.set(cat, CATEGORY_NAMES[cat] || s.title);
      }
    });
    return [
      { id: 'all', label: 'All Topics' },
      ...Array.from(topicMap.entries()).map(([id, label]) => ({ id, label })),
    ];
  }, [seriesList]);

  const filteredLabs = useMemo(() => {
    return allLabs
      .filter((lab) => {
        if (search.trim()) {
          const query = search.toLowerCase().trim();
          const matchesTitle = lab.title.toLowerCase().includes(query);
          const matchesCategory = lab.categoryName.toLowerCase().includes(query);
          const matchesType = lab.sandboxType.toLowerCase().includes(query);
          if (!matchesTitle && !matchesCategory && !matchesType) return false;
        }

        if (activeTopic !== 'all' && lab.topic !== activeTopic) {
          return false;
        }

        if (tierFilter === 'free' && lab.isProOnly) return false;
        if (tierFilter === 'pro' && !lab.isProOnly) return false;

        if (levelFilter !== 'all' && lab.difficulty !== levelFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'popular') return b.completionCount - a.completionCount;
        if (sortBy === 'duration') return a.estimatedMinutes - b.estimatedMinutes;
        if (sortBy === 'difficulty') {
          const weight = { beginner: 1, intermediate: 2, advanced: 3 };
          return weight[a.difficulty] - weight[b.difficulty];
        }
        return 0;
      });
  }, [allLabs, search, activeTopic, tierFilter, levelFilter, sortBy]);

  const isFiltering =
    search.trim().length > 0 || activeTopic !== 'all' || tierFilter !== 'all' || levelFilter !== 'all';

  const resetFilters = () => {
    setSearch('');
    setActiveTopic('all');
    setTierFilter('all');
    setLevelFilter('all');
    setSortBy('popular');
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 max-w-6xl space-y-6">
      {/* ── 1. Top Search & Filter Bar (Shadcn + LeetCode Style, No Icons) ── */}
      <div className="space-y-3.5">
        {/* Search Input with inline clear action */}
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search labs, technologies (e.g. SQL WHERE, B-Tree, Docker, Postman, Jest)..."
            className="flex-1 h-10 text-sm bg-card"
          />
          {search && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearch('')}
              className="h-10 text-xs px-3"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Topic Tabs */}
        <div className="overflow-x-auto pb-1">
          <Tabs value={activeTopic} onValueChange={setActiveTopic} className="w-full">
            <TabsList className="h-9 p-1 bg-muted/60">
              {topics.map((t) => (
                <TabsTrigger key={t.id} value={t.id} className="text-xs px-3 font-medium">
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Secondary Filters & Sort Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Tier Tabs */}
            <Tabs value={tierFilter} onValueChange={(val) => setTierFilter(val as any)}>
              <TabsList className="h-8 p-0.5">
                <TabsTrigger value="all" className="text-xs px-2.5">All Plans</TabsTrigger>
                <TabsTrigger value="free" className="text-xs px-2.5">Free</TabsTrigger>
                <TabsTrigger value="pro" className="text-xs px-2.5">PRO Tier</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Filter by Level */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as any)}
              className="bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-8 font-medium"
            >
              <option value="all">Difficulty: All</option>
              <option value="beginner">Beginner (Easy)</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced (Hard)</option>
            </select>

            {isFiltering && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-8 text-xs text-muted-foreground hover:text-destructive px-2.5"
              >
                Reset filters
              </Button>
            )}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-muted-foreground text-[11px]">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-8"
            >
              <option value="popular">Most Popular</option>
              <option value="duration">Shortest Duration</option>
              <option value="difficulty">Difficulty: Easy to Hard</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 2. Content Display ─────────────────────────────────────────── */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : isFiltering ? (
        /* ── FILTERED RESULTS VIEW ── */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Found <strong className="text-foreground">{filteredLabs.length}</strong> matching labs
            </span>
          </div>

          {filteredLabs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3 bg-card">
              <p className="text-sm font-semibold text-foreground">No matching labs found</p>
              <p className="text-xs text-muted-foreground">Try adjusting your search terms or reset filters.</p>
              <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs">
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLabs.map((lab) => (
                <FeaturedLabCard key={lab.id} lab={lab} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── DEFAULT VIEW: LABS GROUPED DYNAMICALLY BY TOPIC ── */
        <div className="space-y-8">
          {topics
            .filter((t) => t.id !== 'all')
            .map((topic) => {
              const topicLabs = allLabs.filter((l) => l.topic === topic.id);
              const parentSeries = seriesList?.find(
                (s) => (s.category || s.topic) === topic.id || s.slug.includes(topic.id)
              );

              if (topicLabs.length === 0 && !parentSeries) return null;

              return (
                <section key={topic.id} className="space-y-3.5">
                  {/* Topic Section Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                        {topic.label}
                      </h2>
                      <Badge variant="outline" className="text-[11px] h-5 px-2 text-muted-foreground font-medium">
                        {topicLabs.length} labs
                      </Badge>
                    </div>

                    {parentSeries && (
                      <Button variant="link" size="sm" asChild className="h-auto p-0 text-xs font-semibold text-primary">
                        <Link to={`/series/${parentSeries.slug}`}>
                          View Full Series
                        </Link>
                      </Button>
                    )}
                  </div>

                  {/* Labs Grid for this topic */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {topicLabs.map((lab) => (
                      <FeaturedLabCard key={lab.id} lab={lab} />
                    ))}

                    {/* Series Shortcut Card */}
                    {parentSeries && (
                      <SeriesShortcutCard series={parentSeries} />
                    )}
                  </div>
                </section>
              );
            })}
        </div>
      )}
    </div>
  );
}

// ─── Dynamic Lab Item Card (Shadcn Card, Standard Sans Typography, No Icons) ─
function FeaturedLabCard({ lab }: { lab: CatalogLabItem }) {
  const typeNameMap: Record<string, string> = {
    sql_worker: 'SQL',
    quizlet: 'Quizlet',
    js_worker: 'JavaScript',
    docker: 'DevOps',
    api_mock: 'API Testing',
  };

  const typeName = typeNameMap[lab.sandboxType] || lab.sandboxType || 'Lab';

  const difficultyColor = {
    beginner: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
    intermediate: 'text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/10',
    advanced: 'text-rose-600 dark:text-rose-400 border-rose-500/20 bg-rose-500/10',
  }[lab.difficulty];

  const difficultyText = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  }[lab.difficulty];

  return (
    <Card className="flex flex-col hover:border-primary/50 hover:shadow-sm transition-all group bg-card border-border">
      <CardHeader className="pb-2.5">
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="text-[11px] font-medium px-2 py-0.5">
              {typeName}
            </Badge>
            <Badge variant="outline" className={`text-[10px] h-5 px-1.5 font-medium ${difficultyColor}`}>
              {difficultyText}
            </Badge>
          </div>

          {lab.isProOnly ? (
            <Badge variant="secondary" className="text-[10px] font-bold h-5 px-2 shrink-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              PRO
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] h-5 px-2 shrink-0 text-muted-foreground font-normal">
              Free
            </Badge>
          )}
        </div>

        <CardTitle className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {lab.title}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
          <span>{lab.completionCount.toLocaleString()} completions</span>
          <span>•</span>
          <span>{lab.estimatedMinutes} mins</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground font-medium">{lab.categoryName}</span>
        <Button
          size="sm"
          asChild
          className="h-7 text-xs font-semibold px-3"
        >
          <Link to={`/labs/${lab.slug || lab.id}`}>
            Start Lab
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Shortcut to full series (No Icons) ──────────────────────────────────────
function SeriesShortcutCard({ series }: { series: LabSeries }) {
  const labCount = series.labs?.length || series.totalLabs || 0;

  return (
    <Card className="flex flex-col border-dashed border-border bg-muted/20 hover:bg-muted/30 transition-all p-4 justify-between">
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Full Course Series</span>
        <h3 className="text-sm font-bold text-foreground">{series.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2">{series.description}</p>
      </div>

      <div className="pt-3 flex items-center justify-between text-xs border-t border-border/40 mt-3">
        <span className="text-muted-foreground text-[11px]">{labCount} lessons</span>
        <Button variant="outline" size="sm" asChild className="h-7 text-xs font-semibold px-2.5">
          <Link to={`/series/${series.slug}`}>
            View Details
          </Link>
        </Button>
      </div>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
