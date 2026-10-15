/**
 * SeriesHubPage — /series
 *
 * Minimal Luxury Typography-First Catalog powered by shadcn/ui:
 * - Zero Icons: 100% typographic clarity, semantic badges, dots (·), and character arrows (→)
 * - Two distinct, dedicated views (Series Roadmaps vs All Practice Labs)
 * - Sticky 1-row filter bar with real-time 250ms debounced search & keyword highlight
 * - Horizontally scrollable category chips starting with "All Topics"
 * - Compact results bar: Result count on left, sorting dropdown on right
 * - Uniform clickable cards (equal height, 2-line title min-height, PRO-only badge, 1-line footer)
 * - Strict Meta-Blue (#0866FF / bg-primary) styling adherence, fully responsive & dark mode
 */
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { seriesApi } from '@/features/lab/api/series.api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
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
  seriesTitle?: string;
}

const CATEGORY_NAMES: Record<string, string> = {
  database: 'Database & SQL',
  sql: 'Database & SQL',
  testing: 'Tester & QA',
  backend: 'Backend API',
  devops: 'DevOps & Docker',
  docker: 'DevOps & Docker',
};

// ─── Keyword Highlighter Helper ─────────────────────────────────────────────
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query || !query.trim()) return <>{text}</>;
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-primary/20 text-primary font-semibold rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export function SeriesHubPage({ defaultTab }: { defaultTab?: 'series' | 'labs' } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = (searchParams.get('tab') || searchParams.get('view')) as 'series' | 'labs' | null;
  const [catalogView, setCatalogView] = useState<'series' | 'labs'>(
    defaultTab || (urlTab === 'labs' ? 'labs' : 'series')
  );
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTopic, setActiveTopic] = useState('all');
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'pro'>('all');
  const [levelFilter, setLevelFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'latest' | 'duration' | 'difficulty'>('popular');

  // Sync tab if URL changes or defaultTab provided
  useEffect(() => {
    if (urlTab === 'labs' || urlTab === 'series') {
      setCatalogView(urlTab);
    } else if (defaultTab) {
      setCatalogView(defaultTab);
    }
  }, [urlTab, defaultTab]);

  // Debounce search input by 250ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

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
        seriesTitle: series.title,
      }));
    });
  }, [seriesList]);

  // Generate dynamic topics from existing series, starting with "All Topics"
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

  // Filter series for the "series" view using debouncedSearch
  const filteredSeries = useMemo(() => {
    if (!seriesList) return [];
    return seriesList
      .filter((s) => {
        if (debouncedSearch.trim()) {
          const q = debouncedSearch.toLowerCase().trim();
          const matchTitle = s.title.toLowerCase().includes(q);
          const matchDesc = (s.description || '').toLowerCase().includes(q);
          const matchCat = (s.category || s.topic || '').toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchCat) return false;
        }

        const topicKey = s.category || s.topic || 'general';
        if (activeTopic !== 'all' && topicKey !== activeTopic) {
          return false;
        }

        if (tierFilter === 'free' && s.isProOnly) return false;
        if (tierFilter === 'pro' && !s.isProOnly) return false;

        if (levelFilter !== 'all' && s.level !== levelFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'latest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        if (sortBy === 'duration') return (a.estimatedMinutes || 0) - (b.estimatedMinutes || 0);
        if (sortBy === 'difficulty') {
          const weight: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3 };
          return (weight[a.level || 'beginner'] || 1) - (weight[b.level || 'beginner'] || 1);
        }
        // Popular: based on lab count
        return (b.labs?.length || b.totalLabs || 0) - (a.labs?.length || a.totalLabs || 0);
      });
  }, [seriesList, debouncedSearch, activeTopic, tierFilter, levelFilter, sortBy]);

  // Filter labs for the "labs" view using debouncedSearch
  const filteredLabs = useMemo(() => {
    return allLabs
      .filter((lab) => {
        if (debouncedSearch.trim()) {
          const query = debouncedSearch.toLowerCase().trim();
          const matchesTitle = lab.title.toLowerCase().includes(query);
          const matchesCategory = lab.categoryName.toLowerCase().includes(query);
          const matchesType = lab.sandboxType.toLowerCase().includes(query);
          const matchesSeries = (lab.seriesTitle || '').toLowerCase().includes(query);
          if (!matchesTitle && !matchesCategory && !matchesType && !matchesSeries) return false;
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
  }, [allLabs, debouncedSearch, activeTopic, tierFilter, levelFilter, sortBy]);

  const isFiltering =
    search.trim().length > 0 || activeTopic !== 'all' || tierFilter !== 'all' || levelFilter !== 'all';

  const resetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setActiveTopic('all');
    setTierFilter('all');
    setLevelFilter('all');
    setSortBy('popular');
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 max-w-6xl space-y-4">
      {/* ── 1. Top View Switcher Tabs (No Title/Subtitle, Clean Luxury) ─ */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <Tabs
          value={catalogView}
          onValueChange={(v) => {
            const nextTab = v as 'series' | 'labs';
            setCatalogView(nextTab);
            setSearchParams(
              (prev) => {
                prev.set('tab', nextTab);
                return prev;
              },
              { replace: true }
            );
          }}
        >
          <TabsList className="h-9 p-1 bg-muted/60">
            <TabsTrigger
              value="series"
              className="text-xs px-3.5 font-semibold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-2xs"
            >
              Series Catalog ({seriesList?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="labs"
              className="text-xs px-3.5 font-semibold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-2xs"
            >
              Practice Labs ({allLabs.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ── 2. Sticky Filter & Chips Bar ──────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md -mx-4 px-4 sm:-mx-6 sm:px-6 py-3 border-b border-border/50 space-y-2.5">
        {/* Single-row Filter Controls */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          {/* Search Input (Takes majority of width) */}
          <div className="flex-1 min-w-[200px]">
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search series, practice labs, topics…"
              className="h-9 text-xs sm:text-sm bg-card border-border"
            />
          </div>

          {/* Plan Dropdown */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as any)}
            className="h-9 bg-card border border-border rounded-lg px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium shrink-0"
          >
            <option value="all">Plan: All Tiers</option>
            <option value="free">Free Access</option>
            <option value="pro">PRO Tier</option>
          </select>

          {/* Difficulty Dropdown */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as any)}
            className="h-9 bg-card border border-border rounded-lg px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium shrink-0"
          >
            <option value="all">Difficulty: All</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          {/* Reset Filters button (Visible only when filtering) */}
          {isFiltering && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-9 text-xs text-muted-foreground hover:text-destructive px-2.5 shrink-0"
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Category Chips (Horizontal scrollable on mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {topics.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTopic(t.id)}
              className={cn(
                'px-3 py-1 rounded-full text-xs transition-colors shrink-0 whitespace-nowrap cursor-pointer',
                activeTopic === t.id
                  ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. Results Bar (Count on Left, Sort on Right) ─────────────── */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 pb-1">
        <div>
          {catalogView === 'series' ? (
            <span>
              <strong className="text-foreground font-semibold">{filteredSeries.length}</strong> {filteredSeries.length === 1 ? 'series' : 'series'}
            </span>
          ) : (
            <span>
              <strong className="text-foreground font-semibold">{filteredLabs.length}</strong> {filteredLabs.length === 1 ? 'practice lab' : 'practice labs'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-8 bg-card border border-border rounded-lg px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="popular">Most Popular</option>
            <option value="latest">Newest First</option>
            <option value="duration">Duration</option>
            <option value="difficulty">Difficulty</option>
          </select>
        </div>
      </div>

      {/* ── 4. Content Display (Auto-fill Grid, Uniform Heights) ───────── */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : catalogView === 'series' ? (
        /* ── SERIES ROADMAPS VIEW ── */
        <div className="space-y-4">
          {filteredSeries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3 bg-card">
              <p className="text-sm font-semibold text-foreground">No matching series found</p>
              <p className="text-xs text-muted-foreground">Try searching with different keywords or reset your filters.</p>
              <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs">
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSeries.map((series) => (
                <DedicatedSeriesCard
                  key={series.id}
                  series={series}
                  searchQuery={debouncedSearch}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── ALL LABS / PROBLEMSET VIEW ── */
        <div className="space-y-4">
          {filteredLabs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3 bg-card">
              <p className="text-sm font-semibold text-foreground">No matching practice labs found</p>
              <p className="text-xs text-muted-foreground">Try adjusting your search query or reset your filters.</p>
              <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs">
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLabs.map((lab) => (
                <FeaturedLabCard
                  key={lab.id}
                  lab={lab}
                  searchQuery={debouncedSearch}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Dedicated Series Card (Clickable, Uniform Height, Zero Icons) ───────────
function DedicatedSeriesCard({
  series,
  searchQuery,
}: {
  series: LabSeries;
  searchQuery: string;
}) {
  const labCount = series.labs?.length || series.totalLabs || 0;
  const isComingSoon = labCount === 0;
  const estimatedTime = series.estimatedMinutes || (labCount > 0 ? labCount * 20 : 0);

  const topicKey = series.category || series.topic || 'general';
  const categoryName = CATEGORY_NAMES[topicKey] || series.title;

  const levelText = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  }[series.level || 'beginner'];

  return (
    <Link
      to={isComingSoon ? '#' : `/series/${series.slug}`}
      className={cn(
        'group flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-all h-full',
        isComingSoon
          ? 'opacity-60 cursor-not-allowed pointer-events-none'
          : 'hover:border-primary/50 hover:shadow-sm cursor-pointer'
      )}
    >
      <div className="space-y-2.5">
        {/* Top category label & PRO-only badge */}
        <div className="flex items-center justify-between text-[11px] gap-2">
          <span className="font-semibold uppercase tracking-wider text-muted-foreground truncate">
            {categoryName}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {isComingSoon && (
              <Badge
                variant="outline"
                className="text-[10px] font-semibold text-muted-foreground bg-muted/40 border-border"
              >
                Coming Soon
              </Badge>
            )}
            {series.isProOnly && (
              <Badge
                variant="secondary"
                className="text-[10px] font-bold h-4 px-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
              >
                PRO
              </Badge>
            )}
          </div>
        </div>

        {/* Title: 2 lines max with fixed min-height for uniform grid alignment */}
        <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2 min-h-[2.75rem] group-hover:text-primary transition-colors">
          <HighlightText text={series.title} query={searchQuery} />
        </h3>

        {/* Description: 2 lines max */}
        <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem] leading-relaxed">
          <HighlightText text={series.description || ''} query={searchQuery} />
        </p>
      </div>

      {/* Footer 1 line: "3 labs · 60 mins · Beginner" + "→" */}
      <div className="pt-3.5 mt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
        {isComingSoon ? (
          <span className="text-amber-600 dark:text-amber-400 font-medium">0 labs · Coming Soon</span>
        ) : (
          <span>
            {labCount} {labCount === 1 ? 'lab' : 'labs'} · {estimatedTime} mins · {levelText}
          </span>
        )}
        {!isComingSoon && (
          <span className="text-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform font-bold text-sm">
            →
          </span>
        )}
      </div>
    </Link>
  );
}

// ─── Dedicated Lab Card (Clickable, Uniform Height, Zero Icons) ──────────────
function FeaturedLabCard({
  lab,
  searchQuery,
}: {
  lab: CatalogLabItem;
  searchQuery: string;
}) {
  const typeNameMap: Record<string, string> = {
    sql_worker: 'SQL',
    quizlet: 'Quizlet',
    js_worker: 'JavaScript',
    docker: 'DevOps',
    api_mock: 'API Testing',
  };

  const typeName = typeNameMap[lab.sandboxType] || lab.sandboxType || 'Lab';

  const difficultyText = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  }[lab.difficulty];

  return (
    <Link
      to={`/labs/${lab.slug || lab.id}`}
      className="group flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm cursor-pointer h-full"
    >
      <div className="space-y-2">
        {/* Top category label & PRO-only badge */}
        <div className="flex items-center justify-between text-[11px] gap-2">
          <span className="font-semibold uppercase tracking-wider text-muted-foreground truncate">
            {lab.categoryName}
          </span>
          {lab.isProOnly && (
            <Badge
              variant="secondary"
              className="text-[10px] font-bold h-4 px-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0"
            >
              PRO
            </Badge>
          )}
        </div>

        {/* Title: 2 lines max with fixed min-height */}
        <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
          <HighlightText text={lab.title} query={searchQuery} />
        </h3>

        {/* Parent Series reference if available */}
        {lab.seriesTitle && (
          <p className="text-[11px] text-muted-foreground truncate">
            In: {lab.seriesTitle}
          </p>
        )}
      </div>

      {/* Footer 1 line: "JavaScript · 20 mins · Beginner" + "→" */}
      <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {typeName} · {lab.estimatedMinutes} mins · {difficultyText}
        </span>
        <span className="text-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform font-bold text-sm">
          →
        </span>
      </div>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2 pt-2" />
        </div>
      ))}
    </div>
  );
}
