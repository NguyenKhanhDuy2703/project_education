import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { seriesApi } from '@/features/lab/api/series.api';
import { labApi } from '@/features/lab/api/lab.api';
import type { CreateSeriesInput, CreateLabInput, LabSeries } from '@/types/lab.types';

export function useAdminContent() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'topics' | 'labs' | 'users' | 'plans' | 'audit'>('topics');
  const [selectedSeriesSlug, setSelectedSeriesSlug] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ── Modal States ───────────────────────────────────────────────────────────
  const [seriesModalOpen, setSeriesModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<LabSeries | null>(null);

  const [labModalOpen, setLabModalOpen] = useState(false);
  const [editingLabId, setEditingLabId] = useState<string | null>(null);
  const [labPreviewTab, setLabPreviewTab] = useState<'edit' | 'preview'>('edit');

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

  // ── Stats Summary ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalTopics = seriesList.length;
    const totalLabs = seriesList.reduce((acc, s) => acc + (s._count?.labs ?? s.labs?.length ?? 0), 0);
    const proTopics = seriesList.filter((s) => s.isProOnly).length;
    return { totalTopics, totalLabs, proTopics };
  }, [seriesList]);

  // ── Filtered Series ────────────────────────────────────────────────────────
  const filteredSeries = useMemo(() => {
    if (!searchTerm.trim()) return seriesList;
    const q = searchTerm.toLowerCase();
    return seriesList.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.category || s.topic || '').toLowerCase().includes(q)
    );
  }, [seriesList, searchTerm]);

  // ── Filtered Labs ──────────────────────────────────────────────────────────
  const filteredLabs = useMemo(() => {
    const labs = seriesDetail?.labs || [];
    if (!searchTerm.trim()) return labs;
    const q = searchTerm.toLowerCase();
    return labs.filter(
      (l: any) =>
        l.title.toLowerCase().includes(q) ||
        l.slug.toLowerCase().includes(q) ||
        (l.sandboxType || '').toLowerCase().includes(q)
    );
  }, [seriesDetail, searchTerm]);

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
      showToast('Đã tạo Topic mới thành công!');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Lỗi khi tạo Topic', 'error');
    },
  });

  const updateSeriesMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSeriesInput> }) =>
      seriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-series'] });
      setSeriesModalOpen(false);
      showToast('Đã cập nhật Topic thành công!');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Lỗi khi cập nhật Topic', 'error');
    },
  });

  const deleteSeriesMutation = useMutation({
    mutationFn: (id: string) => seriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-series'] });
      showToast('Đã xóa Topic thành công!');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Lỗi khi xóa Topic', 'error');
    },
  });

  const createLabMutation = useMutation({
    mutationFn: (data: CreateLabInput) => labApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-series-detail'] });
      queryClient.invalidateQueries({ queryKey: ['admin-series'] });
      setLabModalOpen(false);
      showToast('Đã thêm bài thực hành mới thành công!');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Lỗi khi thêm bài học', 'error');
    },
  });

  const updateLabMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateLabInput> }) =>
      labApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-series-detail'] });
      setLabModalOpen(false);
      showToast('Đã cập nhật bài thực hành thành công!');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Lỗi khi cập nhật bài học', 'error');
    },
  });

  const deleteLabMutation = useMutation({
    mutationFn: (id: string) => labApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-series-detail'] });
      queryClient.invalidateQueries({ queryKey: ['admin-series'] });
      showToast('Đã xóa bài thực hành!');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Lỗi khi xóa bài học', 'error');
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
    if (confirm(`Bạn có chắc muốn xóa Topic "${title}"? Mọi bài thực hành thuộc topic này cũng sẽ bị xóa vĩnh viễn.`)) {
      deleteSeriesMutation.mutate(id);
    }
  };

  const openCreateLab = () => {
    if (!activeSeries) return;
    setEditingLabId(null);
    setLabPreviewTab('edit');
    setLabForm({
      seriesId: activeSeries.id,
      title: '',
      sandboxType: 'js_worker',
      objective: '',
      instructions: '# Tiêu đề bài thực hành\n\n## Giới thiệu\nTrình bày kiến thức nền tảng tại đây...\n\n## Yêu cầu bài tập\nViết hàm thực hiện yêu cầu...',
      initialSnippet: 'function solution() {\n  // Code của bạn ở đây\n}\n',
      testScript: "assert('Kiểm tra hàm cơ bản', typeof solution === 'function');\n",
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
    setLabPreviewTab('edit');
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

  const applyPreset = (type: 'js' | 'sql' | 'blog') => {
    if (type === 'js') {
      setLabForm((prev) => ({
        ...prev,
        sandboxType: 'js_worker',
        instructions: `# Bài tập JavaScript\n\n## Đề bài\nViết hàm \`findMax(arr)\` nhận vào một mảng số nguyên và trả về giá trị lớn nhất.\n\n## Ví dụ\n\`\`\`js\nfindMax([1, 5, 3]) // 5\nfindMax([-10, -5]) // -5\n\`\`\``,
        initialSnippet: 'function findMax(arr) {\n  // Triển khai thuật toán tại đây\n}\n',
        testScript: "assert('Mảng số dương', findMax([1, 5, 3]) === 5);\nassert('Mảng số âm', findMax([-10, -5]) === -5);\n",
        solution: 'function findMax(arr) {\n  return Math.max(...arr);\n}',
      }));
    } else if (type === 'sql') {
      setLabForm((prev) => ({
        ...prev,
        sandboxType: 'sql_worker',
        instructions: `# Truy vấn SQL\n\n## Đề bài\nViết câu lệnh SQL lấy toàn bộ khách hàng có địa chỉ tại \`Hà Nội\` và sắp xếp theo ngày tạo mới nhất.\n\n\`\`\`sql\nSELECT * FROM customers WHERE city = 'Hà Nội' ORDER BY created_at DESC;\n\`\`\``,
        initialSnippet: "SELECT * FROM customers WHERE ...;\n",
        testScript: "assert('Query syntax valid', query.includes('SELECT') && query.includes('WHERE'));",
        solution: "SELECT * FROM customers WHERE city = 'Hà Nội' ORDER BY created_at DESC;",
      }));
    } else {
      setLabForm((prev) => ({
        ...prev,
        sandboxType: 'markdown_only',
        instructions: `# Tổng quan Kiến thức QA / Testing\n\nKiểm thử phần mềm là một quá trình đánh giá phần mềm nhằm phát hiện lỗi và đảm bảo chất lượng.\n\n### Các cấp độ kiểm thử chính:\n- **Unit Testing**: Kiểm thử từng hàm/module nhỏ.\n- **Integration Testing**: Kiểm thử tích hợp các module.\n- **System Testing**: Kiểm thử toàn diện hệ thống.\n- **Acceptance Testing**: Kiểm thử chấp nhận của người dùng (UAT).`,
        initialSnippet: '',
        testScript: '',
        solution: '',
      }));
    }
    showToast(`Đã áp dụng mẫu ${type.toUpperCase()}!`);
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

  return {
    // Tab
    activeTab,
    setActiveTab,
    // Search
    searchTerm,
    setSearchTerm,
    // Toast
    toastMessage,
    setToastMessage,
    // Data
    seriesList,
    activeSeries,
    filteredSeries,
    filteredLabs,
    isLoadingSeries,
    isLoadingLabs,
    stats,
    // Series modal
    seriesModalOpen,
    setSeriesModalOpen,
    editingSeries,
    seriesForm,
    setSeriesForm,
    openCreateSeries,
    openEditSeries,
    handleSaveSeries,
    handleDeleteSeries,
    isSeriesPending: createSeriesMutation.isPending || updateSeriesMutation.isPending,
    // Labs modal
    labModalOpen,
    setLabModalOpen,
    editingLabId,
    labForm,
    setLabForm,
    labPreviewTab,
    setLabPreviewTab,
    openCreateLab,
    openEditLab,
    applyPreset,
    handleSaveLab,
    handleDeleteLab,
    isLabPending: createLabMutation.isPending || updateLabMutation.isPending,
    // Series selector (labs tab)
    setSelectedSeriesSlug,
  };
}
