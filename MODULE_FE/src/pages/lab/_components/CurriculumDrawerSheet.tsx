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
import { ChevronDown, Search, CheckCircle2, ChevronLeft, X } from 'lucide-react';
import type { LabSummary, LabSeries } from '@/types/lab.types';

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
  const seriesLabs = series?.labs || [];

  return (
    <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2.5 text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground shrink-0 hover:bg-muted/60"
          title="Curriculum & Lab List"
        >
          <span>Lab List</span>
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

          {/* Row 2: 'CURRICULUM DRAWER' + challenges badge */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Curriculum Drawer
            </span>
            {series && (
              <Badge variant="outline" className="text-[10px] font-semibold">
                {seriesLabs.length} Challenges
              </Badge>
            )}
          </div>

          {/* Row 3: Khối Info (Title + Description) */}
          <div className="space-y-1">
            <SheetTitle
              className="text-base font-bold text-foreground leading-snug break-words"
              title={series?.title}
            >
              {series?.title || 'Interactive Lab Series'}
            </SheetTitle>
            <SheetDescription
              className="text-xs text-muted-foreground line-clamp-3 leading-relaxed"
              title={series?.description}
            >
              {series?.description || 'Browse challenges in this curriculum'}
            </SheetDescription>
          </div>

          {/* Row 4: Thanh Search */}
          <div className="relative pt-1">
            <Search className="size-3.5 absolute left-2.5 top-3.5 text-muted-foreground" />
            <Input
              value={labSearchQuery}
              onChange={(e) => setLabSearchQuery(e.target.value)}
              placeholder="Search challenges by title, type..."
              className="h-8 pl-8 text-xs bg-muted/30 border-border"
            />
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            {filteredSeriesLabs.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No matching labs found
              </div>
            ) : (
              filteredSeriesLabs.map((item, index) => {
                const isActive = item.id === currentLabId || item.slug === currentLabId;
                const isPassed = (item as any).userStatus === 'passed';

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
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start justify-between gap-2.5 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
                      isActive
                        ? 'border-primary/60 bg-primary/5 font-semibold text-primary'
                        : 'border-transparent hover:bg-muted/50 text-foreground'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <span className="size-5 rounded-md flex items-center justify-center text-[10px] font-mono bg-muted/60 text-muted-foreground shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="line-clamp-2 leading-snug break-words text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      {isPassed && (
                        <CheckCircle2 className="size-3.5 text-emerald-500" aria-label="Passed challenge" />
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
