import React, { useState } from 'react';
import { Upload, Image as ImageIcon, XCircle, Loader2 } from 'lucide-react';
import { uploadImage, type UploadImageType } from '../../../lib/upload';
import HighlightEditor from '../../../components/HighlightEditor';
import type { MediaHighlight } from '../../../lib/mediaHighlights';
import { useToastActions } from '../../../contexts/ToastContext';
import type { CrudAccent, FieldConfig, FieldOption } from './types';

const FOCUS_CLASSES: Record<CrudAccent, string> = {
  purple: 'focus:ring-2 focus:ring-purple-500 focus:border-purple-500',
  cyan: 'focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500',
  orange: 'focus:ring-2 focus:ring-orange-500 focus:border-orange-500',
};

const UPLOAD_HOVER_CLASSES: Record<CrudAccent, string> = {
  purple: 'hover:border-purple-500',
  cyan: 'hover:border-cyan-500',
  orange: 'hover:border-orange-500',
};

const BASE_INPUT =
  'w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400';

function toOptions(options?: FieldOption[] | string[]): { value: string; label: string }[] {
  if (!options) return [];
  return options.map((opt) => (typeof opt === 'string' ? { value: opt, label: opt } : opt));
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

/** 图片上传 + 预览 + 链接输入（原 AdminGames / AdminAnime 的内联实现收敛于此） */
const ImageField: React.FC<{
  value: string;
  onChange: (value: string) => void;
  uploadType: UploadImageType;
  previewClassName: string;
  accent: CrudAccent;
}> = ({ value, onChange, uploadType, previewClassName, accent }) => {
  const toast = useToastActions();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadImage(file, uploadType);
      onChange(url);
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err instanceof Error ? err.message : '图片上传失败，请重试');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label
        className={`flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 ${UPLOAD_HOVER_CLASSES[accent]} rounded-lg cursor-pointer transition-colors`}
      >
        {uploading ? (
          <Loader2 size={18} className="animate-spin text-gray-600 dark:text-gray-300" />
        ) : (
          <Upload size={18} className="text-gray-600 dark:text-gray-300" />
        )}
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {uploading ? '上传中...' : '点击上传图片'}
        </span>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleUpload}
          className="hidden"
          disabled={uploading}
        />
      </label>

      {value && (
        <div className="relative inline-block">
          <img src={value} alt="预览" className={`object-cover rounded-lg border border-gray-300 dark:border-gray-600 ${previewClassName}`} />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-colors"
          >
            <XCircle size={16} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <ImageIcon size={18} className="text-gray-600 dark:text-gray-300" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${BASE_INPUT} ${FOCUS_CLASSES[accent]}`}
          placeholder="或输入图片链接..."
        />
      </div>
    </div>
  );
};

/**
 * 按配置渲染单个表单字段。
 * 所有输入统一带暗色样式（原 Games/Anime 弹窗只有浅色，属体验缺口，这里统一补齐）。
 */
export const AdminField: React.FC<{
  field: FieldConfig;
  formData: Record<string, any>;
  onChange: (key: string, value: unknown) => void;
  accent: CrudAccent;
}> = ({ field, formData, onChange, accent }) => {
  const value = formData[field.key];
  const focus = FOCUS_CLASSES[accent];
  const requiredMark = field.required && <span className="text-red-500 ml-1">*</span>;

  const renderControl = () => {
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value ?? ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            rows={field.rows ?? 4}
            placeholder={field.placeholder ?? `请输入${field.label}`}
            className={`${BASE_INPUT} ${focus} ${field.inputClassName ?? ''}`}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            min={field.min}
            max={field.max}
            step={field.step}
            value={value ?? ''}
            onChange={(e) => {
              if (e.target.value === '') {
                // 清空按 0 提交：后端 validateBody 的 stripNulls 会丢弃 null 键，
                // 发 null/省略键都无法清除已有值，置 0 才能真正生效
                onChange(field.key, 0);
                return;
              }
              onChange(field.key, Number(e.target.value));
            }}
            placeholder={field.placeholder}
            className={`${BASE_INPUT} ${focus}`}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={value ?? ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            className={`${BASE_INPUT} ${focus}`}
          />
        );
      case 'select':
        return (
          <select
            value={value ?? ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            disabled={field.disabled}
            className={`${BASE_INPUT} ${focus} disabled:opacity-60`}
          >
            {toOptions(field.options).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      case 'boolean':
        return (
          <select
            value={value ? 'true' : 'false'}
            onChange={(e) => onChange(field.key, e.target.value === 'true')}
            className={`${BASE_INPUT} ${focus}`}
          >
            <option value="true">是</option>
            <option value="false">否</option>
          </select>
        );
      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer pt-6">
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => onChange(field.key, e.target.checked)}
              className="w-4 h-4 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{field.placeholder ?? field.label}</span>
          </label>
        );
      case 'array':
        return (
          <input
            type="text"
            value={toStringArray(value).join(', ')}
            onChange={(e) =>
              onChange(
                field.key,
                e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
              )
            }
            placeholder={field.placeholder ?? `用逗号分隔多个${field.label}`}
            className={`${BASE_INPUT} ${focus}`}
          />
        );
      case 'lines':
        return (
          <textarea
            value={toStringArray(value).join('\n')}
            onChange={(e) =>
              onChange(field.key, e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))
            }
            rows={field.rows ?? 4}
            placeholder={field.placeholder}
            className={`${BASE_INPUT} ${focus}`}
          />
        );
      case 'color':
        return (
          <div className="flex gap-2">
            <input
              type="color"
              value={value || '#a855f7'}
              onChange={(e) => onChange(field.key, e.target.value)}
              className="w-12 h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent"
            />
            <input
              type="text"
              value={value ?? ''}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder="#a855f7"
              className={`flex-1 ${BASE_INPUT} ${focus}`}
            />
          </div>
        );
      case 'image':
        return (
          <ImageField
            value={typeof value === 'string' ? value : ''}
            onChange={(url) => onChange(field.key, url)}
            uploadType={(field.uploadType ?? 'gallery') as UploadImageType}
            previewClassName={field.previewClassName ?? 'w-32 h-24'}
            accent={accent}
          />
        );
      case 'highlights':
        return (
          <HighlightEditor
            accent={accent === 'cyan' ? 'cyan' : 'purple'}
            highlights={Array.isArray(value) ? (value as MediaHighlight[]) : []}
            onChange={(highlights) => onChange(field.key, highlights)}
          />
        );
      case 'custom':
        return <>{field.render?.(value, (v) => onChange(field.key, v), formData)}</>;
      case 'text':
      default:
        return (
          <input
            type="text"
            value={value ?? ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder ?? `请输入${field.label}`}
            disabled={field.disabled}
            className={`${BASE_INPUT} ${focus} disabled:opacity-60 ${field.inputClassName ?? ''}`}
          />
        );
    }
  };

  return (
    <div className={field.colSpan === 2 ? 'md:col-span-2' : undefined}>
      {field.type !== 'checkbox' && field.type !== 'highlights' && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {field.label}
          {requiredMark}
        </label>
      )}
      {renderControl()}
      {field.hint && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{field.hint}</p>}
    </div>
  );
};

/** 双列网格渲染一组字段（colSpan=2 占满整行） */
export const FormFields: React.FC<{
  fields: FieldConfig[];
  formData: Record<string, any>;
  onChange: (key: string, value: unknown) => void;
  accent?: CrudAccent;
}> = ({ fields, formData, onChange, accent = 'purple' }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {fields
      .filter((field) => !field.visible || field.visible(formData))
      .map((field) => (
        <AdminField key={field.key} field={field} formData={formData} onChange={onChange} accent={accent} />
      ))}
  </div>
);
