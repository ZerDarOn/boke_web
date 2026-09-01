import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

interface ToastActions {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

// 拆分为两个 context：actions 引用恒定，toast 弹出/消失只触发
// ToastContainer 重渲染，不再牵连 20 个消费 useToastActions 的组件
const ToastActionsContext = createContext<ToastActions | undefined>(undefined);
const ToastStateContext = createContext<Toast[] | undefined>(undefined);

function useToastActionsContext() {
  const context = useContext(ToastActionsContext);
  if (!context) {
    throw new Error('useToastActions must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    if (!toast.persistent) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 3000);
    }
  }, [removeToast]);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const actions = useMemo(
    () => ({ addToast, removeToast, clearToasts }),
    [addToast, removeToast, clearToasts]
  );

  return (
    <ToastActionsContext.Provider value={actions}>
      <ToastStateContext.Provider value={toasts}>
        {children}
        <ToastContainer />
      </ToastStateContext.Provider>
    </ToastActionsContext.Provider>
  );
}

function ToastContainer() {
  const toasts = useContext(ToastStateContext) ?? [];
  const { removeToast } = useToastActionsContext();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  const colors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg shadow-lg border-2
        animate-in slide-in-from-right-full duration-300
        ${colors[toast.type]}
      `}
    >
      <div className="flex-shrink-0 mt-0.5">
        {icons[toast.type]}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{toast.title}</p>
        {toast.message && (
          <p className="text-sm mt-1 opacity-90">{toast.message}</p>
        )}
      </div>

      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity"
        aria-label="关闭"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// 便捷的 toast 方法（引用稳定，可安全用于依赖数组与 memo 子组件）
export function useToastActions() {
  const { addToast } = useToastActionsContext();

  return useMemo(
    () => ({
      success: (title: string, message?: string) => addToast({ type: 'success', title, message }),
      error: (title: string, message?: string) => addToast({ type: 'error', title, message, duration: 5000 }),
      warning: (title: string, message?: string) => addToast({ type: 'warning', title, message, duration: 4000 }),
      info: (title: string, message?: string) => addToast({ type: 'info', title, message, duration: 3000 }),
    }),
    [addToast]
  );
}
