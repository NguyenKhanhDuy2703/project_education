import { Link } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, Search, CheckCircle2, ChevronLeft } from 'lucide-react';
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
      <SheetContent side="left" className="w-80 sm:w-96 p-0 flex flex-col bg-card">
        <SheetHeader className="p-4 border-b border-border space-y-2">
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
          <SheetTitle className="text-base font-bold text-foreground truncate">
            {series?.title || 'Interactive Lab Series'}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground line-clamp-2">
            {series?.description || 'Browse challenges in this curriculum'}
          </SheetDescription>

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
                    onClick={() => onSwitchLab(item)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between group ${
                      isActive
                        ? 'border-primary/60 bg-primary/5 font-semibold text-primary'
                        : 'border-transparent hover:bg-muted/50 text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="size-5 rounded-md flex items-center justify-center text-[10px] font-mono bg-muted/60 text-muted-foreground shrink-0">
                        {index + 1}
                      </span>
                      <span className="truncate">{item.title}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {isPassed && (
                        <CheckCircle2 className="size-3.5 text-emerald-500" />
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
