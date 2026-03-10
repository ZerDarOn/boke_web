import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    this.logError(error, errorInfo);
  }

  logError(error: Error, errorInfo: ErrorInfo) {
    const errorData = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    console.error('Error Boundary caught an error:', errorData);

    // 尝试发送到后端
    if (typeof fetch !== 'undefined') {
      fetch('/api/error/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      }).catch((err) => {
        console.error('Failed to log error to server:', err);
      });
    }

    // 也可以存储到 localStorage
    try {
      const errorLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      errorLogs.push(errorData);
      localStorage.setItem('errorLogs', JSON.stringify(errorLogs.slice(-50))); // 只保留最近50条
    } catch (err) {
      console.error('Failed to save error to localStorage:', err);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-white dark:bg-[#111] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
              {/* Error Icon and Header */}
              <div className="bg-gradient-to-r from-red-500 to-orange-500 p-8 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <AlertTriangle size={32} />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold mb-2">出现错误</h1>
                    <p className="text-white/80">抱歉，页面遇到了一些问题</p>
                  </div>
                </div>
              </div>

              {/* Error Details */}
              <div className="p-8">
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="mb-6">
                    <h2 className="text-sm font-mono font-bold text-gray-500 dark:text-gray-400 mb-3">
                      ERROR DETAILS (Development Mode)
                    </h2>
                    <div className="bg-gray-100 dark:bg-[#222] rounded-lg p-4 overflow-auto max-h-60">
                      <p className="font-mono text-sm text-red-600 dark:text-red-400 mb-2">
                        {this.state.error.name}: {this.state.error.message}
                      </p>
                      {this.state.error.stack && (
                        <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {this.state.error.stack}
                        </pre>
                      )}
                    </div>
                  </div>
                )}

                {/* Error Message */}
                <div className="mb-8">
                  <p className="text-gray-600 dark:text-gray-300 text-lg mb-4">
                    页面加载时发生了意外错误。这可能是临时的网络问题或应用程序的异常。
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    错误信息已记录，我们正在努力解决。您可以尝试刷新页面或返回首页。
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={this.handleReload}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-neon text-white rounded-lg hover:bg-neon/90 transition-colors font-medium"
                  >
                    <RefreshCw size={18} />
                    刷新页面
                  </button>
                  <button
                    onClick={this.handleGoHome}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-white/20 transition-colors font-medium"
                  >
                    <Home size={18} />
                    返回首页
                  </button>
                </div>

                {/* Additional Info */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
                  <details className="group">
                    <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                      查看错误详情
                    </summary>
                    <div className="mt-4 text-sm font-mono text-gray-600 dark:text-gray-400 space-y-2">
                      <div>
                        <span className="font-bold">时间：</span>
                        {this.state.error && new Date().toLocaleString('zh-CN')}
                      </div>
                      <div>
                        <span className="font-bold">页面：</span>
                        {window.location.href}
                      </div>
                      {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                        <div>
                          <span className="font-bold">组件堆栈：</span>
                          <pre className="mt-2 text-xs bg-gray-100 dark:bg-[#222] p-2 rounded overflow-auto">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
              如果问题持续存在，请联系管理员
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
