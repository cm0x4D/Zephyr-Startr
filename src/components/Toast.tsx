import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-item toast-${t.type}`}>
          <div className="toast-content">
            {t.type === 'success' && <CheckCircle2 className="icon-xs text-success" />}
            {t.type === 'warning' && <AlertCircle className="icon-xs text-warning" />}
            {t.type === 'info' && <Info className="icon-xs text-info" />}
            <span className="toast-text">{t.message}</span>
          </div>
          <button type="button" className="toast-close" onClick={() => onDismiss(t.id)}>
            <X className="icon-xs" />
          </button>
        </div>
      ))}
    </div>
  );
};
