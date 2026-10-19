import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LabTheoryPane } from '../pages/lab/_components/LabTheoryPane';
import type { LabDetail } from '@/types/lab.types';

describe('LabTheoryPane Component Suite (Subtask 3.3)', () => {
  const mockLab: Partial<LabDetail> = {
    id: 'lab-1',
    slug: 'lab-1-test',
    title: 'Theory Demonstration Lab',
    instructions: '# Theoretical Foundation\nThis is instructions body.',
    sandboxType: 'js_worker',
    isProOnly: false,
    solution: 'const answer = 42;',
  };

  it('renders lab title and instructions markdown properly', () => {
    render(
      <MemoryRouter>
        <LabTheoryPane
          lab={mockLab as LabDetail}
          currentLabIndex={0}
          isSolved={false}
          hasSolutionAccess={false}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /1\. Theory Demonstration Lab/i })).toBeDefined();
    expect(screen.getByText(/Theoretical Foundation/i)).toBeDefined();
    expect(screen.getByRole('tab', { name: /Instructions/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /Solution/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /Submissions/i })).toBeDefined();
  });

  it('renders locked solution state and triggers onUpgradeClick', () => {
    const handleUpgrade = vi.fn();

    render(
      <MemoryRouter>
        <LabTheoryPane
          lab={mockLab as LabDetail}
          currentLabIndex={0}
          hasSolutionAccess={false}
          activeTab="solution"
          onUpgradeClick={handleUpgrade}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Exclusive to PRO Accounts/i)).toBeDefined();
    const upgradeButton = screen.getByRole('button', { name: /Unlock PRO Solution/i });
    fireEvent.click(upgradeButton);
    expect(handleUpgrade).toHaveBeenCalled();
  });

  it('renders revealed solution when hasSolutionAccess is true', () => {
    render(
      <MemoryRouter>
        <LabTheoryPane
          lab={mockLab as LabDetail}
          currentLabIndex={0}
          hasSolutionAccess={true}
          activeTab="solution"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Verified Reference Solution \(PRO\)/i)).toBeDefined();
    expect(screen.getByText(/const answer = 42;/i)).toBeDefined();
  });

  it('renders contextual slot when provided', () => {
    render(
      <MemoryRouter>
        <LabTheoryPane
          lab={mockLab as LabDetail}
          currentLabIndex={0}
          hasSolutionAccess={false}
          contextualSlot={<div data-testid="custom-slot">Custom CheatSheet Slot</div>}
        />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('custom-slot')).toBeDefined();
    expect(screen.getByText('Custom CheatSheet Slot')).toBeDefined();
  });
});
