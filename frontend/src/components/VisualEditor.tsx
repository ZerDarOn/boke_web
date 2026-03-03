import React, { useState, useRef, useEffect } from 'react';
import { api, NetworkNode, Skill } from '../lib/api';
import { X, Plus, Save, RotateCw, Link, Info, Trash2, Edit, MousePointer, Grid, Maximize2 } from 'lucide-react';

interface VisualEditorProps<T> {
  type: 'network' | 'skills';
  nodes: T[];
  onSave?: (nodes: T[]) => Promise<void>;
  onNodeClick?: (node: T) => void;
  onUpdateNode?: (id: string, updates: Partial<T>) => Promise<void>;
  onAddNode?: (data: Partial<T>) => Promise<void>;
  onDeleteNode?: (id: string) => Promise<void>;
  editable?: boolean;
}

function VisualEditor<T extends { id: string; x: number; y: number; label: string; connections?: string[] }>(
  props: VisualEditorProps<T>
): React.ReactElement {
  const {
    nodes,
    type,
    onSave,
    onNodeClick,
    onUpdateNode,
    onAddNode,
    onDeleteNode,
    editable = true
  } = props;

  const [localNodes, setLocalNodes] = useState<T[]>(nodes);
  const [selectedNode, setSelectedNode] = useState<T | null>(null);
  const [editingNode, setEditingNode] = useState<T | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  // 同步外部 nodes 变化
  useEffect(() => {
    setLocalNodes(nodes);
  }, [nodes]);

  // 拖拽开始
  const handleMouseDown = (e: React.MouseEvent, node: T) => {
    if (!editable) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / 100;
    const scaleY = rect.height / 100;
    
    setDraggingNode(node.id);
    setDragOffset({
      x: e.clientX - (node.x * scaleX + rect.left),
      y: e.clientY - (node.y * scaleY + rect.top)
    });
  };

  // 拖拽中
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNode || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / 100;
    const scaleY = rect.height / 100;
    
    let newX = ((e.clientX - rect.left - dragOffset.x) / scaleX);
    let newY = ((e.clientY - rect.top - dragOffset.y) / scaleY);
    
    // 限制在 0-100 范围内
    newX = Math.max(5, Math.min(95, newX));
    newY = Math.max(5, Math.min(95, newY));
    
    setLocalNodes(nodes.map(node =>
      node.id === draggingNode
        ? { ...node, x: newX, y: newY } as T
        : node
    ));
  };

  // 拖拽结束
  const handleMouseUp = async () => {
    if (!draggingNode) return;
    
    const updatedNode = localNodes.find(n => n.id === draggingNode);
    if (updatedNode && onUpdateNode) {
      await onUpdateNode(draggingNode, {
        x: updatedNode.x,
        y: updatedNode.y
      });
    }
    
    setDraggingNode(null);
  };

  // 添加节点
  const handleAddNode = async () => {
    if (!onAddNode) return;
    
    const newNode: Partial<T> = {
      id: `${type}_${Date.now()}`,
      x: 50,
      y: 50,
      label: `新${type === 'network' ? '节点' : '技能'}`,
      connections: [],
      ...(type === 'network' && { type: 'major', role: '协作者', description: '' }),
      ...(type === 'skills' && { type: 'minor', level: 1 })
    } as any;
    
    await onAddNode(newNode);
  };

  // 删除节点
  const handleDeleteNode = async (id: string) => {
    if (!onDeleteNode) return;
    if (!confirm('确定要删除这个节点吗？')) return;
    
    await onDeleteNode(id);
  };

  // 编辑节点
  const handleEditNode = (node: T) => {
    setEditingNode(node);
    setIsEditing(true);
  };

  // 更新节点信息
  const handleUpdateNodeInfo = async () => {
    if (!editingNode || !onUpdateNode) return;
    
    await onUpdateNode(editingNode.id, {
      label: (editingNode as any).label,
      description: (editingNode as any).description,
      role: (editingNode as any).role,
      type: (editingNode as any).type,
      level: (editingNode as any).level || 1
    });
    
    setIsEditing(false);
    setEditingNode(null);
  };

  // 重置位置
  const handleResetPositions = () => {
    // 自动布局：圆形分布
    const centerX = 50;
    const centerY = 50;
    const radius = 35;
    
    const updatedNodes = localNodes.map((node, index) => {
      const angle = (index / localNodes.length) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return {
        ...node,
        x,
        y
      } as T;
    });
    
    setLocalNodes(updatedNodes);
    if (onSave) {
      onSave(updatedNodes);
    }
  };

  // 保存所有更改
  const handleSaveAll = async () => {
    if (!onSave) return;
    
    setSaving(true);
    try {
      await onSave(localNodes);
      alert('保存成功！');
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 撤放控制
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => setZoom(1);

  // 获取节点颜色和样式
  const getNodeStyle = (node: T) => {
    const networkNode = node as any as NetworkNode;
    const skillNode = node as any as Skill;

    if (type === 'network') {
      const colors = {
        'core': 'w-20 h-20 bg-ink shadow-[0_0_30px_rgba(16,185,129,0.3)]',
        'major': 'w-16 h-16 bg-white dark:bg-[#1a1a1a] hover:bg-neutral-900 dark:hover:bg-white border-2 border-gray-300 dark:border-gray-500',
        'minor': 'w-12 h-12 bg-gray-100 dark:bg-[#222] border border-gray-300 dark:border-gray-700 hover:bg-white'
      };
      return colors[networkNode.type as keyof typeof colors] || colors.minor;
    } else {
      const levels = {
        1: 'w-12 h-12 bg-gray-200 dark:bg-gray-800',
        2: 'w-16 h-16 bg-blue-100 dark:bg-blue-900',
        3: 'w-20 h-20 bg-purple-100 dark:bg-purple-900',
        4: 'w-24 h-24 bg-pink-100 dark:bg-pink-900',
        5: 'w-28 h-28 bg-red-100 dark:bg-red-900'
      };
      return levels[skillNode.level || 1];
    }
  };

  const getNodeColor = (node: T) => {
    if (type === 'network') {
      const networkNode = node as any as NetworkNode;
      if (networkNode.type === 'core') return '#10b981';
      if (networkNode.type === 'major') return '#8b5cf6';
      return '#6b7280';
    } else {
      return '#059669';
    }
  };

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="bg-white dark:bg-black/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 dark:text-white">
              {type === 'network' ? '🕸️ 网络编辑器' : '⚔️ 技能编辑器'}
            </h3>
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg px-2 py-1 text-xs text-gray-600 dark:text-gray-400">
              <span>{nodes.length}</span>
              <span>个节点</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 缩放控制 */}
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="缩小"
            >
              <Grid size={18} />
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="放大"
            >
              <Maximize2 size={18} />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="重置缩放"
            >
              <RotateCw size={18} />
            </button>
          </div>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          {editable && (
            <>
              <button
                onClick={handleAddNode}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                添加节点
              </button>
              <button
                onClick={handleResetPositions}
                className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <MousePointer size={16} />
                自动布局
              </button>
            </>
          )}
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {saving ? '保存中...' : <><Save size={16} /> 保存所有位置</>}
          </button>
        </div>
      </div>

      {/* 可视化编辑画布 */}
      <div
        ref={canvasRef}
        className="relative bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
        style={{
          height: '600px',
          cursor: editable ? 'move' : 'default'
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* 网格背景 */}
        {showGrid && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
          />
        )}

        {/* 连接线 */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {localNodes.map((node) => (
            <React.Fragment key={node.id}>
              {node.connections?.map((targetId: string) => {
                const target = localNodes.find(n => n.id === targetId);
                if (!target) return null;
                // 避免重复绘制
                if (node.id > targetId) return null;

                const isSelected = selectedNode?.id === node.id || selectedNode?.id === targetId;

                return (
                  <line
                    key={`${node.id}-${targetId}`}
                    x1={`${node.x}%`}
                    y1={`${node.y}%`}
                    x2={`${target.x}%`}
                    y2={`${target.y}%`}
                    stroke={isSelected ? getNodeColor(node) : '#94a3b8'}
                    strokeWidth={isSelected ? '1.5' : '1'}
                    strokeDasharray="4 4"
                    strokeOpacity={isSelected ? '1' : '0.5'}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </svg>

        {/* 节点 */}
        {localNodes.map((node) => {
          const isSelected = selectedNode?.id === node.id;
          const isDragging = draggingNode === node.id;

          return (
            <div
              key={node.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
                isSelected ? 'z-20' : 'z-10'
              } ${isDragging ? 'opacity-80 scale-110' : 'hover:scale-105'}`}
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: `translate(-50%, -50%) scale(${zoom})`
              }}
              onClick={() => {
                if (!editable) {
                  onNodeClick?.(node);
                } else {
                  setSelectedNode(node);
                }
              }}
              onMouseDown={(e) => editable ? handleMouseDown(e, node) : undefined}
            >
              {/* 节点视觉 */}
              <div
                className={getNodeStyle(node)}
                style={{
                  border: isSelected ? `2px solid ${getNodeColor(node)}` : '',
                  backgroundColor: isSelected ? `${getNodeColor(node)}20` : ''
                }}
              >
                {editable && (
                  <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNode(node.id);
                      }}
                      className="w-6 h-6 bg-red-100 hover:bg-red-200 rounded flex items-center justify-center transition-colors"
                      title="删除"
                    >
                      <Trash2 size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditNode(node);
                      }}
                      className="w-6 h-6 bg-blue-100 hover:bg-blue-200 rounded flex items-center justify-center transition-colors"
                      title="编辑"
                    >
                      <Edit size={12} />
                    </button>
                  </div>
                )}

                {/* 节点标签 */}
                <div className="absolute top-full mt-1 whitespace-nowrap px-2 py-1 bg-white dark:bg-black rounded text-xs font-mono text-ink dark:text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                  {node.label}
                </div>
              </div>
            </div>
          );
        })}

        {/* 空状态提示 */}
        {localNodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-6xl mb-4">📭</p>
              <p className="text-gray-500 dark:text-gray-400">暂无节点</p>
              {editable && (
                <button
                  onClick={handleAddNode}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={20} />
                  添加第一个节点
                </button>
              )}
            </div>
          </div>
         )}
       </div>
       
       {/* 节点编辑弹窗 */}
       {isEditing && editingNode && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                编辑节点
              </h3>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingNode(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  标签名称
                </label>
                <input
                  type="text"
                  value={editingNode.label as string}
                  onChange={(e) => setEditingNode({ ...editingNode, label: e.target.value } as T)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="节点名称"
                />
              </div>

              {type === 'network' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      节点角色
                    </label>
                    <input
                      type="text"
                      value={(editingNode as any).role || ''}
                      onChange={(e) => setEditingNode({ ...editingNode, role: e.target.value } as T)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      placeholder="如：前端开发"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      描述
                    </label>
                    <textarea
                      value={(editingNode as any).description || ''}
                      onChange={(e) => setEditingNode({ ...editingNode, description: e.target.value } as T)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                      placeholder="简短描述这个节点的用途"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      节点类型
                    </label>
                    <select
                      value={(editingNode as any).type || 'minor'}
                      onChange={(e) => setEditingNode({ ...editingNode, type: e.target.value } as T)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    >
                      <option value="core">核心节点</option>
                      <option value="major">主要节点</option>
                      <option value="minor">次要节点</option>
                    </select>
                  </div>
                </>
              )}

              {type === 'skills' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      技能等级 (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={(editingNode as any).level || 1}
                      onChange={(e) => setEditingNode({ ...editingNode, level: parseInt(e.target.value) } as T)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingNode(null);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleUpdateNodeInfo}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VisualEditor;
