import React, { useCallback, useState } from 'react';
import { RefreshCw, Eye, EyeOff, Zap, Loader2, Check, AlertCircle } from 'lucide-react';

import type { SettingsTabProps } from './types';

type Provider = 'openai' | 'anthropic' | 'local';

const PROVIDERS: { value: Provider; label: string; defaultModel: string }[] = [
  { value: 'openai', label: 'OpenAI', defaultModel: 'gpt-4o-mini' },
  { value: 'anthropic', label: 'Anthropic (Claude)', defaultModel: 'claude-3-haiku-20240307' },
  { value: 'local', label: '本地 / 自定义', defaultModel: 'llama3' },
];

const AIModelSettingsTab: React.FC<SettingsTabProps> = ({ config, updateConfig }) => {
  const ai = config.aiConfig;
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [showKey, setShowKey] = useState(false);

  const handleProvider = useCallback(
    (p: Provider) => {
      const preset = PROVIDERS.find((x) => x.value === p);
      updateConfig('aiConfig', {
        ...ai,
        provider: p,
        model: preset ? preset.defaultModel : ai.model,
      });
    },
    [ai, updateConfig],
  );

  const handleField = useCallback(
    (field: string, value: string | number) => {
      updateConfig('aiConfig', { ...ai, [field]: value });
    },
    [ai, updateConfig],
  );

  const testConnection = async () => {
    setTestStatus('testing');
    try {
      const res = await fetch('/api/ai/health');
      if (res.ok) {
        setTestStatus('ok');
        setTimeout(() => setTestStatus('idle'), 3000);
      } else {
        setTestStatus('fail');
      }
    } catch {
      setTestStatus('fail');
    }
  };

  const resetDefaults = () => {
    updateConfig('aiConfig', {
      provider: 'openai',
      apiKey: '',
      model: 'gpt-4o-mini',
      baseUrl: '',
      maxTokens: 2048,
      temperature: 0.7,
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">AI 模型配置</h3>
      <p className="text-sm text-gray-500">
        配置 AI 服务所使用的模型和 API Key。保存后会自动写入 ai-service 的 .env 文件，需重启 AI 服务生效。
      </p>

      {/* Provider */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">AI 提供商</label>
        <div className="flex gap-3 flex-wrap">
          {PROVIDERS.map((p) => (
            <button
              key={p.value}
              onClick={() => handleProvider(p.value)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                ai.provider === p.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* API Key */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={ai.apiKey}
            onChange={(e) => handleField('apiKey', e.target.value)}
            placeholder={ai.provider === 'local' ? '本地模型通常不需要 Key' : 'sk-... 或 claude-...'}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            type="button"
          >
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Key 仅保存在你自己的服务器上，不会泄露到前端。
        </p>
      </div>

      {/* Model + Base URL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">模型名称</label>
          <input
            type="text"
            value={ai.model}
            onChange={(e) => handleField('model', e.target.value)}
            placeholder="gpt-4o-mini"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            自定义 API 地址
            <span className="text-gray-400 font-normal ml-1">（可选）</span>
          </label>
          <input
            type="text"
            value={ai.baseUrl}
            onChange={(e) => handleField('baseUrl', e.target.value)}
            placeholder="留空用官方地址；本地填 http://localhost:11434/v1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Max Tokens + Temperature */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Tokens: <span className="text-blue-600">{ai.maxTokens}</span>
          </label>
          <input
            type="range"
            min={256}
            max={8192}
            step={256}
            value={ai.maxTokens}
            onChange={(e) => handleField('maxTokens', Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>256</span>
            <span>8192</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Temperature: <span className="text-blue-600">{ai.temperature.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={ai.temperature}
            onChange={(e) => handleField('temperature', Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>精确 0</span>
            <span>平衡 1.0</span>
            <span>创意 2.0</span>
          </div>
        </div>
      </div>

      {/* 测试连接 */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={testConnection}
          disabled={testStatus === 'testing'}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {testStatus === 'testing' ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Zap size={16} />
          )}
          测试连接
        </button>
        {testStatus === 'ok' && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <Check size={16} /> 连接成功
          </span>
        )}
        {testStatus === 'fail' && (
          <span className="flex items-center gap-1 text-sm text-red-500">
            <AlertCircle size={16} /> 无法连接（请确认 AI 服务已启动）
          </span>
        )}
      </div>

      {/* 知识库 */}
      <div className="pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">文章知识库索引</h4>
        <p className="text-xs text-gray-400 mb-3">
          将已发布文章的内容索引到 ChromaDB。索引后 AI 回答会引用原文证据（Smart RAG）。
        </p>
        <button
          onClick={async () => {
            setTestStatus('testing');
            try {
              const res = await fetch('/api/ai/index/rebuild', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
              });
              if (res.ok) {
                const data = await res.json();
                setTestStatus('ok');
                setTimeout(() => setTestStatus('idle'), 3000);
              } else {
                setTestStatus('fail');
              }
            } catch {
              setTestStatus('fail');
            }
          }}
          disabled={testStatus === 'testing'}
          className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-lg text-sm hover:bg-violet-600 disabled:opacity-50 transition-colors"
        >
          {testStatus === 'testing' ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
          重建知识库索引
        </button>
        {testStatus === 'ok' && (
          <span className="inline-flex items-center gap-1 text-sm text-green-600 ml-3">
            <Check size={16} /> 索引完成
          </span>
        )}
        {testStatus === 'fail' && (
          <span className="inline-flex items-center gap-1 text-sm text-red-500 ml-3">
            <AlertCircle size={16} /> 索引失败（请确认 AI 服务已启动）
          </span>
        )}
      </div>

      {/* 提示 */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
        修改 AI 模型配置后，点击页面顶部的"保存"按钮即可自动热加载，无需手动重启。
        {ai.provider === 'local' && ' 使用本地模型时，请确保 Custom Base URL 指向正确的 Ollama/vLLM 地址。'}
      </div>

      {/* 重置 */}
      <div className="pt-4 border-t">
        <button
          onClick={resetDefaults}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw size={16} />
          重置为默认配置
        </button>
      </div>
    </div>
  );
};

export default AIModelSettingsTab;
