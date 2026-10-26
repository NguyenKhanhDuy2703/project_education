import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminBillingSettingsTab } from '@/pages/admin/_components/AdminBillingSettingsTab';
import { AdminUpgradeRequestsTab } from '@/pages/admin/_components/AdminUpgradeRequestsTab';
import { billingAdminApi } from '@/features/admin/api/billing.admin.api';

vi.mock('@/features/admin/api/billing.admin.api', () => ({
  billingAdminApi: {
    getBillingSettings: vi.fn(),
    updateBillingSettings: vi.fn(),
    getUpgradeRequests: vi.fn(),
    approveUpgradeRequest: vi.fn(),
    rejectUpgradeRequest: vi.fn(),
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Admin Billing & Upgrade Reconciliation Suite (Subtask 6.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders billing settings and displays intake status banner', async () => {
    vi.mocked(billingAdminApi.getBillingSettings).mockResolvedValue({
      id: 'bs-1',
      isIntakeEnabled: true,
      bankCode: 'MB',
      bankName: 'MB Bank',
      accountNumber: '123456789',
      accountHolder: 'STUDYIT COMPANY',
      transferSyntax: 'STUDYIT {ref}',
      qrTemplateUrl: null,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin-1',
    });

    renderWithClient(<AdminBillingSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText('ĐANG MỞ BÁN')).toBeDefined();
      expect(screen.getByDisplayValue('MB')).toBeDefined();
      expect(screen.getByDisplayValue('123456789')).toBeDefined();
      expect(screen.getByDisplayValue('STUDYIT COMPANY')).toBeDefined();
    });
  });

  it('renders upgrade request queue, opens approval modal and submits verified bank reference', async () => {
    vi.mocked(billingAdminApi.getUpgradeRequests).mockResolvedValue({
      items: [
        {
          id: 'req-1',
          userId: 'u-1',
          planId: 'plan-pro',
          status: 'PENDING_REVIEW',
          amount: 99000,
          currency: 'VND',
          periodMonths: 1,
          transferRef: 'UP-TEST1234',
          bankDetails: {},
          paymentReference: 'FT999888',
          paymentConfirmedAt: new Date().toISOString(),
          reviewedBy: null,
          reviewedAt: null,
          rejectionReason: null,
          verifiedAmount: null,
          verifiedBankRef: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: {
            id: 'u-1',
            name: 'Bob Learner',
            email: 'bob@example.com',
            phone: null,
            role: 'user',
          },
          plan: {
            id: 'plan-pro',
            code: 'PRO_MONTHLY',
            name: 'Pro Monthly',
            price: 99000,
            billingCycle: 'MONTHLY',
          },
        },
      ],
      meta: { total: 1, page: 1, limit: 15, totalPages: 1 },
    });

    vi.mocked(billingAdminApi.approveUpgradeRequest).mockResolvedValue({} as any);

    renderWithClient(<AdminUpgradeRequestsTab />);

    await waitFor(() => {
      expect(screen.getByText('UP-TEST1234')).toBeDefined();
      expect(screen.getByText('Bob Learner')).toBeDefined();
      expect(screen.getByText('99,000 VND')).toBeDefined();
    });

    // Click Duyệt (Approve) button
    const approveBtn = screen.getByRole('button', { name: /^Duyệt$/ });
    fireEvent.click(approveBtn);

    // Modal opens
    await waitFor(() => {
      expect(screen.getByText('Đối soát & Phê duyệt gói Pro')).toBeDefined();
    });

    // Click confirm approval
    const confirmApproveBtn = screen.getByRole('button', { name: /Xác nhận duyệt & Kích hoạt Pro/i });
    fireEvent.click(confirmApproveBtn);

    await waitFor(() => {
      expect(billingAdminApi.approveUpgradeRequest).toHaveBeenCalledWith('req-1', {
        verifiedBankRef: 'FT999888',
        verifiedAmount: 99000,
      });
    });
  });

  it('opens rejection modal and requires rejection reason', async () => {
    vi.mocked(billingAdminApi.getUpgradeRequests).mockResolvedValue({
      items: [
        {
          id: 'req-2',
          userId: 'u-2',
          planId: 'plan-pro',
          status: 'PENDING_REVIEW',
          amount: 99000,
          currency: 'VND',
          periodMonths: 1,
          transferRef: 'UP-REJECT123',
          bankDetails: {},
          paymentReference: 'FT000111',
          paymentConfirmedAt: new Date().toISOString(),
          reviewedBy: null,
          reviewedAt: null,
          rejectionReason: null,
          verifiedAmount: null,
          verifiedBankRef: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: {
            id: 'u-2',
            name: 'Charlie',
            email: 'charlie@example.com',
            phone: null,
            role: 'user',
          },
          plan: {
            id: 'plan-pro',
            code: 'PRO_MONTHLY',
            name: 'Pro Monthly',
            price: 99000,
            billingCycle: 'MONTHLY',
          },
        },
      ],
      meta: { total: 1, page: 1, limit: 15, totalPages: 1 },
    });

    vi.mocked(billingAdminApi.rejectUpgradeRequest).mockResolvedValue({} as any);

    renderWithClient(<AdminUpgradeRequestsTab />);

    await waitFor(() => {
      expect(screen.getByText('UP-REJECT123')).toBeDefined();
    });

    const rejectBtn = screen.getByTestId('reject-request-btn');
    fireEvent.click(rejectBtn);

    await waitFor(() => {
      expect(screen.getByText('Lý do từ chối *')).toBeDefined();
    });

    const reasonInput = screen.getByPlaceholderText(/Chưa nhận được tiền/i);
    fireEvent.change(reasonInput, { target: { value: 'Nội dung chuyển khoản không tìm thấy' } });

    const confirmRejectBtn = screen.getByRole('button', { name: /Xác nhận từ chối/i });
    fireEvent.click(confirmRejectBtn);

    await waitFor(() => {
      expect(billingAdminApi.rejectUpgradeRequest).toHaveBeenCalledWith('req-2', {
        reason: 'Nội dung chuyển khoản không tìm thấy',
      });
    });
  });

  it('renders detail modal safely when reviewedBy is an object', async () => {
    vi.mocked(billingAdminApi.getUpgradeRequests).mockResolvedValue({
      items: [
        {
          id: 'req-reviewed',
          userId: 'u-3',
          planId: 'plan-pro',
          status: 'APPROVED',
          amount: 199000,
          currency: 'VND',
          periodMonths: 1,
          transferRef: 'UP-APPROVED123',
          bankDetails: {},
          paymentReference: 'FT123456',
          paymentConfirmedAt: new Date().toISOString(),
          reviewedBy: { id: 'admin-99', name: 'Super Admin' } as any,
          reviewedAt: new Date().toISOString(),
          rejectionReason: null,
          verifiedAmount: 199000,
          verifiedBankRef: 'FT123456',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: {
            id: 'u-3',
            name: 'Alice',
            email: 'alice@example.com',
            phone: null,
            role: 'userPro',
          },
          plan: {
            id: 'plan-pro',
            code: 'PRO_MONTHLY',
            name: 'Pro Monthly',
            price: 199000,
            billingCycle: 'MONTHLY',
          },
        } as any,
      ],
      meta: { total: 1, page: 1, limit: 15, totalPages: 1 },
    });

    renderWithClient(<AdminUpgradeRequestsTab />);

    await waitFor(() => {
      expect(screen.getByText('UP-APPROVED123')).toBeDefined();
    });

    // Click view detail (Eye icon button)
    const viewBtn = screen.getByTitle('Xem chi tiết');
    fireEvent.click(viewBtn);

    await waitFor(() => {
      expect(screen.getByText('Chi tiết yêu cầu: UP-APPROVED123')).toBeDefined();
      expect(screen.getByText('Super Admin')).toBeDefined();
    });
  });

  it('saves instructions in billing settings', async () => {
    vi.mocked(billingAdminApi.getBillingSettings).mockResolvedValue({
      id: 'bs-1',
      isIntakeEnabled: true,
      bankCode: 'MB',
      bankName: 'MB Bank',
      accountNumber: '123456789',
      accountHolder: 'STUDYIT COMPANY',
      instructions: 'Hướng dẫn chuyển khoản cũ',
      transferSyntax: 'STUDYIT {ref}',
      qrTemplateUrl: null,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin-1',
    });

    vi.mocked(billingAdminApi.updateBillingSettings).mockResolvedValue({} as any);

    renderWithClient(<AdminBillingSettingsTab />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Hướng dẫn chuyển khoản cũ')).toBeDefined();
    });

    const instructionsTextarea = screen.getByPlaceholderText(/Chuyển khoản chính xác số tiền/i);
    fireEvent.change(instructionsTextarea, { target: { value: 'Hướng dẫn chuyển khoản mới 2026' } });

    const saveBtn = screen.getByRole('button', { name: /Lưu cấu hình/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(billingAdminApi.updateBillingSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          instructions: 'Hướng dẫn chuyển khoản mới 2026',
        }),
      );
    });
  });
});
