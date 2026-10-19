import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminTopicHierarchy } from '@/pages/admin/_components/AdminTopicHierarchy';
import type { LabSeries } from '@/types/lab.types';

describe('AdminTopicHierarchy Component Suite', () => {
  const mockTopics: LabSeries[] = [
    {
      id: 'topic-1',
      title: 'SQL Database Engineering',
      slug: 'sql-database-engineering',
      description: 'Advanced relational modeling and indexing',
      category: 'database',
      formatType: 'sql_worker',
      orderIndex: 1,
      isActive: true,
      isProOnly: false,
      level: 'beginner',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      labs: [
        {
          id: 'lab-101',
          seriesId: 'topic-1',
          title: 'PostgreSQL Indexing & Explain',
          slug: 'pg-indexing-sql',
          sandboxType: 'sql_worker',
          order: 1,
          isProOnly: false,
        },
        {
          id: 'lab-102',
          seriesId: 'topic-1',
          title: 'ACID Transactions Practice',
          slug: 'acid-transactions',
          sandboxType: 'sql_worker',
          order: 2,
          isProOnly: false,
        },
      ],
    },
    {
      id: 'topic-2',
      title: 'Quiz Flashcards & Vocabulary',
      slug: 'quiz-flashcards',
      description: 'Concept verification quizzes',
      category: 'quiz',
      formatType: 'quizlet',
      orderIndex: 2,
      isActive: true,
      isProOnly: false,
      level: 'beginner',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      labs: [
        {
          id: 'lab-201',
          seriesId: 'topic-2',
          title: 'Security Concepts Quiz',
          slug: 'security-quiz',
          sandboxType: 'quizlet',
          order: 1,
          isProOnly: false,
        },
      ],
    },
    {
      id: 'topic-3',
      title: 'Backend Node.js API',
      slug: 'backend-nodejs-api',
      description: 'Microservices and HTTP routes',
      category: 'backend',
      formatType: 'js_worker',
      orderIndex: 3,
      isActive: true,
      isProOnly: false,
      level: 'beginner',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      labs: [
        {
          id: 'lab-301',
          seriesId: 'topic-3',
          title: 'Express JWT Validation Lab',
          slug: 'express-jwt-lab',
          sandboxType: 'js_worker',
          order: 1,
          isProOnly: false,
        },
      ],
    },
  ];

  const defaultProps = {
    isLoading: false,
    topics: mockTopics,
    onCreateTopic: vi.fn(),
    onEditTopic: vi.fn(),
    onDeleteTopic: vi.fn(),
    onDeleteLab: vi.fn(),
  };

  it('renders loading state when isLoading is true', () => {
    render(<AdminTopicHierarchy {...defaultProps} isLoading={true} />);
    expect(screen.getByText(/loading topic and lab hierarchy/i)).toBeTruthy();
  });

  it('renders topics and lab items with correct format badges', () => {
    render(<AdminTopicHierarchy {...defaultProps} />);

    // Topics rendered
    expect(screen.getByText('SQL Database Engineering')).toBeTruthy();
    expect(screen.getByText('Quiz Flashcards & Vocabulary')).toBeTruthy();
    expect(screen.getByText('Backend Node.js API')).toBeTruthy();

    // Labs rendered
    expect(screen.getByText('PostgreSQL Indexing & Explain')).toBeTruthy();
    expect(screen.getByText('ACID Transactions Practice')).toBeTruthy();
    expect(screen.getByText('Security Concepts Quiz')).toBeTruthy();
    expect(screen.getByText('Express JWT Validation Lab')).toBeTruthy();

    // Badges rendered based on formatType
    expect(screen.getByText('SQL Sandbox')).toBeTruthy();
    expect(screen.getByText('Quiz Flashcard')).toBeTruthy();
    expect(screen.getByText('Code Sandbox')).toBeTruthy();
  });

  it('filters topics and nested labs when typing in search input', () => {
    render(<AdminTopicHierarchy {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/search topics or nested labs/i);

    // Filter for "PostgreSQL"
    fireEvent.change(searchInput, { target: { value: 'PostgreSQL' } });

    expect(screen.getByText('SQL Database Engineering')).toBeTruthy();
    expect(screen.getByText('PostgreSQL Indexing & Explain')).toBeTruthy();
    // Non-matching topics should be filtered out
    expect(screen.queryByText('Backend Node.js API')).toBeNull();
    expect(screen.queryByText('Quiz Flashcards & Vocabulary')).toBeNull();
  });

  it('collapses and expands topic labs when clicking toggle button', () => {
    render(<AdminTopicHierarchy {...defaultProps} />);

    expect(screen.getByText('PostgreSQL Indexing & Explain')).toBeTruthy();

    // Click collapse button for first topic
    const collapseButtons = screen.getAllByTitle('Collapse labs');
    expect(collapseButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(collapseButtons[0]);

    // Collapsed state hides nested labs
    expect(screen.queryByText('PostgreSQL Indexing & Explain')).toBeNull();

    // Expand again
    const expandButtons = screen.getAllByTitle('Expand labs');
    expect(expandButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(expandButtons[0]);
    expect(screen.getByText('PostgreSQL Indexing & Explain')).toBeTruthy();
  });

  it('calls onEditTopic and onDeleteTopic when topic action buttons are clicked', () => {
    const onEditTopic = vi.fn();
    const onDeleteTopic = vi.fn();

    render(
      <AdminTopicHierarchy
        {...defaultProps}
        onEditTopic={onEditTopic}
        onDeleteTopic={onDeleteTopic}
      />
    );

    const editButtons = screen.getAllByRole('button', { name: /^edit$/i });
    expect(editButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(editButtons[0]);
    expect(onEditTopic).toHaveBeenCalledWith(mockTopics[0]);

    const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i });
    expect(deleteButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(deleteButtons[0]);
    expect(onDeleteTopic).toHaveBeenCalledWith('topic-1', 'SQL Database Engineering');
  });

  it('calls onDeleteLab when delete button on nested lab is clicked', () => {
    const onDeleteLab = vi.fn();
    render(<AdminTopicHierarchy {...defaultProps} onDeleteLab={onDeleteLab} />);

    // Nested lab table contains a row for PostgreSQL Indexing & Explain
    const labRow = screen.getByText('PostgreSQL Indexing & Explain').closest('tr');
    expect(labRow).toBeTruthy();

    const deleteLabButton = labRow?.querySelector('button');
    expect(deleteLabButton).toBeTruthy();
    if (deleteLabButton) {
      fireEvent.click(deleteLabButton);
      expect(onDeleteLab).toHaveBeenCalledWith('lab-101', 'PostgreSQL Indexing & Explain');
    }
  });
});
