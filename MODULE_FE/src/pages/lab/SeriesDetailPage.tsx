/**
 * SeriesDetailPage — /series/:slug
 *
 * Shows curriculum sections and pedagogical learning units within a series;
 * respects dynamic IAM permissions and server-synchronized progress.
 */
import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { seriesApi } from '@/features/lab/api/series.api';
import { useAppSelector } from '@/stores/store';
import { can } from '@/features/auth/permissions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UpgradeModal } from '@/features/lab/components/UpgradeModal';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { SampleProjectLinks } from '@/components/domain/SampleProjectLinks';
import {
  Crown,
  BookOpen,
  Database,
  CheckSquare,
  Play,
  Layers,
  Bookmark,
  BookmarkCheck,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  normalizeTopicKey,
  getTopicTitle,
  getTopicBadgeClass,
} from '@/services/topicTags.service';
import {
  getFormatInfo,
  getSeriesFormat,
  getUnitTypeInfo,
  isAutomationSeriesSlug,
  isAutomationContentHidden,
} from '@/services/formatBadge.service';
import type { LabSummary, SeriesSection } from '@/types/lab.types';

export function SeriesDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAppSelector((s) => s.auth);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedLabTitle, setSelectedLabTitle] = useState<string>('');
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState<boolean>(false);

  const { data: series, isLoading, isError } = useQuery({
    queryKey: ['series', slug],
    queryFn: () => seriesApi.getBySlug(slug!),
    enabled: !!slug,
  });

  useEffect(() => {
    if (series) {
      setIsBookmarked(Boolean(series.isSaved));
    }
  }, [series]);

  const handleToggleBookmark = async () => {
    if (!series || isBookmarkLoading) return;
    setIsBookmarkLoading(true);
    try {
      if (isBookmarked) {
        await seriesApi.unsave(series.id);
        setIsBookmarked(false);
      } else {
        await seriesApi.save(series.id);
        setIsBookmarked(true);
      }
    } catch (err) {
      console.error('Failed to toggle bookmark', err);
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  const hasProAccess = can(user, 'LAB_PRO');

  const topicKey = normalizeTopicKey(series?.category || series?.topic);
  const topicTitle = getTopicTitle(topicKey, 'Series');
  const topicBadgeClass = getTopicBadgeClass(topicKey);
  const seriesFormat = series ? getSeriesFormat(series) : 'js_worker';
  const seriesFormatInfo = getFormatInfo(seriesFormat);

  // Curriculum pedagogical summary breakdown
  const curriculumSummary = useMemo(() => {
    if (!series) return '';
    const labs = series.labs || [];
    let lessons = 0;
    let practice = 0;
    let checks = 0;

    for (const l of labs) {
      const uType = l.unitType || (
        l.sandboxType === 'markdown_only'
          ? 'theory'
          : l.sandboxType === 'sql_worker'
          ? 'sql_practice'
          : l.sandboxType === 'quizlet'
          ? 'quiz_checkpoint'
          : 'automation_lab'
      );
      if (uType === 'theory') lessons++;
      else if (uType === 'quiz_checkpoint') checks++;
      else practice++;
    }

    const parts = [
      lessons > 0 ? `${lessons} lessons` : null,
      practice > 0 ? `${practice} labs` : null,
      checks > 0 ? `${checks} checks` : null,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(' · ') : `${labs.length} learning units`;
  }, [series]);

  const totalMinutes = useMemo(() => {
    if (!series) return 60;
    if (series.estimatedMinutes) return series.estimatedMinutes;
    if (series.labs && series.labs.length > 0) {
      return series.labs.reduce(
        (acc, l) => acc + (l.durationMinutes || l.estimatedMinutes || 20),
        0
      );
    }
    return 60;
  }, [series]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-10 max-w-3xl space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

    const isHiddenAutomation = isAutomationSeriesSlug(slug) && isAutomationContentHidden(user?.role);

  if (isHiddenAutomation || ((isError || !series) && isAutomationSeriesSlug(slug))) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-16 max-w-xl text-center space-y-6">
        <div className="size-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto shadow-sm">
          <Clock className="size-8" />
        </div>
        <div className="space-y-2">
          <Badge variant="outline" className="text-xs uppercase font-semibold text-amber-600 dark:text-amber-400 border-amber-500/30">
            Curriculum Notice
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Topic Temporarily Unavailable
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Automation testing series are temporarily unavailable in this release as we curate our new Playwright experience.
            Please explore our PostgreSQL Business Labs or Testing Theory Quizzes in the active catalog.
          </p>
        </div>
        <div className="pt-2">
          <Button asChild className="min-h-[44px] px-6 font-semibold shadow-sm">
            <Link to="/series">Browse Active Catalog</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isError || !series) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-3xl space-y-3">
        <p className="text-sm font-semibold text-destructive">Series not found.</p>
        <Button variant="outline" size="sm" asChild>
          <Link to="/series">Back to series catalog</Link>
        </Button>
      </div>
    );
  }

  const handleOpenUpgrade = (labTitle: string) => {
    setSelectedLabTitle(labTitle);
    setUpgradeModalOpen(true);
  };

  const sections: SeriesSection[] = series.sections && series.sections.length > 0
    ? series.sections
    : [
        {
          id: 'default',
          seriesId: series.id,
          title: 'Curriculum Units',
          orderIndex: 0,
          labs: series.labs || [],
        },
      ];

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-3xl space-y-7">
      {/* ── Series header ───────────────────────────────────────────────── */}
      <div className="space-y-3 bg-card border border-border p-6 rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn('text-xs uppercase font-semibold tracking-wider border', topicBadgeClass)}
            >
              {topicTitle}
            </Badge>
            <Badge
              variant="outline"
              className={cn('text-xs font-semibold border', seriesFormatInfo.badgeClass)}
            >
              {seriesFormatInfo.label}
            </Badge>
            {series.isProOnly && (
              <Badge variant="secondary" className="text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 gap-1">
                <Crown className="size-3 text-amber-500" />
                PRO Tier
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {series.status && (
              <StatusBadge status={series.status} size="sm" />
            )}
            {user && (
              <Button
                variant={isBookmarked ? 'secondary' : 'outline'}
                size="sm"
                onClick={handleToggleBookmark}
                disabled={isBookmarkLoading}
                className="h-7 text-xs gap-1.5 border-border"
                aria-label={isBookmarked ? 'Remove from saved series' : 'Save series'}
                title={isBookmarked ? 'Remove from saved series' : 'Save series'}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="size-3.5 text-primary" />
                ) : (
                  <Bookmark className="size-3.5 text-muted-foreground" />
                )}
                <span>{isBookmarked ? 'Saved' : 'Save'}</span>
              </Button>
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-foreground">{series.title}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{series.description}</p>

        {(series.repoUrl || series.swaggerUrl) && (
          <div className="pt-1">
            <SampleProjectLinks repoUrl={series.repoUrl} swaggerUrl={series.swaggerUrl} />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
          <span className="font-semibold text-foreground">{curriculumSummary}</span>
          <span>•</span>
          <span>~{totalMinutes} mins to complete</span>
          {series.authorName && (
            <>
              <span>•</span>
              <span>Author: <strong className="text-foreground">{series.authorName}</strong></span>
            </>
          )}
        </div>
      </div>

      {/* ── Curriculum Modules & Sections ───────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Curriculum Modules
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {series.labs?.length || 0} units
          </span>
        </div>

        <div className="space-y-6">
          {sections.map((section, sIdx) => {
            const sectionLabs = (section.labs as LabSummary[]) || [];
            if (sectionLabs.length === 0 && sections.length > 1) return null;

            return (
              <div key={section.id || sIdx} className="space-y-2">
                {sections.length > 1 && (
                  <div className="flex items-center justify-between px-1">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {section.title}
                      </h3>
                      {section.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {section.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      {sectionLabs.length} units
                    </Badge>
                  </div>
                )}

                <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
                  {sectionLabs.map((lab, index) => (
                    <LabRowItem
                      key={lab.id}
                      lab={lab}
                      index={index}
                      hasProAccess={hasProAccess}
                      seriesIsProOnly={Boolean(series.isProOnly)}
                      onUpgradeClick={() => handleOpenUpgrade(lab.title)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upgrade modal for locked labs */}
      <UpgradeModal
        open={upgradeModalOpen}
        labTitle={selectedLabTitle}
        onClose={() => setUpgradeModalOpen(false)}
      />
    </div>
  );
}

// ─── Learning Unit Row Item ──────────────────────────────────────────────
function LabRowItem({
  lab,
  index,
  hasProAccess,
  seriesIsProOnly,
  onUpgradeClick,
}: {
  lab: LabSummary;
  index: number;
  hasProAccess: boolean;
  seriesIsProOnly: boolean;
  onUpgradeClick: () => void;
}) {
  const isLabPro = Boolean(lab.isProOnly || (seriesIsProOnly && !lab.isFreePreview));
  const locked = isLabPro && !hasProAccess;
  const unitInfo = getUnitTypeInfo(lab.unitType, lab.sandboxType);

  const isCompleted = lab.progress?.status === 'COMPLETED' || lab.userStatus === 'passed';
  const isInProgress = lab.progress?.status === 'IN_PROGRESS';

  const renderIcon = () => {
    switch (unitInfo.unitType) {
      case 'theory':
        return <BookOpen className="size-4 text-sky-500 shrink-0" />;
      case 'sql_practice':
        return <Database className="size-4 text-blue-500 shrink-0" />;
      case 'quiz_checkpoint':
        return <CheckSquare className="size-4 text-purple-500 shrink-0" />;
      case 'automation_lab':
      default:
        return <Play className="size-4 text-emerald-500 shrink-0" />;
    }
  };

  const renderStatus = () => {
    if (isCompleted) {
      return (
        <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 font-bold text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
          COMPLETED
        </Badge>
      );
    }
    if (isInProgress) {
      return (
        <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 font-bold text-blue-600 border-blue-500/30 bg-blue-500/10">
          IN PROGRESS
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 text-muted-foreground/60 font-medium">
        NOT STARTED
      </Badge>
    );
  };

  const content = (
    <div
      className={`flex items-center gap-3.5 px-4 py-3 bg-card transition-colors ${
        locked ? 'opacity-70 cursor-pointer bg-muted/10' : 'hover:bg-muted/40 cursor-pointer'
      }`}
      onClick={locked ? onUpgradeClick : undefined}
    >
      <span className="text-xs font-mono text-muted-foreground w-5 shrink-0 text-center font-bold">
        {String(index + 1).padStart(2, '0')}
      </span>

      <div className="shrink-0">
        {renderIcon()}
      </div>

      {renderStatus()}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-foreground truncate">{lab.title}</p>
          <Badge
            variant="outline"
            className={cn('text-[10px] h-4.5 px-1.5 font-bold border shrink-0', unitInfo.badgeClass)}
          >
            {unitInfo.label}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {lab.durationMinutes || lab.estimatedMinutes || 15} mins
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isLabPro && (
          <Badge variant="secondary" className="text-[10px] font-bold h-4.5 px-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/20">
            PRO
          </Badge>
        )}
        {locked ? (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
            onClick={(e) => {
              e.preventDefault();
              onUpgradeClick();
            }}
          >
            Unlock
          </Button>
        ) : (
          <Button size="sm" variant="ghost" className="h-7 text-xs font-semibold text-primary">
            {unitInfo.ctaText}
          </Button>
        )}
      </div>
    </div>
  );

  if (locked) {
    return <div key={lab.id}>{content}</div>;
  }

  return (
    <Link key={lab.id} to={`/labs/${lab.slug || lab.id}`}>
      {content}
    </Link>
  );
}
