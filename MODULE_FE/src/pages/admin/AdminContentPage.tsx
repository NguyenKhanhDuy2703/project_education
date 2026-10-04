import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { seriesApi } from '@/features/lab/api/series.api';
import { labApi } from '@/features/lab/api/lab.api';
import type { CreateSeriesInput, CreateLabInput, LabSeries } from '@/types/lab.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Layers,
  Code2,
  Plus,
  Pencil,
  Trash2,
  Clock,
  ExternalLink,
  Shield,
  Eye,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function AdminContentPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'topics' | 'labs'>('topics');
  const [selectedSeriesSlug, setSelectedSeriesSlug] = useState<string>('');

  // ── Modal States ───────────────────────────────────────────────────────────
  const [seriesModalOpen, setSeriesModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<LabSeries | null>(null);

  const [labModalOpen, setLabModalOpen] = useState(false);
  const [editingLabId, setEditingLabId] = useState<string | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: seriesList = [], isLoading: isLoadingSeries } = useQuery({
    queryKey: ['admin-series'],
    queryFn: () => seriesApi.getAll(true),
  });

  const activeSeries = seriesList.find((s) => s.slug === selectedSeriesSlug) || seriesList[0];

  const { data: seriesDetail, isLoading: isLoadingLabs } = useQuery({
    queryKey: ['admin-series-detail', activeSeries?.slug],
    queryFn: () => seriesApi.getBySlug(activeSeries.slug),
    enabled: !!activeSeries?.slug,
  });

  // ── Series Form State ──────────────────────────────────────────────────────
  const [seriesForm, setSeriesForm] = useState<CreateSeriesInput>({
    title: '',
    category: 'testing',
    description: '',
    level: 'beginner',
    coverEmoji: '🧪',
    isProOnly: false,
    orderIndex: 0,
    isActive: true,
  });

  // ── Lab Form State ─────────────────────────────────────────────────────────
  const [labForm, setLabForm] = useState<CreateLabInput>({
    seriesId: '',
    title: '',
    sandboxType: 'js_worker',
    objective: '',
    instructions: '',
    initialSnippet: '',
    testScript: '',
    solution: '',
    durationMinutes: 20,
    isProOnly: false,
    orderIndex: 1,
    isActive: true,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createSeriesMutation = useMutation({
    mutationFn: (data: CreateSeriesInput) => seriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-series'] });
      setSeriesModalOpen(false);
    },
  });

  const updateSeriesMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSeriesInput> }) =>
      seriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-series'] });
      setSeriesModalOpen(false);
    },
  });

  const deleteSeriesMutation = useMutation({
    mutationFn: (id: string) => seriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-series'] });
    },
  });

  const createLabMutation = useMutation({
    mutationFn: (data: CreateLabInput) => labApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-series-detail'] });
      queryClient.invalidateQueries({ queryKey: ['admin-series'] });
      setLabModalOpen(false);
    },
  });

  const updateLabMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateLabInput> }) =>
      labApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-series-detail'] });
      setLabModalOpen(false);
    },
  });

  const deleteLabMutation = useMutation({
    mutationFn: (id: string) => labApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-series-detail'] });
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const openCreateSeries = () => {
    setEditingSeries(null);
    setSeriesForm({
      title: '',
      category: 'testing',
      description: '',
      level: 'beginner',
      coverEmoji: '🧪',
      isProOnly: false,
      orderIndex: seriesList.length + 1,
      isActive: true,
    });
    setSeriesModalOpen(true);
  };

  const openEditSeries = (s: LabSeries) => {
    setEditingSeries(s);
    setSeriesForm({
      title: s.title,
      slug: s.slug,
      category: s.category || s.topic || 'testing',
      description: s.description,
      level: s.level,
      coverEmoji: s.coverEmoji || '🧪',
      isProOnly: s.isProOnly,
      orderIndex: s.orderIndex || 0,
      isActive: s.isActive ?? true,
    });
    setSeriesModalOpen(true);
  };

  const handleSaveSeries = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSeries) {
      updateSeriesMutation.mutate({ id: editingSeries.id, data: seriesForm });
    } else {
      createSeriesMutation.mutate(seriesForm);
    }
  };

  const handleDeleteSeries = (id: string, title: string) => {
    if (confirm(`Bạn có chắc muốn xóa Topic "${title}"? Mọi bài lab thuộc topic này cũng sẽ bị xóa.`)) {
      deleteSeriesMutation.mutate(id);
    }
  };

  const openCreateLab = () => {
    if (!activeSeries) return;
    setEditingLabId(null);
    setLabForm({
      seriesId: activeSeries.id,
      title: '',
      sandboxType: 'js_worker',
      objective: '',
      instructions: '# Tiêu đề bài học\n\nNội dung lý thuyết và bài tập...',
      initialSnippet: 'function solution() {\n  // Viết code tại đây\n}\n',
      testScript: "assert('Kiem tra co ban', true === true);\n",
      solution: '',
      durationMinutes: 20,
      isProOnly: false,
      orderIndex: (seriesDetail?.labs?.length || 0) + 1,
      isActive: true,
    });
    setLabModalOpen(true);
  };

  const openEditLab = (lab: any) => {
    setEditingLabId(lab.id);
    setLabForm({
      seriesId: activeSeries.id,
      title: lab.title,
      slug: lab.slug,
      sandboxType: lab.sandboxType || 'js_worker',
      objective: lab.objective || '',
      instructions: lab.instructions || '',
      initialSnippet: lab.initialSnippet || '',
      testScript: lab.testScript || '',
      solution: lab.solution || '',
      durationMinutes: lab.durationMinutes || 20,
      isProOnly: lab.isProOnly,
      orderIndex: lab.order || lab.orderIndex || 1,
      isActive: lab.isActive ?? true,
    });
    setLabModalOpen(true);
  };

  const handleSaveLab = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLabId) {
      updateLabMutation.mutate({ id: editingLabId, data: labForm });
    } else {
      createLabMutation.mutate(labForm);
    }
  };

  const handleDeleteLab = (id: string, title: string) => {
    if (confirm(`Bạn có chắc muốn xóa bài "${title}"?`)) {
      deleteLabMutation.mutate(id);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-primary/10 text-primary">
              <Shield className="size-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Studio — Quản lý Nội dung</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Quản trị Topics, Series và các bài thực hành / blog kiến thức trên toàn hệ thống.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {activeTab === 'topics' ? (
            <Button onClick={openCreateSeries} className="gap-2 font-semibold">
              <Plus className="size-4" /> Tạo Topic mới
            </Button>
          ) : (
            <Button onClick={openCreateLab} disabled={!activeSeries} className="gap-2 font-semibold">
              <Plus className="size-4" /> Thêm Bài Lab vào Topic này
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mt-6 border-b border-border pb-px">
        <button
          onClick={() => setActiveTab('topics')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'topics'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="size-4" />
          <span>Danh sách Topics / Series ({seriesList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('labs')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'labs'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Code2 className="size-4" />
          <span>Quản lý Bài Thực hành &amp; Blog</span>
        </button>
      </div>

      {/* ── TAB 1: TOPICS MANAGEMENT ────────────────────────────────────────── */}
      {activeTab === 'topics' && (
        <div className="mt-6">
          {isLoadingSeries ? (
            <p className="text-sm text-muted-foreground">Đang tải danh sách topics...</p>
          ) : seriesList.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl p-8">
              <p className="text-muted-foreground text-sm">Chưa có Topic nào trong cơ sở dữ liệu.</p>
              <Button onClick={openCreateSeries} className="mt-4 gap-2">
                <Plus className="size-4" /> Tạo Topic đầu tiên
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {seriesList.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-border bg-card p-5 hover:border-primary/50 transition-all flex flex-col justify-between shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-3xl p-2 bg-muted rounded-lg">{s.coverEmoji || '🧪'}</span>
                      <div className="flex items-center gap-1.5">
                        {s.isProOnly && (
                          <Badge variant="outline" className="border-amber-500/40 text-amber-500 text-[10px]">
                            PRO
                          </Badge>
                        )}
                        <Badge variant="secondary" className="capitalize text-[10px]">
                          {s.category || s.topic}
                        </Badge>
                      </div>
                    </div>

                    <h3 className="font-semibold text-foreground text-base mt-3 line-clamp-1">{s.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                    <p className="text-[11px] font-mono text-muted-foreground/70 mt-2">slug: {s.slug}</p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {s._count?.labs ?? s.labs?.length ?? 0} bài thực hành
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Link to={`/series/${s.slug}`} target="_blank">
                        <Button variant="ghost" size="icon-sm" title="Xem trên Client">
                          <Eye className="size-3.5 text-muted-foreground hover:text-foreground" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEditSeries(s)}
                        title="Chỉnh sửa Topic"
                      >
                        <Pencil className="size-3.5 text-muted-foreground hover:text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDeleteSeries(s.id, s.title)}
                        title="Xóa Topic"
                      >
                        <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: LABS MANAGEMENT ──────────────────────────────────────────── */}
      {activeTab === 'labs' && (
        <div className="mt-6 space-y-6">
          {/* Topic selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-foreground">Chọn Topic kiến thức:</span>
              <select
                value={activeSeries?.slug || ''}
                onChange={(e) => setSelectedSeriesSlug(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {seriesList.map((s) => (
                  <option key={s.id} value={s.slug}>
                    {s.coverEmoji} {s.title} ({s._count?.labs ?? s.labs?.length ?? 0} bài)
                  </option>
                ))}
              </select>
            </div>

            <Button onClick={openCreateLab} size="sm" className="gap-2">
              <Plus className="size-4" /> Thêm Bài Thực hành
            </Button>
          </div>

          {/* Labs Table */}
          {isLoadingLabs ? (
            <p className="text-sm text-muted-foreground">Đang tải danh sách bài lab...</p>
          ) : !seriesDetail?.labs || seriesDetail.labs.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl p-8">
              <p className="text-muted-foreground text-sm">Topic này chưa có bài lab hoặc bài blog nào.</p>
              <Button onClick={openCreateLab} className="mt-4 gap-2">
                <Plus className="size-4" /> Thêm bài đầu tiên
              </Button>
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Tiêu đề bài học / Blog</th>
                    <th className="py-3 px-4">Loại môi trường</th>
                    <th className="py-3 px-4">Thời lượng</th>
                    <th className="py-3 px-4">Phân quyền</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {seriesDetail.labs.map((lab: any, idx: number) => (
                    <tr key={lab.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-muted-foreground text-xs">{idx + 1}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-foreground">{lab.title}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">/{lab.slug}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className="font-mono text-[11px]">
                          {lab.sandboxType || 'js_worker'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" /> {lab.durationMinutes || 20}p
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {lab.isProOnly ? (
                          <Badge variant="outline" className="border-amber-500/40 text-amber-500 text-[10px]">
                            Pro Only
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 text-[10px]">
                            Free
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link to={`/labs/${lab.slug}`} target="_blank">
                            <Button variant="ghost" size="icon-sm" title="Mở trang Workspace làm bài">
                              <ExternalLink className="size-3.5 text-muted-foreground hover:text-foreground" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEditLab(lab)}
                            title="Sửa nội dung"
                          >
                            <Pencil className="size-3.5 text-muted-foreground hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDeleteLab(lab.id, lab.title)}
                            title="Xóa bài"
                          >
                            <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: CREATE / EDIT TOPIC ───────────────────────────────────────── */}
      {seriesModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-foreground">
              {editingSeries ? 'Chỉnh sửa Topic' : 'Tạo Topic mới'}
            </h2>

            <form onSubmit={handleSaveSeries} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-foreground">Tên Topic / Series *</label>
                <input
                  type="text"
                  required
                  value={seriesForm.title}
                  onChange={(e) => setSeriesForm({ ...seriesForm, title: e.target.value })}
                  placeholder="Ví dụ: SQL Cơ Bản cho Tester"
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Danh mục (Category) *</label>
                  <select
                    value={seriesForm.category}
                    onChange={(e) => setSeriesForm({ ...seriesForm, category: e.target.value })}
                    className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="testing">Testing</option>
                    <option value="backend">Backend</option>
                    <option value="database">Database / SQL</option>
                    <option value="devops">DevOps</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Cấp độ (Level)</label>
                  <select
                    value={seriesForm.level}
                    onChange={(e) => setSeriesForm({ ...seriesForm, level: e.target.value })}
                    className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="beginner">Beginner (Cơ bản)</option>
                    <option value="intermediate">Intermediate (Trung cấp)</option>
                    <option value="advanced">Advanced (Nâng cao)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Cover Emoji</label>
                  <input
                    type="text"
                    value={seriesForm.coverEmoji}
                    onChange={(e) => setSeriesForm({ ...seriesForm, coverEmoji: e.target.value })}
                    placeholder="🧪"
                    className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    value={seriesForm.orderIndex}
                    onChange={(e) => setSeriesForm({ ...seriesForm, orderIndex: parseInt(e.target.value, 10) || 0 })}
                    className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Mô tả tổng quan *</label>
                <textarea
                  required
                  rows={3}
                  value={seriesForm.description}
                  onChange={(e) => setSeriesForm({ ...seriesForm, description: e.target.value })}
                  placeholder="Mô tả nội dung học viên sẽ đạt được sau khi học..."
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="series-pro"
                  checked={seriesForm.isProOnly}
                  onChange={(e) => setSeriesForm({ ...seriesForm, isProOnly: e.target.checked })}
                  className="rounded text-primary focus:ring-primary"
                />
                <label htmlFor="series-pro" className="text-xs text-foreground font-medium cursor-pointer">
                  Khóa học chỉ dành cho tài khoản Pro (Pro Only)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="ghost" onClick={() => setSeriesModalOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={createSeriesMutation.isPending || updateSeriesMutation.isPending}>
                  {editingSeries ? 'Lưu thay đổi' : 'Tạo Topic'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE / EDIT LAB ─────────────────────────────────────────── */}
      {labModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-foreground">
              {editingLabId ? 'Chỉnh sửa Bài Thực hành / Blog' : 'Thêm Bài Thực hành Mới'}
            </h2>

            <form onSubmit={handleSaveLab} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Tiêu đề bài học / Blog *</label>
                <input
                  type="text"
                  required
                  value={labForm.title}
                  onChange={(e) => setLabForm({ ...labForm, title: e.target.value })}
                  placeholder="Ví dụ: Viết câu lệnh SELECT lấy danh sách khách hàng"
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Môi trường thực thi</label>
                  <select
                    value={labForm.sandboxType}
                    onChange={(e) => setLabForm({ ...labForm, sandboxType: e.target.value })}
                    className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="js_worker">JavaScript Worker</option>
                    <option value="sql_worker">SQL Sandbox</option>
                    <option value="markdown_only">Chỉ đọc lý thuyết (Blog)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Thời gian (phút)</label>
                  <input
                    type="number"
                    value={labForm.durationMinutes}
                    onChange={(e) => setLabForm({ ...labForm, durationMinutes: parseInt(e.target.value, 10) || 20 })}
                    className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Thứ tự bài học</label>
                  <input
                    type="number"
                    value={labForm.orderIndex}
                    onChange={(e) => setLabForm({ ...labForm, orderIndex: parseInt(e.target.value, 10) || 1 })}
                    className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Markdown Instructions */}
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Nội dung lý thuyết &amp; đề bài (Hỗ trợ Markdown) *
                </label>
                <textarea
                  required
                  rows={8}
                  value={labForm.instructions}
                  onChange={(e) => setLabForm({ ...labForm, instructions: e.target.value })}
                  placeholder="# Đề bài..."
                  className="w-full mt-1 font-mono text-xs bg-background border border-border rounded-lg p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Initial Snippet */}
              <div>
                <label className="text-xs font-semibold text-foreground">Code khởi đầu (Initial Snippet)</label>
                <textarea
                  rows={4}
                  value={labForm.initialSnippet}
                  onChange={(e) => setLabForm({ ...labForm, initialSnippet: e.target.value })}
                  placeholder="function solution() { ... }"
                  className="w-full mt-1 font-mono text-xs bg-background border border-border rounded-lg p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Test script */}
              <div>
                <label className="text-xs font-semibold text-foreground">Kịch bản chấm điểm tự động (Test Script)</label>
                <textarea
                  rows={4}
                  value={labForm.testScript}
                  onChange={(e) => setLabForm({ ...labForm, testScript: e.target.value })}
                  placeholder="assert('Test case 1', solution() === true);"
                  className="w-full mt-1 font-mono text-xs bg-background border border-border rounded-lg p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Solution */}
              <div>
                <label className="text-xs font-semibold text-foreground">Lời giải chuẩn (Chỉ hiển thị cho Pro/Admin)</label>
                <textarea
                  rows={3}
                  value={labForm.solution}
                  onChange={(e) => setLabForm({ ...labForm, solution: e.target.value })}
                  placeholder="Code đáp án chuẩn..."
                  className="w-full mt-1 font-mono text-xs bg-background border border-border rounded-lg p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="lab-pro"
                  checked={labForm.isProOnly}
                  onChange={(e) => setLabForm({ ...labForm, isProOnly: e.target.checked })}
                  className="rounded text-primary focus:ring-primary"
                />
                <label htmlFor="lab-pro" className="text-xs text-foreground font-medium cursor-pointer">
                  Bài thực hành Pro (Yêu cầu tài khoản Pro để xem đáp án / nộp bài)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="ghost" onClick={() => setLabModalOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={createLabMutation.isPending || updateLabMutation.isPending}>
                  {editingLabId ? 'Lưu bài học' : 'Thêm bài học'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
