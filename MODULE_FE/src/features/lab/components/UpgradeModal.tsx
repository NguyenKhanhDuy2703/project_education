/**
 * UpgradeModal
 *
 * Shown when RBAC guard returns 403 on a Pro-only lab.
 * Workflow ref: Docs/workflows/02-lab-access-rbac.md
 *
 * Design: Meta flat, single primary CTA (#0866FF), no gradients.
 */
import { Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
          <div className="flex items-center gap-3 mb-1">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Lock className="size-5" />
            </div>
            <DialogTitle className="leading-tight">Nội dung dành cho Pro</DialogTitle>
          </div>
          <DialogDescription className="text-sm leading-relaxed">
            {labTitle ? (
              <>
                Bài lab <strong>"{labTitle}"</strong> yêu cầu tài khoản{' '}
                <span className="font-semibold text-primary">UserPro</span>.
              </>
            ) : (
              <>
                Bài lab này yêu cầu tài khoản{' '}
                <span className="font-semibold text-primary">UserPro</span>.
              </>
            )}{' '}
            Nâng cấp để mở khóa toàn bộ nội dung thực hành.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
          {['Truy cập không giới hạn tất cả bài lab', 'Bài tập nâng cao & đề thi thử', 'Hỗ trợ ưu tiên từ giảng viên'].map((feat) => (
            <p key={feat} className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-primary shrink-0" />
              {feat}
            </p>
          ))}
        </div>

        <DialogFooter className="flex gap-2 sm:flex-row flex-col-reverse">
          <Button variant="ghost" size="sm" onClick={onClose} className="flex-1">
            Để sau
          </Button>
          <Button size="sm" className="flex-1 font-semibold" asChild>
            <a href="/upgrade">Nâng cấp Pro →</a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
