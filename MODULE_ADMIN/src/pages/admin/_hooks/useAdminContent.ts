import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { seriesApi } from '@/features/lab/api/series.api';
import { labApi } from '@/features/lab/api/lab.api';
import type { CreateSeriesInput, CreateLabInput, LabSeries } from '@/types/lab.types';

export function useAdminContent() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'topics' | 'labs'>('topics');
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
    category: 'database',
    formatType: 'sql_worker',
    description: '',
    level: 'beginner',
    coverEmoji: '',
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
      showToast('Topic created successfully!');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to create Topic', 'error');
    },
  });

  const updateSeriesMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSeriesInput> }) =>
      seriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-series'] });
      setSeriesModalOpen(false);
      showToast('Topic updated successfully!');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to update Topic', 'error');
    },
  });

  const deleteSeriesMutation = useMutation({
    mutationFn: (id: string) => seriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-series'] });
      showToast('Topic deleted successfully!');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to delete Topic', 'error');
    },
  });

  const createLabMutation = useMutation({
    mutationFn: (data: CreateLabInput) => labApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-series-detail'] });
      queryClient.invalidateQueries({ queryKey: ['admin-series'] });
      setLabModalOpen(false);
      showToast('Practice lab created successfully!');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to create lab', 'error');
    },
  });

  const updateLabMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateLabInput> }) =>
      labApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-series-detail'] });
      setLabModalOpen(false);
      showToast('Practice lab updated successfully!');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to update lab', 'error');
    },
  });

  const deleteLabMutation = useMutation({
    mutationFn: (id: string) => labApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-series-detail'] });
      queryClient.invalidateQueries({ queryKey: ['admin-series'] });
      showToast('Practice lab deleted successfully!');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to delete lab', 'error');
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const openCreateSeries = () => {
    setEditingSeries(null);
    setSeriesForm({
      title: '',
      category: 'database',
      formatType: 'sql_worker',
      description: '',
      level: 'beginner',
      coverEmoji: '',
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
      category: s.category || s.topic || 'database',
      formatType: s.formatType || 'sql_worker',
      description: s.description,
      level: s.level,
      coverEmoji: s.coverEmoji || '',
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
    if (confirm(`Are you sure you want to delete Series "${title}"? All labs inside this series will also be permanently deleted.`)) {
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
      instructions: '# Lab Title\n\n## Introduction\nProvide theoretical overview and core concepts here...\n\n## Assignment Requirements\nImplement the function to satisfy the requirements...',
      initialSnippet: 'function solution() {\n  // Your code here\n}\n',
      testScript: "assert('Basic function validation', typeof solution === 'function');\n",
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

  const applyPreset = (type: 'js' | 'sql' | 'quizlet' | 'blog') => {
    if (type === 'js') {
      setLabForm((prev) => ({
        ...prev,
        sandboxType: 'js_worker',
        instructions: `# JavaScript Exercise\n\n## Problem Statement\nWrite a function \`findMax(arr)\` that takes an array of integers and returns the maximum value.\n\n## Example\n\`\`\`js\nfindMax([1, 5, 3]) // 5\nfindMax([-10, -5]) // -5\n\`\`\``,
        initialSnippet: 'function findMax(arr) {\n  // Implement your algorithm here\n}\n',
        testScript: "assert('Positive numbers array', findMax([1, 5, 3]) === 5);\nassert('Negative numbers array', findMax([-10, -5]) === -5);\n",
        solution: 'function findMax(arr) {\n  return Math.max(...arr);\n}',
      }));
    } else if (type === 'sql') {
      setLabForm((prev) => ({
        ...prev,
        sandboxType: 'sql_worker',
        instructions: `# SQL Query Lab\n\n## Problem Statement\nWrite an SQL query to retrieve all customers residing in \`San Francisco\` ordered by latest creation date.\n\n\`\`\`sql\nSELECT * FROM customers WHERE city = 'San Francisco' ORDER BY created_at DESC;\n\`\`\``,
        initialSnippet: "SELECT * FROM customers WHERE ...;\n",
        testScript: "SELECT * FROM customers WHERE city = 'San Francisco' ORDER BY created_at DESC;",
        solution: "SELECT * FROM customers WHERE city = 'San Francisco' ORDER BY created_at DESC;",
        sqlSchema: "CREATE TABLE customers (id INT, full_name VARCHAR, city VARCHAR, created_at TIMESTAMP);",
      }));
    } else if (type === 'quizlet') {
      setLabForm((prev) => ({
        ...prev,
        sandboxType: 'quizlet',
        instructions: `# Database Indexing & Performance Quiz\n\n**B-Tree Index** is the default self-balancing tree structure in PostgreSQL that accelerates lookups from O(N) to O(log N).\n\n### Instructions:\nAnswer all quiz questions below correctly to test your indexing knowledge.`,
        initialSnippet: '',
        testScript: '',
        solution: '1. B-Tree | 2. Columns in WHERE/JOIN | 3. Increases INSERT/UPDATE write overhead',
        quizQuestions: [
          {
            id: 'q1',
            question: 'Which index type is default in PostgreSQL when creating a Primary Key?',
            options: ['Hash Index', 'B-Tree Index', 'GIN Index', 'BRIN Index'],
            correctIndex: 1,
            explanation: 'B-Tree is the default and most versatile index structure for equality and range comparisons.',
          },
          {
            id: 'q2',
            question: 'Indexing which column typically yields the greatest performance improvement?',
            options: [
              'A column with extremely low cardinality (e.g. Gender)',
              'A column frequently filtered in WHERE clauses and JOIN predicates',
              'Any arbitrary column in the table',
              'A large binary BLOB column',
            ],
            correctIndex: 1,
            explanation: 'Indexes should target selective columns frequently evaluated in filter and join criteria.',
          },
        ],
      }));
    } else {
      setLabForm((prev) => ({
        ...prev,
        sandboxType: 'markdown_only',
        instructions: `# Overview of QA & Software Testing\n\nSoftware testing is the process of evaluating and verifying that software does what it is supposed to do.\n\n### Main Testing Levels:\n- **Unit Testing**: Tests individual components or functions.\n- **Integration Testing**: Verifies communication between modules.\n- **System Testing**: Evaluates end-to-end integrated system functionality.\n- **Acceptance Testing (UAT)**: Validates end-user business requirements.`,
        initialSnippet: '',
        testScript: '',
        solution: '',
      }));
    }
    showToast(`Applied ${type.toUpperCase()} preset!`);
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
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
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
