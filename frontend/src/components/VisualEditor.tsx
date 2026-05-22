import React, { useState, useRef, useEffect } from 'react';
import { api, NetworkNode, Skill } from '../lib/api';
import { X, Plus, Save, RotateCw, Link, Info, Trash2, Edit, MousePointer, Grid, Maximize2, Check, ChevronDown, Settings, Image as ImageIcon } from 'lucide-react';
import ImageUpload from './ImageUpload';

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
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  // 同步外部 nodes 变化
  useEffect(() => {
    setLocalNodes(nodes);
    // 同步更新 selectedNode 和 editingNode 的数据
    if (selectedNode) {
      const updatedSelectedNode = nodes.find(n => n.id === selectedNode.id);
      if (updatedSelectedNode) {
        setSelectedNode(updatedSelectedNode);
        setEditingNode({ ...updatedSelectedNode } as T);
      }
    }
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
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    hasMoved.current = false;
  };

  // 拖拽中
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNode || !canvasRef.current) return;
    
    // 检测是否有实际移动（超过5px阈值）
    const dx = Math.abs(e.clientX - dragStartPos.current.x);
    const dy = Math.abs(e.clientY - dragStartPos.current.y);
    if (dx > 5 || dy > 5) {
      hasMoved.current = true;
      setIsDragging(true);
    }
    
    if (!hasMoved.current) return; // 没有实际移动则不更新
    
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
    
    // 只有真正拖拽了才保存位置
    if (hasMoved.current) {
      const updatedNode = localNodes.find(n => n.id === draggingNode);
      if (updatedNode && onUpdateNode) {
        await onUpdateNode(draggingNode, {
          x: updatedNode.x,
          y: updatedNode.y,
        } as Partial<T>);
      }
    }
    
    setDraggingNode(null);
    setIsDragging(false);
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

  // 选择节点并显示详情
  const handleSelectNode = (node: T) => {
    setSelectedNode(node);
    setEditingNode({ ...node } as T);
    setShowDetailPanel(true);
  };

  // 更新编辑中的节点字段
  const handleEditingNodeChange = (field: string, value: any) => {
    if (!editingNode) return;
    setEditingNode({ ...editingNode, [field]: value } as T);
  };

  // 切换连接关系
  const handleToggleConnection = (targetId: string) => {
    if (!editingNode) return;
    const connections = (editingNode as any).connections || [];
    const newConnections = connections.includes(targetId)
      ? connections.filter((id: string) => id !== targetId)
      : [...connections, targetId];
    setEditingNode({ ...editingNode, connections: newConnections } as T);
  };

  // 保存节点编辑
  const handleSaveNodeEdit = async () => {
    if (!editingNode || !onUpdateNode) return;
    
    setSaving(true);
    try {
      await onUpdateNode(editingNode.id, {
        label: (editingNode as any).label,
        description: (editingNode as any).description,
        role: (editingNode as any).role,
        type: (editingNode as any).type,
        level: (editingNode as any).level,
        category: (editingNode as any).category,
        rank: (editingNode as any).rank,
        connections: (editingNode as any).connections,
        avatar: (editingNode as any).avatar,
        image: (editingNode as any).image,
        buttonEnabled: (editingNode as any).buttonEnabled,
        buttonLabel: (editingNode as any).buttonLabel,
        buttonLink: (editingNode as any).buttonLink,
      } as unknown as Partial<T>);
      setSelectedNode(editingNode);
      alert('保存成功！');
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
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
      // 技能节点：优先使用 nodeType，否则根据 level 决定大小
      const nodeType = skillNode.nodeType;
      if (nodeType === 'core') {
        return 'w-24 h-24 bg-ink shadow-[0_0_30px_rgba(16,185,129,0.3)]';
      } else if (nodeType === 'major') {
        return 'w-18 h-18 bg-white dark:bg-[#1a1a1a] border-2 border-gray-300 dark:border-gray-500';
      }
      // 默认或 minor：根据 level 决定大小
      const levels = {
        1: 'w-12 h-12 bg-gray-200 dark:bg-gray-800',
        2: 'w-14 h-14 bg-blue-100 dark:bg-blue-900',
        3: 'w-16 h-16 bg-purple-100 dark:bg-purple-900',
        4: 'w-18 h-18 bg-pink-100 dark:bg-pink-900',
        5: 'w-20 h-20 bg-red-100 dark:bg-red-900'
      };
      return levels[(skillNode.level || 1) as keyof typeof levels];
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
    <div className="flex gap-4">
      {/* 左侧画布区域 */}
      <div className="flex-1 space-y-4">
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
          <div className="flex items-center gap-2 mt-3">
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
                className={`group absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
                  isSelected ? 'z-20' : 'z-10'
                } ${isDragging ? 'opacity-80 scale-110' : 'hover:scale-105'}`}
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  transform: `translate(-50%, -50%) scale(${zoom})`
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  // 如果发生了移动，不要触发选择
                  if (hasMoved.current) return;
                  if (editable) {
                    handleSelectNode(node);
                  } else {
                    onNodeClick?.(node);
                  }
                }}
                onMouseDown={(e) => editable ? handleMouseDown(e, node) : undefined}
              >
                {/* 节点视觉 */}
                <div
                  className={`relative ${getNodeStyle(node)} rounded-full flex items-center justify-center`}
                  style={{
                    border: isSelected ? `3px solid ${getNodeColor(node)}` : '',
                    boxShadow: isSelected ? `0 0 20px ${getNodeColor(node)}40` : ''
                  }}
                >
                  {/* 节点名称 */}
                  <span className="text-xs font-bold text-center px-1 truncate max-w-full">
                    {node.label?.substring(0, 4)}
                  </span>

                  {/* 操作按钮 - 始终可见 */}
                  {editable && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNode(node.id);
                        }}
                        className="w-6 h-6 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded flex items-center justify-center transition-colors"
                        title="删除"
                      >
                        <Trash2 size={12} className="text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  )}

                  {/* 选中指示器 */}
                  {isSelected && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  )}
                </div>

                {/* 节点标签 */}
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-mono text-gray-900 dark:text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                  {node.label}
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
      </div>

      {/* 右侧详情面板 */}
      {showDetailPanel && editable && (
        <div className="w-80 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col" style={{ maxHeight: '700px' }}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Settings size={18} />
              {selectedNode ? '节点详情' : '选择节点'}
            </h3>
            <button
              onClick={() => setShowDetailPanel(false)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {!selectedNode ? (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div>
                <p className="text-4xl mb-4">👆</p>
                <p className="text-gray-500 dark:text-gray-400">点击画布中的节点查看详情</p>
              </div>
            </div>
          ) : editingNode ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* 图片上传 */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon size={14} />
                  {type === 'network' ? '头像' : '图标'}
                </h4>
                <ImageUpload
                  value={type === 'network' ? (editingNode as any).avatar : (editingNode as any).image}
                  onChange={(url) => handleEditingNodeChange(type === 'network' ? 'avatar' : 'image', url)}
                  type={type === 'network' ? 'network' : 'skill'}
                  size={80}
                />
              </div>

              {/* 基本信息 */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">基本信息</h4>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">名称</label>
                  <input
                    type="text"
                    value={(editingNode as any).label || ''}
                    onChange={(e) => handleEditingNodeChange('label', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {type === 'network' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">角色</label>
                      <input
                        type="text"
                        value={(editingNode as any).role || ''}
                        onChange={(e) => handleEditingNodeChange('role', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="如：前端开发、设计师"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">描述</label>
                      <textarea
                        value={(editingNode as any).description || ''}
                        onChange={(e) => handleEditingNodeChange('description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                        placeholder="简短描述..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">节点类型</label>
                      <select
                        value={(editingNode as any).type || 'minor'}
                        onChange={(e) => handleEditingNodeChange('type', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">节点类型</label>
                      <select
                        value={(editingNode as any).type || (editingNode as any).nodeType || 'minor'}
                        onChange={(e) => handleEditingNodeChange('type', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="core">核心节点</option>
                        <option value="major">主要节点</option>
                        <option value="minor">次要节点</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">技能等级</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(level => (
                          <button
                            key={level}
                            onClick={() => handleEditingNodeChange('level', level)}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                              (editingNode as any).level === level
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">分类</label>
                      <input
                        type="text"
                        value={(editingNode as any).category || ''}
                        onChange={(e) => handleEditingNodeChange('category', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="如：FRONTEND, BACKEND"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">等级排名</label>
                      <select
                        value={(editingNode as any).rank || 'Novice'}
                        onChange={(e) => handleEditingNodeChange('rank', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="Novice">新手 (Novice)</option>
                        <option value="Adept">熟练 (Adept)</option>
                        <option value="Expert">专家 (Expert)</option>
                        <option value="Master">大师 (Master)</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* 按钮配置 */}
              <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Link size={14} />
                  按钮配置
                </h4>
                <p className="text-xs text-gray-400">配置节点详情页底部的按钮，可用于跳转到外部链接</p>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditingNodeChange('buttonEnabled', true)}
                    className={`flex-1 py-2 text-xs rounded-lg transition-colors ${
                      (editingNode as any).buttonEnabled
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    显示按钮
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditingNodeChange('buttonEnabled', false)}
                    className={`flex-1 py-2 text-xs rounded-lg transition-colors ${
                      !(editingNode as any).buttonEnabled
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    隐藏按钮
                  </button>
                </div>
                
                {(editingNode as any).buttonEnabled && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">按钮文字</label>
                      <input
                        type="text"
                        value={(editingNode as any).buttonLabel || ''}
                        onChange={(e) => handleEditingNodeChange('buttonLabel', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Initialise Protocol"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">跳转链接</label>
                      <input
                        type="text"
                        value={(editingNode as any).buttonLink || ''}
                        onChange={(e) => handleEditingNodeChange('buttonLink', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="https://..."
                      />
                    </div>
                  </>
                )}
              </div>

              {/* 连接管理 */}
              <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  连接关系 ({((editingNode as any).connections || []).length})
                </h4>
                
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {localNodes.filter(n => n.id !== editingNode.id).map(node => {
                    const isConnected = ((editingNode as any).connections || []).includes(node.id);
                    return (
                      <button
                        key={node.id}
                        onClick={() => handleToggleConnection(node.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                          isConnected
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isConnected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-500'
                        }`}>
                          {isConnected && <Check size={10} className="text-white" />}
                        </div>
                        <span className="truncate">{node.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <button
                  onClick={handleSaveNodeEdit}
                  disabled={saving}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? '保存中...' : <><Save size={16} /> 保存更改</>}
                </button>
                <button
                  onClick={() => handleDeleteNode(selectedNode.id)}
                  className="w-full py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} /> 删除节点
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default VisualEditor;
