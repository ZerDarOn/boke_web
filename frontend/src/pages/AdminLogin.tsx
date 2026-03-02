import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    console.log('🔐 Login attempt started');

    try {
      setLoading(true);
      console.log('📤 Calling login function...');
      await login(username, password);
      console.log('✅ Login successful, redirecting...');
      navigate('/admin');
    } catch (err: any) {
      console.error('❌ Login failed:', err);
      setError(err.message || '登录失败，请检查用户名和密码');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink/5 dark:bg-black/50">
      <div className="max-w-md w-full p-8">
        <div className="bg-white dark:bg-black/30 rounded-2xl shadow-2xl p-8 border border-ink/10 dark:border-gray-700">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-ink dark:text-paper mb-2">
              🎛 管理后台
            </h1>
            <p className="text-ink/70 dark:text-gray-400">
              INK.SPIRIT Blog 管理系统
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-ink dark:text-paper mb-2">
                用户名
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white dark:bg-black/50 border border-ink/10 dark:border-gray-700 rounded-lg text-ink dark:text-paper focus:ring-2 focus:ring-ink/50 dark:focus:ring-ink placeholder:text-ink/40 dark:placeholder:text-gray-500"
                placeholder="输入用户名"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink dark:text-paper mb-2">
                密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white dark:bg-black/50 border border-ink/10 dark:border-gray-700 rounded-lg text-ink dark:text-paper focus:ring-2 focus:ring-ink/50 dark:focus:ring-ink placeholder:text-ink/40 dark:placeholder:text-gray-500"
                placeholder="输入密码"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-ink text-white dark:text-black rounded-lg font-medium hover:bg-ink/80 dark:hover:bg-ink/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-ink/70 dark:text-gray-400">
              默认账户：cyber.ronin / admin123
            </p>
            <a
              href="/"
              className="text-ink hover:text-ink/80 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
            >
              ← 返回网站首页
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
