import { Layers, Code2, Users, Search, CreditCard, FileText } from 'lucide-react';

export type AdminTabType = 'topics' | 'labs' | 'users' | 'plans' | 'audit';

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
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveTab('topics')}
          className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'topics'
              ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Layers className="size-4" />
          <span>Topics ({topicsCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('labs')}
          className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'labs'
              ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Code2 className="size-4" />
          <span>Labs &amp; Blog</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'users'
              ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Users className="size-4" />
          <span>Users</span>
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'plans'
              ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <CreditCard className="size-4" />
          <span>Plans &amp; Features</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'audit'
              ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <FileText className="size-4" />
          <span>Audit Trail</span>
        </button>
      </div>

      {(activeTab === 'topics' || activeTab === 'labs') && (
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={activeTab === 'topics' ? 'Tìm kiếm topic...' : 'Tìm kiếm bài lab...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}
    </div>
  );
}
