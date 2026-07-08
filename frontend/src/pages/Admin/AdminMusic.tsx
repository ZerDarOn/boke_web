import React, { useState } from 'react';
import {
  Plus, Edit, Trash2, Loader2, X, Save, Music, Eye, EyeOff, Info,
} from 'lucide-react';
import {
  useMusicSources,
  useSaveMusicSources,
} from '../../hooks/queries/settings';
import {
  MUSIC_SERVERS,
  MUSIC_SOURCE_TYPES,
  type MusicSource,
} from '../../lib/musicConfig';
import { useToastActions } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';

const emptyForm: Partial<MusicSource> = {
  name: '',
  server: 'netease',
  type: 'playlist',
  sourceId: '',
  enabled: true,
};

const serverLabel = (v: string) => MUSIC_SERVERS.find((s) => s.value === v)?.label || v;
const typeLabel = (v: string) => MUSIC_SOURCE_TYPES.find((t) => t.value === v)?.label || v;

const AdminMusic: React.FC = () => {
  const toast = useToastActions();
  const confirm = useConfirm();
  const { data: sources = [], isLoading, error: queryError } = useMusicSources();
  const saveMutation = useSaveMusicSources();
  const saving = saveMutation.isPending;
  const error = queryError?.message ?? null;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<MusicSource | null>(null);
  const [formData, setFormData] = useState<Partial<MusicSource>>(emptyForm);

  const persist = async (next: MusicSource[]) => {
    try {
      await saveMutation.mutateAsync(next);
      return true;
    } catch {
      toast.error('保存失败');
      return false;
    }
  };

  const handleCreate = () => {
    setEditing(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const handleEdit = (s: MusicSource) => {
    setEditing(s);
    setFormData({ ...s });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ message: '确定要删除这个歌单吗？' }))) return;
    const ok = await persist(sources.filter((s) => s.id !== id));
    if (ok) toast.success('已删除');
  };

  const toggleEnabled = async (s: MusicSource) => {
    await persist(sources.map((x) => (x.id === s.id ? { ...x, enabled: !x.enabled } : x)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.sourceId?.trim()) {
      toast.warning('请填写歌单名称和 ID');
      return;
    }
    let next: MusicSource[];
    if (editing) {
      next = sources.map((s) => (s.id === editing.id ? ({ ...s, ...formData } as MusicSource) : s));
    } else {
      const created: MusicSource = {
        id: `ms_${Date.now()}`,
        name: formData.name!.trim(),
        server: (formData.server as MusicSource['server']) || 'netease',
        type: (formData.type as MusicSource['type']) || 'playlist',
        sourceId: formData.sourceId!.trim(),
        enabled: formData.enabled ?? true,
      };
      next = [...sources, created];
    }
    const ok = await persist(next);
    if (ok) {
      setIsModalOpen(false);
      toast.success(editing ? '已保存' : '已添加');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
          <Info size={16} className="mt-0.5 flex-shrink-0 text-blue-500" />
          <p className="leading-relaxed">
            在这里维护前台「音乐馆」的歌单。歌单 ID = 歌单网页地址里的数字，例如网易云
            <code className="mx-1 px-1 bg-gray-100 dark:bg-gray-700 rounded">music.163.com/#/playlist?id=<b>123456</b></code>
            里的 <b>123456</b>。改完即时生效，无需重新构建。
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-neon text-white rounded-lg hover:bg-neon/90 transition-colors"
        >
          <Plus size={20} />
          添加歌单
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-300 font-mono text-sm">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-neon" size={32} />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">歌单名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">音源</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">类型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sources.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                        <Music size={14} className="text-neon" />
                        {s.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{serverLabel(s.server)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{typeLabel(s.type)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 dark:text-gray-400">{s.sourceId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleEnabled(s)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          s.enabled
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                        }`}
                        title={s.enabled ? '已启用，点击禁用' : '已禁用，点击启用'}
                      >
                        {s.enabled ? <Eye size={12} /> : <EyeOff size={12} />}
                        {s.enabled ? '显示中' : '已隐藏'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(s)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sources.length === 0 && (
            <div className="text-center py-12">
              <Music size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">还没有歌单，点右上角「添加歌单」开始</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editing ? '编辑歌单' : '添加歌单'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">歌单名称 *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-neon focus:border-transparent"
                  placeholder="前台切换标签显示的名字，如「古风」"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">音源</label>
                  <select
                    value={formData.server || 'netease'}
                    onChange={(e) => setFormData({ ...formData, server: e.target.value as MusicSource['server'] })}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-neon focus:border-transparent"
                  >
                    {MUSIC_SERVERS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">类型</label>
                  <select
                    value={formData.type || 'playlist'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as MusicSource['type'] })}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-neon focus:border-transparent"
                  >
                    {MUSIC_SOURCE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">歌单 / 资源 ID *</label>
                <input
                  type="text"
                  value={formData.sourceId || ''}
                  onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono focus:ring-2 focus:ring-neon focus:border-transparent"
                  placeholder="歌单地址里的数字 ID，如 123456789"
                  required
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.enabled ?? true}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="w-4 h-4 accent-neon"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">在前台显示这个歌单</span>
              </label>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-neon text-white rounded-lg hover:bg-neon/90 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {editing ? '保存' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMusic;
