/**
 * UpgradeModal
 *
 * Shown when RBAC guard returns 403 on a Pro-only lab.
 * Workflow ref: Docs/workflows/02-lab-access-rbac.md
 *
 * Design: shadcn/ui Dialog, zero icons.
 */
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

interface Props {
  open: boolean;
  labTitle?: string;
  onClose: () => void;
}

export function UpgradeModal({ open, labTitle, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold px-2 py-0.5">
              PRO TIER
            </Badge>
            <DialogTitle className="leading-tight text-base">Exclusive PRO Content</DialogTitle>
          </div>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            {labTitle ? (
              <>
                The lab <strong>"{labTitle}"</strong> requires a{' '}
                <span className="font-semibold text-primary">UserPro</span> account.
              </>
            ) : (
              <>
                This lab requires a{' '}
                <span className="font-semibold text-primary">UserPro</span> account.
              </>
            )}{' '}
            Upgrade your membership plan to unlock all interactive labs and verified solution code.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground space-y-2">
          {[
            'Unlimited access to all interactive labs & sandbox runners',
            'Advanced challenges & verified reference solutions',
            'Priority guidance and community support',
          ].map((feat, i) => (
            <div key={feat} className="flex items-start gap-2">
              <span className="font-mono text-primary font-bold text-[11px] mt-0.5">[{i + 1}]</span>
              <span>{feat}</span>
            </div>
          ))}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0 mt-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
          <Button size="sm" asChild className="text-xs font-bold">
            <a href="/pricing">Upgrade to PRO Now</a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
