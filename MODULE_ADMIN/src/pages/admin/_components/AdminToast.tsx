import { CheckCircle, AlertTriangle, X } from 'lucide-react';

interface AdminToastProps {
  message: { text: string; type: 'success' | 'error' } | null;
  onClose: () => void;
}

export function AdminToast({ message, onClose }: AdminToastProps) {
  if (!message) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-in slide-in-from-bottom-5 transition-all ${
        message.type === 'success'
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
          : 'bg-destructive/10 border-destructive/30 text-destructive'
      }`}
    >
      {message.type === 'success' ? (
        <CheckCircle className="size-4 shrink-0" />
      ) : (
        <AlertTriangle className="size-4 shrink-0" />
      )}
      <span>{message.text}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X className="size-3.5" />
      </button>
    </div>
  );
}
