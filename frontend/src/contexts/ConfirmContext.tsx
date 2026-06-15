import React, { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface ConfirmOptions {
  /** 标题，默认"请确认" */
  title?: string;
  /** 正文说明 */
  message: string;
  /** 确认按钮文案，默认"确定" */
  confirmText?: string;
  /** 取消按钮文案，默认"取消" */
  cancelText?: string;
  /** 是否为危险操作（删除等），确认按钮显示为红色，默认 true */
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | undefined>(undefined);

/**
 * 统一的异步确认弹窗。替代原生 window.confirm，风格与后台设计语言一致。
 *
 * @example
 * const confirm = useConfirm();
 * if (!(await confirm({ message: '确定要删除吗？' }))) return;
 */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return ctx;
}

interface DialogState extends ConfirmOptions {
  open: boolean;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>({ open: false, message: '' });
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    setState({ ...options, open: true });
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = useCallback((result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  const danger = state.danger !== false;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state.open && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => close(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between px-6 pt-6 pb-2">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    danger
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  }`}
                >
                  <AlertTriangle size={20} />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-1.5">
                  {state.title || '请确认'}
                </h2>
              </div>
              <button
                onClick={() => close(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="关闭"
              >
                <X size={18} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="px-6 pb-6 pt-2 pl-[4.75rem]">
              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                {state.message}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <button
                onClick={() => close(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {state.cancelText || '取消'}
              </button>
              <button
                onClick={() => close(true)}
                autoFocus
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  danger
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {state.confirmText || '确定'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
