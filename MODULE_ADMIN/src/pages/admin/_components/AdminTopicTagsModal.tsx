import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tag, Plus, Trash2, Edit3, CheckCircle2, RotateCcw } from 'lucide-react';
import {
  type TopicTag,
  getSystemTopicTags,
  saveSystemTopicTags,
  DEFAULT_TOPIC_TAGS,
} from '@/services/topicTags.service';

const COLOR_PRESETS = [
  { label: 'Emerald (Xanh lá)', value: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' },
  { label: 'Blue (Xanh dương)', value: 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10' },
  { label: 'Purple (Tím)', value: 'border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10' },
  { label: 'Amber (Cam)', value: 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10' },
  { label: 'Rose (Hồng)', value: 'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10' },
  { label: 'Cyan (Xanh lơ)', value: 'border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10' },
  { label: 'Indigo (Chàm)', value: 'border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10' },
];

interface AdminTopicTagsModalProps {
  open: boolean;
  onClose: () => void;
}

export function AdminTopicTagsModal({ open, onClose }: AdminTopicTagsModalProps) {
  const [tags, setTags] = useState<TopicTag[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  // Form state
  const [tagTitle, setTagTitle] = useState('');
  const [tagKey, setTagKey] = useState('');
  const [tagDesc, setTagDesc] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0].value);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTags(getSystemTopicTags());
      resetForm();
    }
  }, [open]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const resetForm = () => {
    setTagTitle('');
    setTagKey('');
    setTagDesc('');
    setSelectedColor(COLOR_PRESETS[0].value);
    setEditingKey(null);
  };

  const handleTitleChange = (val: string) => {
    setTagTitle(val);
    if (!editingKey) {
      // Auto-generate key from title
      const generated = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/(^_|_$)/g, '');
      setTagKey(generated);
    }
  };

  const handleSaveTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagTitle.trim() || !tagKey.trim()) return;

    const trimmedKey = tagKey.trim().toLowerCase();

    // Check duplicate key if creating new
    if (!editingKey && tags.some((t) => t.key === trimmedKey)) {
      alert(`Mã thẻ "${trimmedKey}" đã tồn tại. Vui lòng chọn mã khác.`);
      return;
    }

    let updatedList: TopicTag[];
    if (editingKey) {
      updatedList = tags.map((t) =>
        t.key === editingKey
          ? {
              key: trimmedKey,
              title: tagTitle.trim(),
              description: tagDesc.trim(),
              tagColor: selectedColor,
            }
          : t
      );
      showToast(`Đã cập nhật thẻ "${tagTitle.trim()}"`);
    } else {
      const newTag: TopicTag = {
        key: trimmedKey,
        title: tagTitle.trim(),
        description: tagDesc.trim(),
        tagColor: selectedColor,
      };
      updatedList = [...tags, newTag];
      showToast(`Đã tạo mới thẻ topic "${newTag.title}"`);
    }

    setTags(updatedList);
    saveSystemTopicTags(updatedList);
    resetForm();
  };

  const handleStartEdit = (t: TopicTag) => {
    setEditingKey(t.key);
    setTagTitle(t.title);
    setTagKey(t.key);
    setTagDesc(t.description || '');
    setSelectedColor(t.tagColor || COLOR_PRESETS[0].value);
  };

  const handleDeleteTag = (key: string, title: string) => {
    if (tags.length <= 1) {
      alert('Hệ thống cần tối thiểu 1 thẻ topic để phân loại nội dung.');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa thẻ topic "${title}"?`)) {
      const filtered = tags.filter((t) => t.key !== key);
      setTags(filtered);
      saveSystemTopicTags(filtered);
      if (editingKey === key) resetForm();
      showToast(`Đã xóa thẻ topic "${title}"`);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Khôi phục danh sách thẻ topic về mặc định ban đầu của hệ thống?')) {
      setTags(DEFAULT_TOPIC_TAGS);
      saveSystemTopicTags(DEFAULT_TOPIC_TAGS);
      resetForm();
      showToast('Đã khôi phục các thẻ topic mặc định!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col p-6 border-border bg-card">
        <DialogHeader className="pb-3 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Tag className="size-4" />
              </span>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Quản lý Danh mục Thẻ Topic (Topic Tags)
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Định nghĩa các phân loại kỹ năng hệ thống. Contributor chỉ được phép chọn gắn các thẻ này vào Series/Lab.
                </DialogDescription>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetDefaults}
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
              title="Khôi phục mặc định"
            >
              <RotateCcw className="size-3" />
              <span className="hidden sm:inline">Khôi phục mặc định</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Toast notification */}
        {toastMsg && (
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 shrink-0">
            <CheckCircle2 className="size-3.5" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Content Body: Left Form + Right Existing Tags list */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 py-3 overflow-y-auto flex-1">
          {/* Form Create / Edit (5 cols) */}
          <form onSubmit={handleSaveTag} className="md:col-span-5 space-y-3 p-4 rounded-xl border border-border bg-background/50 h-fit">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
              {editingKey ? 'Chỉnh sửa Thẻ Topic' : 'Thêm Thẻ Topic Mới'}
            </span>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">Tên thẻ hiển thị *</label>
              <Input
                value={tagTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="vd: Mobile App & Flutter"
                className="h-8 text-xs bg-card"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">Mã định danh (Key/Slug) *</label>
              <Input
                value={tagKey}
                onChange={(e) => setTagKey(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="vd: mobile_flutter"
                className="h-8 text-xs font-mono bg-card"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">Mô tả ngắn</label>
              <Textarea
                rows={2}
                value={tagDesc}
                onChange={(e) => setTagDesc(e.target.value)}
                placeholder="Mô tả kỹ năng hoặc công nghệ của thẻ..."
                className="text-xs bg-card min-h-[60px]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground block">Màu sắc đại diện</label>
              <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                {COLOR_PRESETS.map((cp) => (
                  <button
                    key={cp.label}
                    type="button"
                    onClick={() => setSelectedColor(cp.value)}
                    className={`h-7 rounded-md border text-[10px] font-bold transition-all flex items-center justify-center ${cp.value} ${
                      selectedColor === cp.value ? 'ring-2 ring-primary ring-offset-1' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    Tag
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              {editingKey && (
                <Button type="button" variant="ghost" size="sm" onClick={resetForm} className="h-7 text-xs">
                  Hủy
                </Button>
              )}
              <Button type="submit" size="sm" className="h-7 text-xs font-bold gap-1 bg-primary text-primary-foreground">
                {editingKey ? <Edit3 className="size-3" /> : <Plus className="size-3" />}
                <span>{editingKey ? 'Cập nhật' : 'Thêm thẻ'}</span>
              </Button>
            </div>
          </form>

          {/* Existing Tags List (7 cols) */}
          <div className="md:col-span-7 space-y-2.5">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Danh sách Thẻ Topic Hệ thống ({tags.length})
              </span>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {tags.map((t) => (
                <div
                  key={t.key}
                  className="p-3 rounded-xl border border-border bg-card hover:bg-card/80 transition-all flex items-start justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] uppercase font-bold px-2 py-0.5 ${t.tagColor}`}>
                        {t.key}
                      </Badge>
                      <span className="text-xs font-bold text-foreground">{t.title}</span>
                    </div>
                    {t.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {t.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(t)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      title="Chỉnh sửa thẻ này"
                    >
                      <Edit3 className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTag(t.key, t.title)}
                      className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                      title="Xóa thẻ"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-border shrink-0 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            Các thay đổi được lưu và đồng bộ tức thì với bộ chọn thẻ của Contributor.
          </span>
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
