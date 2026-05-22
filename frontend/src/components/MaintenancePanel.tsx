import React, { useState, useEffect } from 'react';
import { Lock, Terminal, AlertCircle, Search, Filter, Trash2, Download, LogOut, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { maintenanceApi, LogEntry } from '../lib/maintenance';
import { useLang } from '../contexts/LangContext';

const MaintenancePanel: React.FC = () => {
  const { t } = useLang();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Logs state
  const [selectedCategory, setSelectedCategory] = useState('Maintenance');
  const [categories, setCategories] = useState<string[]>(['Maintenance', 'System', 'API', 'Database']);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  
  // Login state
  const [password, setPassword] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  
  // Fetch logs
  const fetchLogs = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let response;
      if (searchQuery) {
        response = await maintenanceApi.searchLogs(selectedCategory, searchQuery, token);
      } else if (filter !== 'all') {
        response = await maintenanceApi.filterLogs(selectedCategory, filter, token);
      } else {
        response = await maintenanceApi.getLogs(selectedCategory, token);
      }
      
      if (response.success && response.data) {
        setLogs(response.data.logs);
        setFilteredLogs(response.data.logs);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch categories
  const fetchCategories = async () => {
    if (!token) return;
    
    try {
      const response = await maintenanceApi.getCategories(token);
      if (response.success && response.data) {
        setCategories(response.data.categories);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };
  
  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const response = await maintenanceApi.login(password);
      
      if (response.success) {
        setToken(response.data.token);
        setIsAuthenticated(true);
        setPassword('');
      } else {
        setError(response.error || 'Login failed');
        if (response.remainingAttempts !== undefined) {
          setRemainingAttempts(response.remainingAttempts);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    setToken(null);
    setIsAuthenticated(false);
    setLogs([]);
    setFilteredLogs([]);
  };
  
  // Handle clear logs
  const handleClearLogs = async () => {
    if (!token || !confirm(`Are you sure you want to clear ${selectedCategory} logs?`)) return;
    
    setLoading(true);
    
    try {
      const response = await maintenanceApi.clearLogs(selectedCategory, token);
      
      if (response.success) {
        await fetchLogs();
      } else {
        setError(response.error || 'Failed to clear logs');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to clear logs');
    } finally {
      setLoading(false);
    }
  };
  
  // Export logs
  const exportLogs = () => {
    const data = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCategory.toLowerCase()}_logs_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  // Effects
  useEffect(() => {
    if (token) {
      fetchLogs();
      fetchCategories();
    }
  }, [token]);
  
  useEffect(() => {
    if (token) {
      fetchLogs();
    }
  }, [selectedCategory, filter]);
  
  useEffect(() => {
    if (token && searchQuery) {
      fetchLogs();
    }
  }, [searchQuery]);
  
  // Get level color
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'text-blue-400';
      case 'warn': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      case 'debug': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };
  
  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="bg-ink dark:bg-white/10 min-h-screen p-8 flex items-center justify-center relative overflow-hidden">
        {/* Abstract background */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
        
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-lg p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="text-neon" size={32} />
              <div>
                <h3 className="text-2xl font-black font-sans text-ink dark:text-white">
                  MAINTENANCE
                </h3>
                <p className="text-xs font-mono text-gray-400">
                  Restricted Access
                </p>
              </div>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-600 dark:text-gray-400 mb-2">
                  PASSWORD
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-ink dark:text-white font-mono text-sm focus:outline-none focus:border-neon transition-colors"
                  placeholder="Enter maintenance password"
                  disabled={loading}
                />
              </div>
              
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600 dark:text-red-300 font-mono">
                      {error}
                      {remainingAttempts !== null && (
                        <span className="block mt-1 text-[10px]">
                          Remaining attempts: {remainingAttempts}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading || !password}
                className="w-full py-3 bg-neon text-ink font-mono text-sm font-bold rounded-lg hover:bg-neon/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    AUTHENTICATING...
                  </>
                ) : (
                  <>
                    <Terminal size={16} />
                    ACCESS CONSOLE
                  </>
                )}
              </button>
            </form>
            
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/10">
              <p className="text-[10px] font-mono text-gray-400 text-center">
                Unauthorized access attempts are logged and monitored.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Logs viewer
  return (
    <div className="bg-ink dark:bg-white/5 min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="text-neon" size={24} />
            <div>
              <h3 className="text-lg font-black font-sans text-ink dark:text-white">
                SYSTEM LOGS
              </h3>
              <p className="text-[10px] font-mono text-gray-400">
                {selectedCategory} • {filteredLogs.length} entries
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs()}
              disabled={loading}
              className="px-3 py-2 text-xs font-mono border border-gray-200 dark:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors rounded flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              REFRESH
            </button>
            <button
              onClick={exportLogs}
              className="px-3 py-2 text-xs font-mono border border-gray-200 dark:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors rounded flex items-center gap-2"
            >
              <Download size={14} />
              EXPORT
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-xs font-mono border border-gray-200 dark:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors rounded flex items-center gap-2"
            >
              <LogOut size={14} />
              LOGOUT
            </button>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-white/10 px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Category selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-mono text-gray-400">CATEGORY:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-ink dark:text-white font-mono text-xs focus:outline-none focus:border-neon"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          {/* Level filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-mono text-gray-400">LEVEL:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-ink dark:text-white font-mono text-xs focus:outline-none focus:border-neon"
            >
              <option value="all">All</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
              <option value="debug">Debug</option>
            </select>
          </div>
          
          {/* Search */}
          <div className="flex-1 min-w-[200px] flex items-center gap-2">
            <Search size={14} className="text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="flex-1 px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-ink dark:text-white font-mono text-xs focus:outline-none focus:border-neon"
            />
          </div>
          
          {/* Clear logs */}
          <button
            onClick={handleClearLogs}
            disabled={loading}
            className="px-3 py-2 text-xs font-mono bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Trash2 size={14} />
            CLEAR
          </button>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mx-6 mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 dark:text-red-300 font-mono">
              {error}
            </p>
          </div>
        </div>
      )}
      
      {/* Logs display */}
      <div className="px-6 py-4">
        {loading && filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw size={32} className="animate-spin text-neon" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-20">
            <Terminal size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-xs font-mono text-gray-400">
              No logs found in {selectedCategory}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-lg p-4 hover:border-neon/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Level indicator */}
                  <div className={`flex-shrink-0 ${getLevelColor(log.level)}`}>
                    {log.level === 'info' && <CheckCircle size={20} />}
                    {log.level === 'warn' && <AlertCircle size={20} />}
                    {log.level === 'error' && <XCircle size={20} />}
                    {log.level === 'debug' && <Terminal size={20} />}
                  </div>
                  
                  {/* Log content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-gray-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                        <span className="text-[10px] font-mono text-neon bg-neon/5 px-2 py-0.5 rounded">
                          {log.level.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">
                          {log.category}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-xs font-mono text-ink dark:text-white mb-2 break-words">
                      {log.message}
                    </p>
                    
                    {log.data && (
                      <pre className="text-[10px] font-mono text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/5 p-2 rounded overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                    
                    {log.stack && (
                      <details className="mt-2">
                        <summary className="text-[10px] font-mono text-gray-500 cursor-pointer hover:text-gray-400">
                          Show stack trace
                        </summary>
                        <pre className="text-[10px] font-mono text-red-400 bg-red-50 dark:bg-red-900/10 p-2 rounded mt-2 overflow-x-auto">
                          {log.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenancePanel;
