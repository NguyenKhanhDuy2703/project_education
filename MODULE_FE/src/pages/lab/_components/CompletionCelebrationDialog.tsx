import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { LabSummary, LabSeries } from '@/types/lab.types';

export interface CompletionCelebrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextLab: LabSummary | null;
  series?: LabSeries;
  runtimeMs?: number;
}

export function CompletionCelebrationDialog({
  open,
  onOpenChange,
  nextLab,
  series,
  runtimeMs = 35,
}: CompletionCelebrationDialogProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <Badge
            variant="secondary"
            className="mx-auto text-xs font-bold px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 mb-2"
          >
            100% COMPLETED
          </Badge>
          <DialogTitle className="text-lg font-bold">Lab Challenge Completed!</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            {nextLab
              ? `Next up: "${nextLab.title}". Keep up the great momentum!`
              : 'Congratulations! You have completed all labs in this series!'}
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 bg-muted/40 rounded-xl flex items-center justify-around text-xs my-2">
          <div>
            <span className="text-muted-foreground block text-[11px]">Status</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">Passed</span>
          </div>
          <div className="w-px h-6 bg-border" />
          <div>
            <span className="text-muted-foreground block text-[11px]">Runtime</span>
            <span className="font-bold text-foreground">{runtimeMs}ms</span>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="flex-1 text-xs"
          >
            Review Lab
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onOpenChange(false);
              if (nextLab) {
                navigate(`/labs/${nextLab.slug || nextLab.id}`);
              } else if (series?.slug) {
                navigate(`/series/${series.slug}`);
              } else {
                navigate('/series');
              }
            }}
            className="flex-1 text-xs font-bold"
          >
            {nextLab ? 'Continue to Next Lab' : 'Return to Series'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
