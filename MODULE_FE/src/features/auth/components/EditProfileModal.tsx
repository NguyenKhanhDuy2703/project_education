import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Loader2, User } from 'lucide-react';
import { authApi } from '../api/auth.api';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { setUser } from '@/stores/slices/auth.slice';

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileModal({ open, onOpenChange }: EditProfileModalProps) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [defaultAddress, setDefaultAddress] = useState(user?.defaultAddress || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open && user) {
      setName(user.name || '');
      setAvatarUrl(user.avatarUrl || '');
      setDefaultAddress(user.defaultAddress || '');
      setError(null);
      setSuccess(false);
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setError('Họ tên phải có ít nhất 2 ký tự.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await authApi.updateProfile({
        name: name.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
        defaultAddress: defaultAddress.trim() || undefined,
      });

      if (res?.user) {
        dispatch(setUser(res.user));
      }
      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
      }, 1000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Cập nhật thông tin thất bại. Vui lòng thử lại.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <User className="size-4 text-primary" />
            <span>Chỉnh sửa thông tin cá nhân</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Cập nhật họ tên, ảnh đại diện và địa chỉ của bạn.
          </DialogDescription>
        </DialogHeader>

        {success && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>Thông tin cá nhân đã được cập nhật thành công!</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name" className="text-xs font-semibold">
              Họ và tên <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="text-xs h-9"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-avatar" className="text-xs font-semibold">
              Đường dẫn ảnh đại diện (Avatar URL)
            </Label>
            <Input
              id="edit-avatar"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="text-xs h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-address" className="text-xs font-semibold">
              Địa chỉ mặc định
            </Label>
            <Input
              id="edit-address"
              value={defaultAddress}
              onChange={(e) => setDefaultAddress(e.target.value)}
              placeholder="Hà Nội, Việt Nam"
              className="text-xs h-9"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs font-semibold gap-1.5"
            >
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
              <span>Lưu thay đổi</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
