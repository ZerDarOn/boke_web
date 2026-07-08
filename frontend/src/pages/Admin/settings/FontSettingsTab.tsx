import React, { useCallback } from 'react';
import { RefreshCw, Plus, X, ExternalLink } from 'lucide-react';

import type { SettingsTabProps } from './types';

const FONT_PRESETS: { label: string; value: string }[] = [
  // 无衬线
  { label: '系统无衬线', value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  { label: 'Orbitron', value: '"Orbitron", sans-serif' },
  { label: 'Inter', value: '"Inter", sans-serif' },
  { label: 'Noto Sans SC', value: '"Noto Sans SC", sans-serif' },
  // 衬线
  { label: 'Noto Serif SC', value: '"Noto Serif SC", "SimSun", "STSong", serif' },
  { label: 'Source Han Serif', value: '"Source Han Serif", "SimSun", serif' },
  { label: '系统宋体', value: '"SimSun", "STSong", "Songti SC", serif' },
  // 等宽
  { label: 'JetBrains Mono', value: '"JetBrains Mono", "Fira Code", monospace' },
  { label: 'Fira Code', value: '"Fira Code", monospace' },
  { label: '系统等宽', value: '"Courier New", "Source Code Pro", monospace' },
];

const RESET = {
  sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  serif: '"Noto Serif SC", "SimSun", "STSong", serif',
  mono: '"JetBrains Mono", "Fira Code", monospace',
};

/** 在字体族字符串和预设值之间互转 */
const matchPreset = (raw: string) => {
  const found = FONT_PRESETS.find((p) => p.value === raw);
  return found ? found.value : raw;
};

const FontSettingsTab: React.FC<SettingsTabProps> = ({ config, updateConfig }) => {
  const fonts = config.fontSettings;
  const imports = fonts?.imports ?? [];

  const handleFont = useCallback(
    (role: 'sans' | 'serif' | 'mono', value: string) => {
      const next = { ...fonts, [role]: value };
      updateConfig('fontSettings', next);
    },
    [fonts, updateConfig],
  );

  const removeImport = useCallback(
    (url: string) => {
      updateConfig('fontSettings', { ...fonts, imports: imports.filter((u) => u !== url) });
    },
    [fonts, imports, updateConfig],
  );

  const addImport = useCallback(() => {
    const url = window.prompt('请输入 Google Fonts 或其它字体 URL:');
    if (url?.trim()) {
      updateConfig('fontSettings', { ...fonts, imports: [...imports, url.trim()] });
    }
  }, [fonts, imports, updateConfig]);

  const resetAll = () => {
    updateConfig('fontSettings', { ...RESET, imports });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">字体设置</h3>
      <p className="text-sm text-gray-500">
        调整全站字体；选择预设或直接键入自定义字体族。需要外部字体时请在下方添加导入链接。
      </p>

      {/* 三栏字体选择 */}
      <div className="grid grid-cols-1 gap-5">
        {(
          [
            { role: 'sans' as const, label: '无衬线 (标题/默认)', key: 'sans' },
            { role: 'serif' as const, label: '衬线 (正文/板块标题)', key: 'serif' },
            { role: 'mono' as const, label: '等宽 (标签/日期/代码)', key: 'mono' },
          ] as const
        ).map(({ role, label }) => {
          const raw = fonts[role] ?? RESET[role];
          const preset = matchPreset(raw);
          const isPreset = FONT_PRESETS.some((p) => p.value === raw);

          return (
            <div key={role} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

              {/* 预设下拉 */}
              <select
                value={isPreset ? raw : '__custom__'}
                onChange={(e) => {
                  if (e.target.value !== '__custom__') handleFont(role, e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="__custom__">自定义…</option>
                {FONT_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>

              {/* 自由输入：总是显示，方便微调（如改 fallback） */}
              <input
                type="text"
                value={raw}
                onChange={(e) => handleFont(role, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500"
                placeholder="直接输入字体族，如: 'Inter', sans-serif"
              />

              {/* 实时预览 */}
              <p className="mt-2 text-sm text-gray-400 truncate" style={{ fontFamily: raw }}>
                预览：{fonts[role]}
              </p>
            </div>
          );
        })}
      </div>

      {/* 外部字体导入 */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          外部字体导入
        </label>
        <p className="text-xs text-gray-400 mb-3">
          粘贴 Google Fonts 链接或其它 @font-face 的 CSS 地址，保存后会自动加载。
        </p>
        <div className="space-y-2 mb-3">
          {imports.map((url) => (
            <div key={url} className="flex items-center gap-2 text-sm font-mono bg-white px-3 py-2 rounded-lg border group">
              <ExternalLink size={12} className="text-gray-400 flex-shrink-0" />
              <span className="flex-1 truncate text-gray-600">{url}</span>
              <button
                onClick={() => removeImport(url)}
                className="p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {imports.length === 0 && (
            <p className="text-xs text-gray-400 py-1">暂未导入外部字体</p>
          )}
        </div>
        <button
          onClick={addImport}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Plus size={16} />
          添加字体链接
        </button>
      </div>

      {/* 重置 */}
      <div className="pt-4 border-t">
        <button
          onClick={resetAll}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw size={16} />
          重置为默认字体
        </button>
      </div>
    </div>
  );
};

export default FontSettingsTab;
