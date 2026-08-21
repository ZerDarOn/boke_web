import React, { useRef, useState } from 'react';
import { Loader2, MousePointer2, RefreshCw, Upload } from 'lucide-react';
import { defaultCursorConfig, toCursorCssValue, type CursorConfig } from '../../../config/cursor-config';
import { uploadCursor } from '../../../lib/upload';
import type { SettingsTabProps } from './types';

const cursorSlots: Array<{
  key: keyof Omit<CursorConfig, 'enabled' | 'trailEnabled'>;
  label: string;
  hint: string;
  fallback: string;
}> = [
  { key: 'default', label: '普通选择', hint: '页面空白、普通文字', fallback: 'auto' },
  { key: 'pointer', label: '链接选择', hint: '按钮、链接、可点击卡片', fallback: 'pointer' },
  { key: 'text', label: '文本选择', hint: '输入框与可选择正文', fallback: 'text' },
  { key: 'move', label: '移动', hint: '可拖拽内容', fallback: 'move' },
  { key: 'resizeHorizontal', label: '水平调整', hint: '左右调整尺寸', fallback: 'ew-resize' },
  { key: 'resizeVertical', label: '垂直调整', hint: '上下调整尺寸', fallback: 'ns-resize' },
  { key: 'resizeDiagonal1', label: '对角调整一', hint: '左上至右下', fallback: 'nwse-resize' },
  { key: 'resizeDiagonal2', label: '对角调整二', hint: '右上至左下', fallback: 'nesw-resize' },
];

const CursorSettingsTab: React.FC<SettingsTabProps> = ({ config, updateConfig }) => {
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const inputRefs = useRef<Partial<Record<string, HTMLInputElement | null>>>({});

  const handleUpload = async (slot: (typeof cursorSlots)[number], file?: File) => {
    if (!file) return;
    setUploading(slot.key);
    setError('');
    try {
      const url = await uploadCursor(file);
      updateConfig(`cursorConfig.${slot.key}`, url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '光标上传失败');
    } finally {
      setUploading(null);
      const input = inputRefs.current[slot.key];
      if (input) input.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">鼠标光标</h3>
        <p className="mt-1 text-sm text-gray-500">
          当前内置 Ori 2.0。上传后请点击页面右上角“保存设置”，前台会自动同步。
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
          <span>
            <span className="block font-medium text-gray-900">启用自定义光标</span>
            <span className="text-xs text-gray-500">触屏设备会自动使用系统触控行为</span>
          </span>
          <input
            type="checkbox"
            checked={config.cursorConfig.enabled}
            onChange={(event) => updateConfig('cursorConfig.enabled', event.target.checked)}
            className="h-5 w-5 accent-blue-600"
          />
        </label>
        <label className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
          <span>
            <span className="block font-medium text-gray-900">霓虹尾迹</span>
            <span className="text-xs text-gray-500">可选光效，关闭时性能开销更低</span>
          </span>
          <input
            type="checkbox"
            checked={config.cursorConfig.trailEnabled}
            onChange={(event) => updateConfig('cursorConfig.trailEnabled', event.target.checked)}
            className="h-5 w-5 accent-blue-600"
          />
        </label>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cursorSlots.map((slot) => {
          const value = config.cursorConfig[slot.key];
          return (
            <div key={slot.key} className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-medium text-gray-900">{slot.label}</h4>
                  <p className="text-xs text-gray-500">{slot.hint}</p>
                </div>
                <MousePointer2 size={18} className="shrink-0 text-blue-600" />
              </div>
              <div
                className="mt-4 flex h-20 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-600"
                style={{ cursor: toCursorCssValue(value, slot.fallback) }}
                title="把鼠标移到这里预览"
              >
                移入此处预览
              </div>
              <p className="mt-2 truncate font-mono text-[11px] text-gray-400" title={value}>{value}</p>
              <button
                type="button"
                onClick={() => inputRefs.current[slot.key]?.click()}
                disabled={uploading !== null}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
              >
                {uploading === slot.key ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                {uploading === slot.key ? '上传中…' : '替换文件'}
              </button>
              <input
                ref={(element) => { inputRefs.current[slot.key] = element; }}
                type="file"
                accept=".cur,.png,image/png"
                className="hidden"
                onChange={(event) => handleUpload(slot, event.target.files?.[0])}
              />
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <p className="text-xs text-gray-500">支持 .cur 和透明 .png（推荐 .cur，热点更准确），单个不超过 1MB；.ani 暂不支持网页。</p>
        <button
          type="button"
          onClick={() => updateConfig('cursorConfig', defaultCursorConfig)}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        >
          <RefreshCw size={16} />
          恢复 Ori 2.0
        </button>
      </div>
    </div>
  );
};

export default CursorSettingsTab;
