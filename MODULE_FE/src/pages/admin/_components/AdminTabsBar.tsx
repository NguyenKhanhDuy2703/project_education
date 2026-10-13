/**
 * AdminTabsBar — Thanh điều hướng phân hệ Nội dung (Series & Labs)
 *
 * Chỉ quản lý 2 phân cấp nội dung: Chuỗi bài học (Series) và Bài thực hành (Labs)
 * Zero icons, styled with shadcn/ui.
 */
import { Input } from '@/components/ui/input';

export type AdminTabType = 'topics' | 'labs';

interface AdminTabsBarProps {
  activeTab: AdminTabType;
  setActiveTab: (tab: AdminTabType) => void;
  topicsCount: number;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
}

export function AdminTabsBar({
  activeTab,
  setActiveTab,
  topicsCount,
  searchTerm,
  setSearchTerm,
}: AdminTabsBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 border-b border-border pb-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('topics')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'topics'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          Series ({topicsCount})
        </button>

        <button
          onClick={() => setActiveTab('labs')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'labs'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          Labs
        </button>
      </div>

      <div className="w-full sm:w-72">
        <Input
          type="text"
          placeholder={activeTab === 'topics' ? 'Search series...' : 'Search practice labs...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-8 text-xs bg-card"
        />
      </div>
    </div>
  );
}
