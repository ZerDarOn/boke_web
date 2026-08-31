import type { ReactNode } from 'react';

/** 表单下拉选项 */
export interface FieldOption {
  value: string;
  label: string;
}

/**
 * 通用表单字段配置。
 * formData 中的值约定：
 * - array / lines 字段持有真实 string[]（渲染时负责 join/split）
 * - boolean / checkbox 字段持有真实 boolean
 * - number 字段持有 number | undefined（清空输入框时置 undefined，提交时省略该键）
 */
export interface FieldConfig<T = Record<string, any>> {
  key: string;
  label: string;
  type:
    | 'text'
    | 'textarea'
    | 'number'
    | 'date'
    | 'select'
    | 'boolean' // 是/否 下拉，值为 boolean
    | 'checkbox' // 单个勾选框，值为 boolean
    | 'array' // 逗号分隔数组
    | 'lines' // 换行分隔数组（每行一条）
    | 'color' // 取色器 + 十六进制文本
    | 'image' // 图片上传 + 预览 + 链接输入
    | 'highlights' // 媒体高光编辑器
    | 'custom'; // 完全自定义渲染
  options?: FieldOption[] | string[];
  placeholder?: string;
  required?: boolean;
  rows?: number;
  /** 在网格中占据的列数，默认 1（满行为 2） */
  colSpan?: 1 | 2;
  min?: number;
  max?: number;
  step?: number;
  /** image 类型：上传目录（lib/upload 的 UploadImageType） */
  uploadType?: string;
  /** image 类型：预览图尺寸类名 */
  previewClassName?: string;
  /** 字段下方的小字提示 */
  hint?: string;
  /** 条件显隐 */
  visible?: (formData: T) => boolean;
  /** custom 类型的渲染函数 */
  render?: (value: unknown, onChange: (value: unknown) => void, formData: T) => ReactNode;
  /** 渲染为禁用态（如 Projects 详情模式下只读的项目名） */
  disabled?: boolean;
  /** 附加到输入框的类名（如 font-mono） */
  inputClassName?: string;
}

/** 统计卡配置 */
export interface StatConfig {
  label: string;
  value: string | number;
  icon?: ReactNode;
  tone?: 'blue' | 'green' | 'pink' | 'yellow' | 'orange' | 'gray' | 'purple';
  /** tinted = 浅色渐变卡（默认），solid = 实色渐变卡 */
  variant?: 'tinted' | 'solid';
}

/** 主题色（影响聚焦环 / 保存按钮 / 新建按钮） */
export type CrudAccent = 'purple' | 'cyan' | 'orange';
