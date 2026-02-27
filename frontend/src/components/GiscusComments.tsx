import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface Comment {
  id: string;
  username: string;
  content: string;
  timestamp: number;
}

interface SimpleCommentsProps {
  theme?: 'light' | 'dark';
}

const SimpleComments: React.FC<SimpleCommentsProps> = ({ theme = 'dark' }) => {
  const location = useLocation();
  const [comments, setComments] = useState<Comment[]>([]);
  const [username, setUsername] = useState('');
  const [content, setContent] = useState('');

  const storageKey = `comments-${location.pathname}`;

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setComments(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse comments:', e);
      }
    }
  }, [storageKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !content.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      username: username.trim(),
      content: content.trim(),
      timestamp: Date.now()
    };

    const updated = [newComment, ...comments];
    setComments(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setContent('');
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full mt-12">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-white/10 p-6">
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="用户名"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-ink dark:text-white placeholder-gray-400 focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all"
              maxLength={50}
            />
          </div>
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="写下你的评论..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-ink dark:text-white placeholder-gray-400 focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-all resize-none"
              maxLength={500}
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-neon text-white font-mono text-sm rounded hover:bg-neon/80 transition-colors"
          >
            发表评论
          </button>
        </form>

        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-ink dark:text-white font-mono">
                    {comment.username}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {formatDate(comment.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-ink dark:text-gray-200 leading-relaxed">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8 font-mono text-sm">
            还没有评论，快来发表第一条吧！
          </p>
        )}
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-400 dark:text-gray-600 font-mono">
          评论仅保存在本地浏览器中
        </p>
      </div>
    </div>
  );
};

export default SimpleComments;