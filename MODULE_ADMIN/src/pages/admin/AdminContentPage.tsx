/**
 * AdminContentPage — Quản trị Nội dung (Mô hình Cha - Con: Topic & Bài thực hành)
 *
 * Loại bỏ tabs rời rạc. Tổ chức theo mô hình cây phân cấp:
 * - Cấp Cha (Topic): Thiết lập Thể loại (SQL / Quizlet / JS) và Giới thiệu tổng quan.
 * - Cấp Con (Labs): Kế thừa thể loại của Topic cha, quản lý danh sách bài tập.
 * - Zero icons, styled with shadcn/ui.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, Tag } from 'lucide-react';
import { useAdminContent } from './_hooks/useAdminContent';
import { AdminToast } from './_components/AdminToast';
import { AdminStatsCards } from './_components/AdminStatsCards';
import { AdminTopicHierarchy } from './_components/AdminTopicHierarchy';
import { SeriesModal } from './_components/SeriesModal';
import { AdminTopicTagsModal } from './_components/AdminTopicTagsModal';

export function AdminContentPage() {
  const ctx = useAdminContent();
  const [topicTagsModalOpen, setTopicTagsModalOpen] = useState(false);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Toast Notification */}
      <AdminToast message={ctx.toastMessage} onClose={() => ctx.setToastMessage(null)} />

      {/* Header with Dynamic Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Content
            </h1>
            <Badge variant="outline" className="text-[10px] uppercase px-2 py-0.5 border-primary/30 text-primary font-semibold">
              CATALOG
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage course topics, series structure, and lab exercises.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTopicTagsModalOpen(true)}
            className="text-xs font-semibold gap-1.5"
          >
            <Tag className="size-3.5 text-primary" />
            <span>Manage Topic Tags</span>
          </Button>

          <Button variant="outline" size="sm" asChild className="text-xs font-semibold gap-1.5">
            <Link to="/admin/review">
              <ClipboardCheck className="size-3.5 text-primary" />
              Review Queue
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <AdminStatsCards
        totalTopics={ctx.stats.totalTopics}
        totalLabs={ctx.stats.totalLabs}
        proTopics={ctx.stats.proTopics}
      />

      {/* Giao diện phân cấp Cây (Không còn Tabs ngang rời rạc) */}
      <div className="mt-6">
        <AdminTopicHierarchy
          isLoading={ctx.isLoadingSeries}
          topics={ctx.seriesList}
          onCreateTopic={ctx.openCreateSeries}
          onEditTopic={ctx.openEditSeries}
          onDeleteTopic={ctx.handleDeleteSeries}
          onDeleteLab={ctx.handleDeleteLab}
        />
      </div>

      {/* Modal Tạo & Chỉnh sửa Topic (Cấp Cha) */}
      <SeriesModal
        open={ctx.seriesModalOpen}
        onClose={() => ctx.setSeriesModalOpen(false)}
        editingSeries={ctx.editingSeries}
        form={ctx.seriesForm}
        setForm={ctx.setSeriesForm}
        onSubmit={ctx.handleSaveSeries}
        isPending={ctx.isSeriesPending}
      />

      {/* Modal Quản lý Thẻ Topic (Topic Tags) */}
      <AdminTopicTagsModal
        open={topicTagsModalOpen}
        onClose={() => setTopicTagsModalOpen(false)}
      />
    </div>
  );
}
