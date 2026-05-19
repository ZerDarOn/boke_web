import React, { useState, useEffect } from 'react';
import type { UniverseNode } from '../../lib/api';
import { useUniverseData, useSaveUniverseLayout } from '../../hooks/queries/universe';
import { AlertCircle, Loader2, RefreshCw, Save, MousePointer, Eye } from 'lucide-react';

const AdminUniverseVisual: React.FC = () => {
  const { data: serverNodes = [], isLoading: loading, error: queryError, refetch } = useUniverseData('all');
  const saveLayout = useSaveUniverseLayout();
  const [nodes, setNodes] = useState<UniverseNode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const saving = saveLayout.isPending;
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (serverNodes.length > 0) {
      setNodes(serverNodes);
    }
  }, [serverNodes]);

  useEffect(() => {
    if (queryError) {
      setError(queryError.message);
    }
  }, [queryError]);

  // 处理拖拽开始
  const handleMouseDown = (e: React.MouseEvent, node: UniverseNode) => {
    if (node.type === 'self') return; // 中心节点不能拖动
    
    const rect = (e.currentTarget as HTMLElement).parentElement?.getBoundingClientRect();
    if (!rect) return;
    
    setDraggingNode(node.id);
    setDragOffset({
      x: e.clientX - (node.x / 100 * rect.width + rect.left),
      y: e.clientY - (node.y / 100 * rect.height + rect.top)
    });
  };

  // 处理拖拽中
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNode) return;
    
    const canvas = e.currentTarget as HTMLElement;
    const rect = canvas.getBoundingClientRect();
    
    let newX = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
    let newY = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;
    
    // 限制范围
    newX = Math.max(5, Math.min(95, newX));
    newY = Math.max(5, Math.min(95, newY));
    
    setNodes(prev => prev.map(n => 
      n.id === draggingNode ? { ...n, x: newX, y: newY } : n
    ));
  };

  // 处理拖拽结束
  const handleMouseUp = () => {
    setDraggingNode(null);
  };

  // 保存所有更改（保存到宇宙图专用布局表）
  const handleSaveAll = async () => {
    try {
      setError(null);
      await saveLayout.mutateAsync(nodes);
      alert('宇宙图布局保存成功！（不影响技能/人脉单独视图的布局）');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
      alert('保存失败，请重试');
    }
  };

  // 自动布局
  const handleAutoLayout = () => {
    const centerX = 50;
    const centerY = 50;
    
    const skillNodes = nodes.filter(n => n.type === 'skill');
    const personNodes = nodes.filter(n => n.type === 'person');
    const selfNode = nodes.find(n => n.type === 'self');
    
    const newNodes: UniverseNode[] = [];
    
    // 自己固定在中心
    if (selfNode) {
      newNodes.push({ ...selfNode, x: centerX, y: centerY });
    }
    
    // 技能 - 内圈
    skillNodes.forEach((node, index) => {
      const angle = (index / skillNodes.length) * 2 * Math.PI - Math.PI / 2;
      const radius = 25;
      newNodes.push({
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      });
    });
    
    // 人脉 - 外圈
    personNodes.forEach((node, index) => {
      const angle = (index / personNodes.length) * 2 * Math.PI - Math.PI / 2 + 0.3;
      const radius = 40;
      newNodes.push({
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      });
    });
    
    setNodes(newNodes);
  };

  const getNodeColor = (node: UniverseNode) => {
    switch (node.type) {
      case 'self': return '#10b981';
      case 'skill': return '#3b82f6';
      case 'person': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={40} />
          <p className="text-gray-600 dark:text-gray-400">Loading universe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Universe Visual Editor
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              调整"全部"模式下的节点布局。此布局仅用于宇宙图展示，不影响技能/人脉单独视图的布局。
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              onClick={handleAutoLayout}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <MousePointer size={16} />
              Auto Layout
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Save Layout
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle size={20} />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Self</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">1</p>
          </div>
          <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Skills</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {nodes.filter(n => n.type === 'skill').length}
            </p>
          </div>
          <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Network</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {nodes.filter(n => n.type === 'person').length}
            </p>
          </div>
          <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{nodes.length}</p>
          </div>
        </div>

        {/* Canvas */}
        <div 
          className="relative bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden"
          style={{ height: '600px' }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

          {/* Connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {nodes.map((node) =>
              node.connections.map((targetId) => {
                const target = nodes.find(n => n.id === targetId);
                if (!target) return null;
                if (node.id > targetId) return null;

                return (
                  <line
                    key={`${node.id}-${targetId}`}
                    x1={`${node.x}%`}
                    y1={`${node.y}%`}
                    x2={`${target.x}%`}
                    y2={`${target.y}%`}
                    stroke={getNodeColor(node)}
                    strokeWidth="1"
                    strokeOpacity="0.3"
                    strokeDasharray="4 4"
                  />
                );
              })
            )}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => {
            const isDragging = draggingNode === node.id;
            const isSelf = node.type === 'self';
            
            return (
              <div
                key={node.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-10 ${
                  isSelf ? 'cursor-default' : 'cursor-move'
                }`}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                onMouseDown={(e) => handleMouseDown(e, node)}
              >
                <div
                  className={`
                    rounded-full flex items-center justify-center border-2 transition-all
                    ${node.nodeType === 'core' ? 'w-16 h-16' : ''}
                    ${node.nodeType === 'major' ? 'w-12 h-12' : ''}
                    ${node.nodeType === 'minor' ? 'w-8 h-8' : ''}
                    ${isDragging ? 'scale-110 shadow-lg' : 'hover:scale-105'}
                  `}
                  style={{
                    backgroundColor: getNodeColor(node) + '20',
                    borderColor: getNodeColor(node),
                    boxShadow: isDragging ? `0 0 20px ${getNodeColor(node)}` : undefined
                  }}
                >
                  <div 
                    className="rounded-full"
                    style={{
                      width: node.nodeType === 'core' ? '8px' : node.nodeType === 'major' ? '6px' : '4px',
                      height: node.nodeType === 'core' ? '8px' : node.nodeType === 'major' ? '6px' : '4px',
                      backgroundColor: getNodeColor(node)
                    }}
                  />
                </div>
                
                {/* Label */}
                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 hover:opacity-100 transition-opacity">
                  {node.name}
                  <span className="ml-1 text-gray-400">({Math.round(node.x)}, {Math.round(node.y)})</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-emerald-500 bg-emerald-500/20"></span>
            <span className="text-gray-600 dark:text-gray-400">Self (中心固定)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-blue-500 bg-blue-500/20"></span>
            <span className="text-gray-600 dark:text-gray-400">Skill (宇宙图专用坐标)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-purple-500 bg-purple-500/20"></span>
            <span className="text-gray-600 dark:text-gray-400">Network (宇宙图专用坐标)</span>
          </div>
        </div>
        
        {/* Info */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>说明：</strong>此页面调整的布局仅用于宇宙图的"全部"筛选模式。技能和人脉的单独视图仍然使用各自的独立坐标系统，互不干扰。
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminUniverseVisual;
