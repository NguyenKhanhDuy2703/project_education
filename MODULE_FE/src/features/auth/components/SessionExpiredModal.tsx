import React from 'react';
import { AlertCircle, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/stores/store';
import { logout } from '@/stores/slices/auth.slice';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  if (!isOpen) return null;

  const handleLoginRedirect = () => {
    dispatch(logout());
    if (onClose) onClose();
    navigate('/login');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl space-y-4">
        <div className="flex items-center space-x-3 text-amber-400">
          <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 id="session-expired-title" className="text-lg font-semibold text-neutral-100">
              Phiên Đăng Nhập Đã Hết Hạn
            </h3>
            <p className="text-xs text-neutral-400">
              Session Expired
            </p>
          </div>
        </div>

        <p className="text-sm text-neutral-300 leading-relaxed">
          Phiên làm việc của bạn đã hết hạn bảo mật trên máy chủ. Vui lòng đăng nhập lại để tiếp tục lưu tiến độ làm bài và truy cập các tài nguyên.
        </p>

        <div className="pt-2 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleLoginRedirect}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-medium text-sm transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Đăng nhập lại</span>
          </button>
        </div>
      </div>
    </div>
  );
};
