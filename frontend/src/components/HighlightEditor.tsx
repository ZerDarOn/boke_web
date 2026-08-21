import { Plus, Trash2, Video } from 'lucide-react';
import type { MediaHighlight } from '../lib/mediaHighlights';

interface HighlightEditorProps {
  accent: 'cyan' | 'purple';
  highlights: MediaHighlight[];
  onChange: (highlights: MediaHighlight[]) => void;
}

const accentStyles = {
  cyan: 'border-cyan-200 bg-cyan-50 text-cyan-700 focus:border-cyan-500 focus:ring-cyan-500',
  purple: 'border-purple-200 bg-purple-50 text-purple-700 focus:border-purple-500 focus:ring-purple-500',
};

const emptyHighlight = (): MediaHighlight => ({
  title: '',
  url: '',
  thumbnail: '',
  description: '',
});

const HighlightEditor = ({ accent, highlights, onChange }: HighlightEditorProps) => {
  const handleFieldChange = (index: number, field: keyof MediaHighlight, value: string) => {
    onChange(highlights.map((highlight, currentIndex) => (
      currentIndex === index ? { ...highlight, [field]: value } : highlight
    )));
  };

  const handleAdd = () => onChange([...highlights, emptyHighlight()]);

  const handleRemove = (index: number) => {
    onChange(highlights.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <section className="space-y-3" aria-label="精彩片段">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Video size={16} />
            精彩视频片段
          </h3>
          <p className="mt-1 text-xs text-gray-500">最多 8 条，填写外部视频链接；页面只提供跳转，不嵌入第三方播放器。</p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={highlights.length >= 8}
          className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${accentStyles[accent]}`}
        >
          <Plus size={14} />
          添加片段
        </button>
      </div>

      {highlights.map((highlight, index) => (
        <div key={`${highlight.url}-${index}`} className="space-y-3 rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-mono text-gray-400">片段 {index + 1}</span>
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
            >
              <Trash2 size={14} />
              删除
            </button>
          </div>
          <input
            type="text"
            value={highlight.title}
            onChange={(event) => handleFieldChange(index, 'title', event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2"
            placeholder="片段标题，例如：最终 Boss 战"
            aria-label={`片段 ${index + 1} 的标题`}
          />
          <input
            type="url"
            value={highlight.url}
            onChange={(event) => handleFieldChange(index, 'url', event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2"
            placeholder="https://www.bilibili.com/video/..."
            aria-label={`片段 ${index + 1} 的视频链接`}
          />
          <input
            type="url"
            value={highlight.thumbnail || ''}
            onChange={(event) => handleFieldChange(index, 'thumbnail', event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2"
            placeholder="封面图片链接（可选）"
            aria-label={`片段 ${index + 1} 的封面链接`}
          />
          <textarea
            value={highlight.description || ''}
            onChange={(event) => handleFieldChange(index, 'description', event.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2"
            placeholder="为什么值得看（可选）"
            aria-label={`片段 ${index + 1} 的说明`}
          />
        </div>
      ))}
    </section>
  );
};

export default HighlightEditor;
