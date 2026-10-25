import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChevronDown,
  Search,
  CheckCircle2,
  ChevronLeft,
  X,
  BookOpen,
  Database,
  CheckSquare,
  Play,
  Layers,
} from 'lucide-react';
import type { LabSummary, LabSeries } from '@/types/lab.types';
import { getUnitTypeInfo } from '@/services/formatBadge.service';

export interface CurriculumDrawerSheetProps {
  series?: LabSeries;
  currentLabId?: string;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  labSearchQuery: string;
  setLabSearchQuery: (query: string) => void;
  filteredSeriesLabs: LabSummary[];
  onSwitchLab: (lab: LabSummary) => void;
}

export function CurriculumDrawerSheet({
  series,
  currentLabId,
  isDrawerOpen,
  setIsDrawerOpen,
  labSearchQuery,
  setLabSearchQuery,
  filteredSeriesLabs,
  onSwitchLab,
}: CurriculumDrawerSheetProps) {
  const seriesLabs = useMemo(() => series?.labs || [], [series?.labs]);

  const curriculumSummary = useMemo(() => {
    let lessons = 0;
    let practice = 0;
    let checks = 0;

    for (const l of seriesLabs) {
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

    return parts.length > 0 ? parts.join(' · ') : `${seriesLabs.length} units`;
  }, [seriesLabs]);

  const renderUnitIcon = (unitType: string) => {
    switch (unitType) {
      case 'theory':
        return <BookOpen className="size-3.5 text-sky-500 shrink-0 mt-0.5" />;
      case 'sql_practice':
        return <Database className="size-3.5 text-blue-500 shrink-0 mt-0.5" />;
      case 'quiz_checkpoint':
        return <CheckSquare className="size-3.5 text-purple-500 shrink-0 mt-0.5" />;
      case 'automation_lab':
      default:
        return <Play className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />;
    }
  };

  return (
    <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2.5 text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground shrink-0 hover:bg-muted/60"
          title="Curriculum & Unit List"
        >
          <Layers className="size-3.5 text-primary" />
          <span>Curriculum</span>
          <ChevronDown className="size-3 text-muted-foreground opacity-60" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 sm:w-96 p-0 flex flex-col bg-card" showCloseButton={false}>
        <SheetHeader className="p-4 border-b border-border space-y-3">
          {/* Row 1: Close button 'X' */}
          <div className="flex items-center justify-end -mr-1 -mt-1">
            <SheetClose asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7 text-muted-foreground hover:text-foreground"
                aria-label="Close curriculum drawer"
              >
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </Button>
            </SheetClose>
          </div>

          {/* Row 2: 'CURRICULUM' + summary badge */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Curriculum Units
            </span>
            {series && (
              <Badge variant="outline" className="text-[10px] font-semibold text-primary">
                {curriculumSummary}
              </Badge>
            )}
          </div>

          {/* Row 3: Series Title + Description */}
          <div className="space-y-1">
            <SheetTitle
              className="text-base font-bold text-foreground leading-snug break-words"
              title={series?.title}
            >
              {series?.title || 'Interactive Lab Series'}
            </SheetTitle>
            <SheetDescription
              className="text-xs text-muted-foreground line-clamp-2 leading-relaxed"
              title={series?.description}
            >
              {series?.description || 'Browse curriculum units and track progress'}
            </SheetDescription>
          </div>

          {/* Row 4: Search input */}
          <div className="relative pt-1">
            <Search className="size-3.5 absolute left-2.5 top-3.5 text-muted-foreground" />
            <Input
              value={labSearchQuery}
              onChange={(e) => setLabSearchQuery(e.target.value)}
              placeholder="Search lessons and labs..."
              className="h-8 pl-8 text-xs bg-muted/30 border-border"
            />
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-2">
          <div className="space-y-4">
            {filteredSeriesLabs.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No matching units found
              </div>
            ) : series?.sections && series.sections.length > 0 ? (
              series.sections.map((sec, sIdx) => {
                const sectionItems = filteredSeriesLabs.filter((l) => l.sectionId === sec.id);
                if (sectionItems.length === 0) return null;

                return (
                  <div key={sec.id || sIdx} className="space-y-1.5">
                    <div className="px-2 pt-1 flex items-center justify-between text-xs font-bold text-foreground">
                      <span>{sec.title}</span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        {sectionItems.length} units
                      </span>
                    </div>
                    {sectionItems.map((item, index) => {
                      const isActive = item.id === currentLabId || item.slug === currentLabId;
                      const isPassed =
                        item.progress?.status === 'COMPLETED' ||
                        (item as any).userStatus === 'passed';
                      const unitInfo = getUnitTypeInfo(item.unitType, item.sandboxType);

                      return (
                        <div
                          key={item.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => onSwitchLab(item)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onSwitchLab(item);
                            }
                          }}
                          title={item.title}
                          aria-label={`Challenge ${index + 1}: ${item.title}`}
                          className={`p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
                            isActive
                              ? 'border-primary/60 bg-primary/5 font-semibold text-primary'
                              : 'border-transparent hover:bg-muted/50 text-foreground'
                          }`}
                        >
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            {renderUnitIcon(unitInfo.unitType)}
                            <div className="min-w-0 flex-1">
                              <span className="line-clamp-2 leading-snug break-words text-foreground group-hover:text-primary transition-colors">
                                {item.title}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {unitInfo.label}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                            {isPassed && (
                              <CheckCircle2 className="size-3.5 text-emerald-500" aria-label="Completed unit" />
                            )}
                            {item.isProOnly && (
                              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-amber-500/10 text-amber-600 font-bold border-0">
                                PRO
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            ) : (
              filteredSeriesLabs.map((item, index) => {
                const isActive = item.id === currentLabId || item.slug === currentLabId;
                const isPassed =
                  item.progress?.status === 'COMPLETED' ||
                  (item as any).userStatus === 'passed';
                const unitInfo = getUnitTypeInfo(item.unitType, item.sandboxType);

                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSwitchLab(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSwitchLab(item);
                      }
                    }}
                    title={item.title}
                    aria-label={`Challenge ${index + 1}: ${item.title}`}
                    className={`p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-start justify-between gap-2.5 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
                      isActive
                        ? 'border-primary/60 bg-primary/5 font-semibold text-primary'
                        : 'border-transparent hover:bg-muted/50 text-foreground'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      {renderUnitIcon(unitInfo.unitType)}
                      <div className="min-w-0 flex-1">
                        <span className="line-clamp-2 leading-snug break-words text-foreground group-hover:text-primary transition-colors">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {unitInfo.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      {isPassed && (
                        <CheckCircle2 className="size-3.5 text-emerald-500" aria-label="Completed unit" />
                      )}
                      {item.isProOnly && (
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-amber-500/10 text-amber-600 font-bold border-0">
                          PRO
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between shrink-0">
          <Link
            to="/series"
            onClick={() => setIsDrawerOpen(false)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 font-medium"
          >
            <ChevronLeft className="size-3.5" />
            <span>All Series Catalog</span>
          </Link>
          <span className="text-[10px] text-muted-foreground font-mono">
            study<span className="text-primary font-bold">·</span>web
          </span>
        </div>
      </SheetContent>
    </Sheet>
  );
}
