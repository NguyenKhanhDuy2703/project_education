import { Layers, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminContent } from './_hooks/useAdminContent';
import { AdminToast } from './_components/AdminToast';
import { AdminStatsCards } from './_components/AdminStatsCards';
import { AdminTabsBar } from './_components/AdminTabsBar';
import { AdminTopicsTab } from './_components/AdminTopicsTab';
import { AdminLabsTab } from './_components/AdminLabsTab';
import { SeriesModal } from './_components/SeriesModal';
import { LabModal } from './_components/LabModal';

export function AdminContentPage() {
  const ctx = useAdminContent();

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Toast */}
      <AdminToast message={ctx.toastMessage} onClose={() => ctx.setToastMessage(null)} />

      {/* Header — T1: Streamlined header matching content scope */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-primary/10 text-primary">
              <Layers className="size-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Topics & Labs
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Create, edit, and manage learning content: Topics, Series, and Practice Labs.
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-3">
          {ctx.activeTab === 'topics' && (
            <Button onClick={ctx.openCreateSeries} className="gap-2 font-semibold shadow-sm">
              <Plus className="size-4" /> Create New Topic
            </Button>
          )}
          {ctx.activeTab === 'labs' && (
            <Button
              onClick={ctx.openCreateLab}
              disabled={!ctx.activeSeries}
              className="gap-2 font-semibold shadow-sm"
            >
              <Plus className="size-4" /> Add Practice Lab
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <AdminStatsCards
        totalTopics={ctx.stats.totalTopics}
        totalLabs={ctx.stats.totalLabs}
        proTopics={ctx.stats.proTopics}
      />

      {/* Tabs + Search — T2: Retain Topics and Labs only */}
      <AdminTabsBar
        activeTab={ctx.activeTab}
        setActiveTab={ctx.setActiveTab}
        topicsCount={ctx.seriesList.length}
        searchTerm={ctx.searchTerm}
        setSearchTerm={ctx.setSearchTerm}
      />

      {/* Tab content */}
      <div className="mt-6">
        {ctx.activeTab === 'topics' && (
          <AdminTopicsTab
            isLoading={ctx.isLoadingSeries}
            filteredSeries={ctx.filteredSeries}
            onCreateSeries={ctx.openCreateSeries}
            onEditSeries={ctx.openEditSeries}
            onDeleteSeries={ctx.handleDeleteSeries}
          />
        )}

        {ctx.activeTab === 'labs' && (
          <AdminLabsTab
            isLoading={ctx.isLoadingLabs}
            seriesList={ctx.seriesList}
            activeSeries={ctx.activeSeries}
            filteredLabs={ctx.filteredLabs}
            onSelectSeries={ctx.setSelectedSeriesSlug}
            onCreateLab={ctx.openCreateLab}
            onEditLab={ctx.openEditLab}
            onDeleteLab={ctx.handleDeleteLab}
          />
        )}
      </div>

      {/* Modals */}
      <SeriesModal
        open={ctx.seriesModalOpen}
        onClose={() => ctx.setSeriesModalOpen(false)}
        editingSeries={ctx.editingSeries}
        form={ctx.seriesForm}
        setForm={ctx.setSeriesForm}
        onSubmit={ctx.handleSaveSeries}
        isPending={ctx.isSeriesPending}
      />

      <LabModal
        open={ctx.labModalOpen}
        onClose={() => ctx.setLabModalOpen(false)}
        editingLabId={ctx.editingLabId}
        form={ctx.labForm}
        setForm={ctx.setLabForm}
        onSubmit={ctx.handleSaveLab}
        onApplyPreset={ctx.applyPreset}
        previewTab={ctx.labPreviewTab}
        setPreviewTab={ctx.setLabPreviewTab}
        isPending={ctx.isLabPending}
      />
    </div>
  );
}
