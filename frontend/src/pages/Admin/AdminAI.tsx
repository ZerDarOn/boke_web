import React, { useState, useEffect } from 'react';
import {
  Brain, Loader2, Check, AlertCircle, RefreshCw, Save, Server,
} from 'lucide-react';
import { aiApi } from '../../lib/api';

interface SettingField {
  key: string;
  label: string;
  placeholder?: string;
  secret?: boolean;
  hint?: string;
}

interface SettingGroup {
  title: string;
  description?: string;
  fields: SettingField[];
}

const SECRET_PLACEHOLDER = '********';

const GROUPS: SettingGroup[] = [
  {
    title: '聊天模型（OpenAI 兼容）',
    description: '主对话/占卜解读使用的模型。默认为 DeepSeek。',
    fields: [
      { key: 'OPENAI_API_KEY', label: 'API Key', secret: true, placeholder: 'sk-...' },
      { key: 'OPENAI_BASE_URL', label: 'Base URL', placeholder: 'https://api.deepseek.com/v1' },
      { key: 'OPENAI_MODEL', label: '模型', placeholder: 'deepseek-chat' },
      { key: 'OPENAI_FAST_MODEL', label: '快速模型', placeholder: 'deepseek-chat' },
      { key: 'OPENAI_STANDARD_MODEL', label: '标准模型', placeholder: 'deepseek-chat' },
      { key: 'OPENAI_TEMPERATURE', label: 'Temperature', placeholder: '0.7' },
      { key: 'OPENAI_MAX_TOKENS', label: 'Max Tokens', placeholder: '4000' },
      { key: 'OPENAI_TIMEOUT', label: '请求超时（秒）', placeholder: '30' },
    ],
  },
  {
    title: 'Embedding（知识库向量检索）',
    description: '用于知识库索引与语义搜索的向量模型。DeepSeek 无 Embedding 接口，默认使用通义千问。',
    fields: [
      { key: 'EMBEDDING_API_KEY', label: 'API Key', secret: true, placeholder: 'sk-...' },
      { key: 'EMBEDDING_BASE_URL', label: 'Base URL', placeholder: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
      { key: 'EMBEDDING_MODEL', label: '模型', placeholder: 'text-embedding-v3' },
    ],
  },
  {
    title: 'Anthropic (Claude)',
    description: '备用提供商，OpenAI 兼容接口不可用时自动降级。留空则不启用。',
    fields: [
      { key: 'ANTHROPIC_API_KEY', label: 'API Key', secret: true, placeholder: 'sk-ant-...' },
      { key: 'ANTHROPIC_MODEL', label: '模型', placeholder: 'claude-3-5-sonnet-20241022' },
    ],
  },
  {
    title: '本地 / 自定义 LLM',
    description: '备用提供商，OpenAI 兼容接口与 Claude 均不可用时降级。留空则不启用。',
    fields: [
      { key: 'LOCAL_LLM_URL', label: '服务地址', placeholder: 'http://localhost:11434/v1' },
      { key: 'LOCAL_LLM_MODEL', label: '模型', placeholder: 'llama3' },
    ],
  },
];

const AdminAI: React.FC = () => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [health, setHealth] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    void load();
    void checkHealth();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await aiApi.getAiSettings();
      if (res.success && res.data) {
        const next: Record<string, string> = {};
        for (const s of res.data.settings) {
          next[s.key] = s.masked ? SECRET_PLACEHOLDER : s.value;
        }
        setValues(next);
      } else {
        setMessage({ type: 'error', text: '加载 AI 配置失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '加载 AI 配置失败，请确认后端服务正常' });
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/ai/health');
      setHealth(res.ok ? 'ok' : 'fail');
    } catch {
      setHealth('fail');
    } finally {
      setChecking(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await aiApi.updateAiSettings(values);
      if (res.success && res.data) {
        setMessage({ type: 'success', text: res.data.message });
        void load();
      } else {
        setMessage({ type: 'error', text: '保存失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '保存失败，请检查网络连接' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Brain size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">AI 服务配置</h2>
            <p className="text-sm text-gray-500">
              管理 Python AI 微服务（ai-service）的运行时配置，保存在 <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">ai-service/.env</code>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={checkHealth}
            disabled={checking}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            {checking ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            检测服务
          </button>
          <button
            onClick={save}
            disabled={saving || loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            保存配置
          </button>
        </div>
      </div>

      {/* 服务健康状态 */}
      <div className={`mb-6 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
        health === 'ok'
          ? 'border-green-200 bg-green-50 text-green-700'
          : health === 'fail'
            ? 'border-red-200 bg-red-50 text-red-600'
            : 'border-gray-200 bg-gray-50 text-gray-500'
      }`}>
        <Server size={16} />
        {health === 'ok' && 'AI 服务运行正常（localhost:8000）'}
        {health === 'fail' && 'AI 服务未响应，请先启动 ai-service'}
        {health === 'idle' && '正在检测 AI 服务状态…'}
      </div>

      {message && (
        <div className={`mb-6 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
          message.type === 'success'
            ? 'border-green-200 bg-green-50 text-green-700'
            : 'border-red-200 bg-red-50 text-red-600'
        }`}>
          {message.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" /> 加载中…
        </div>
      ) : (
        <div className="space-y-6">
          {GROUPS.map((group) => (
            <div key={group.title} className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900">{group.title}</h3>
              {group.description && (
                <p className="text-xs text-gray-400 mt-1 mb-4">{group.description}</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {group.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {field.label}
                      <span className="text-gray-400 font-normal ml-1 font-mono text-xs">{field.key}</span>
                    </label>
                    <input
                      type={field.secret ? 'password' : 'text'}
                      value={values[field.key] ?? ''}
                      placeholder={field.placeholder}
                      onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    {field.secret && (
                      <p className="mt-1 text-xs text-gray-400">
                        {values[field.key] === SECRET_PLACEHOLDER
                          ? '已保存的密钥（脱敏显示），留空表示保持不变'
                          : '密钥仅保存在你的服务器上'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            保存后写入 <code className="bg-amber-100 px-1 rounded">ai-service/.env</code>，需重启 AI 服务才能生效（当前服务需手动重启）。
            密钥类字段显示为 {SECRET_PLACEHOLDER} 时表示已保存，留空提交即为保持不变；如需更换请直接填入新值。
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAI;
