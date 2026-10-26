import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  billingAdminApi,
  type BillingSettingsRecord,
} from '@/features/admin/api/billing.admin.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

export function AdminBillingSettingsTab() {
  const qc = useQueryClient();
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    isIntakeEnabled: false,
    bankCode: '',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    instructions: '',
    transferSyntax: '',
    qrTemplateUrl: '',
  });

  const { data: settings, isLoading } = useQuery<BillingSettingsRecord>({
    queryKey: ['admin-billing-settings'],
    queryFn: billingAdminApi.getBillingSettings,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        isIntakeEnabled: settings.isIntakeEnabled ?? false,
        bankCode: settings.bankCode ?? '',
        bankName: settings.bankName ?? '',
        accountNumber: settings.accountNumber ?? '',
        accountHolder: settings.accountHolder ?? '',
        instructions: settings.instructions ?? '',
        transferSyntax: settings.transferSyntax ?? 'STUDYIT {ref}',
        qrTemplateUrl: settings.qrTemplateUrl ?? '',
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: () =>
      billingAdminApi.updateBillingSettings({
        isIntakeEnabled: form.isIntakeEnabled,
        bankCode: form.bankCode.trim() || undefined,
        bankName: form.bankName.trim() || undefined,
        accountNumber: form.accountNumber.trim() || undefined,
        accountHolder: form.accountHolder.trim() || undefined,
        instructions: form.instructions.trim() || undefined,
        transferSyntax: form.transferSyntax.trim() || undefined,
        qrTemplateUrl: form.qrTemplateUrl.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-billing-settings'] });
      setFeedback({ text: 'Cấu hình ngân hàng & mở bán đã được lưu thành công', type: 'success' });
      setTimeout(() => setFeedback(null), 3500);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Không thể lưu cấu hình thanh toán';
      setFeedback({ text: msg, type: 'error' });
      setTimeout(() => setFeedback(null), 5000);
    },
  });

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="size-5 animate-spin text-primary" />
        <span>Đang tải cấu hình ngân hàng...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Toast feedback */}
      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-600 border border-rose-500/30'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="size-4 shrink-0" />
          ) : (
            <AlertTriangle className="size-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Intake Toggle Banner */}
      <div
        className={`p-5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          form.isIntakeEnabled
            ? 'bg-emerald-500/5 border-emerald-500/30'
            : 'bg-amber-500/5 border-amber-500/30'
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-foreground">Trạng thái nhận đơn nâng cấp Pro</h2>
            {form.isIntakeEnabled ? (
              <Badge className="bg-emerald-600 text-white text-[10px] font-bold">ĐANG MỞ BÁN</Badge>
            ) : (
              <Badge variant="secondary" className="text-amber-600 bg-amber-500/10 text-[10px] font-bold">
                TẠM DỪNG NHẬN ĐƠN
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {form.isIntakeEnabled
              ? 'Học viên có thể gửi yêu cầu nâng cấp gói Pro. Vui lòng đảm bảo thông tin số tài khoản chính xác.'
              : 'Cổng tiếp nhận yêu cầu mới đang tắt. Học viên không thể tạo yêu cầu mới. Các yêu cầu đã tạo vẫn được đối soát bình thường.'}
          </p>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-foreground shrink-0 bg-background/80 px-3.5 py-2 rounded-lg border border-border">
          <input
            type="checkbox"
            checked={form.isIntakeEnabled}
            onChange={(e) => setForm({ ...form, isIntakeEnabled: e.target.checked })}
            className="rounded border-border text-primary focus:ring-primary size-4"
          />
          <span>{form.isIntakeEnabled ? 'Bật nhận đơn (Active)' : 'Tắt nhận đơn (Disabled)'}</span>
        </label>
      </div>

      {/* Warning when activating without bank details */}
      {form.isIntakeEnabled && (!form.bankCode || !form.accountNumber || !form.accountHolder) && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
          <ShieldAlert className="size-4 shrink-0" />
          <span>
            Cảnh báo: Bạn đang bật nhận đơn nhưng chưa điền đầy đủ Mã ngân hàng, Số tài khoản hoặc Tên chủ tài khoản!
          </span>
        </div>
      )}

      {/* Bank Account Details Form */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <Building2 className="size-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Tài khoản ngân hàng thụ hưởng (VietQR / Chuyển khoản)</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Mã ngân hàng (VietQR / Napas Bin) *</label>
            <Input
              placeholder="e.g. MB, VCB, ACB, TPB"
              value={form.bankCode}
              onChange={(e) => setForm({ ...form, bankCode: e.target.value })}
              className="h-9 text-xs"
            />
            <p className="text-[10px] text-muted-foreground">Mã chuẩn Napas (dùng tạo mã VietQR tự động)</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Tên ngân hàng đầy đủ</label>
            <Input
              placeholder="e.g. Ngân hàng TMCP Quân Đội (MB Bank)"
              value={form.bankName}
              onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Số tài khoản thụ hưởng *</label>
            <Input
              placeholder="e.g. 0987654321"
              value={form.accountNumber}
              onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
              className="h-9 text-xs font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Tên chủ tài khoản (In hoa không dấu) *</label>
            <Input
              placeholder="e.g. CONG TY TNHH STUDYIT"
              value={form.accountHolder}
              onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
              className="h-9 text-xs uppercase"
            />
          </div>
        </div>

        <div className="space-y-1 pt-2">
          <label className="text-xs font-semibold text-foreground">Cú pháp nội dung chuyển khoản mẫu</label>
          <Input
            placeholder="STUDYIT {ref}"
            value={form.transferSyntax}
            onChange={(e) => setForm({ ...form, transferSyntax: e.target.value })}
            className="h-9 text-xs font-mono"
          />
          <p className="text-[10px] text-muted-foreground">
            Ký tự <code className="bg-muted px-1 rounded font-bold">{'{ref}'}</code> sẽ được thay thế bằng mã yêu cầu của học viên (ví dụ UP-ABC123XY).
          </p>
        </div>

        <div className="space-y-1 pt-2">
          <label className="text-xs font-semibold text-foreground">Hướng dẫn chuyển khoản cho học viên</label>
          <Textarea
            placeholder="Chuyển khoản chính xác số tiền và ghi mã chuyển khoản vào nội dung giao dịch."
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            rows={3}
            className="text-xs resize-none"
          />
          <p className="text-[10px] text-muted-foreground">
            Nội dung hiển thị trên trang hướng dẫn thanh toán và email/thông báo gửi học viên.
          </p>
        </div>

        <div className="space-y-1 pt-2">
          <label className="text-xs font-semibold text-foreground">Mẫu URL VietQR (Tùy chọn nâng cao)</label>
          <Input
            placeholder="https://img.vietqr.io/image/{bankCode}-{accountNumber}-compact2.png?amount={amount}&addInfo={ref}"
            value={form.qrTemplateUrl}
            onChange={(e) => setForm({ ...form, qrTemplateUrl: e.target.value })}
            className="h-9 text-xs font-mono"
          />
          <p className="text-[10px] text-muted-foreground">
            Hỗ trợ các biến: <code className="bg-muted px-1 rounded">{'{bankCode}'}</code>, <code className="bg-muted px-1 rounded">{'{accountNumber}'}</code>, <code className="bg-muted px-1 rounded">{'{amount}'}</code>, <code className="bg-muted px-1 rounded">{'{ref}'}</code>.
          </p>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {settings?.updatedAt && `Cập nhật lần cuối: ${new Date(settings.updatedAt).toLocaleString()}`}
          </span>
          <Button
            size="sm"
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="gap-1.5 font-bold text-xs"
          >
            {updateMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            <span>Lưu cấu hình</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
