import React, { useState, useEffect } from 'react';
import { User, X, Share2, Loader2, Filter } from 'lucide-react';
import { api, UniverseNode } from '../lib/api';

type FilterType = 'all' | 'skill' | 'person';

const UniverseMap: React.FC = () => {
  const [activeNodeId, setActiveNodeId] = useState<string | null>('self');
  const [nodes, setNodes] = useState<UniverseNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  // 根据筛选器获取对应坐标的数据
  useEffect(() => {
    const fetchUniverse = async () => {
      setLoading(true);
      setError(null);
      try {
        // 根据筛选模式传递不同的 mode 参数
        // all -> 使用宇宙图专用坐标
        // skill -> 使用技能表坐标
        // person -> 使用人脉表坐标
        const result = await api.universe.getAll(filter);
        if (result.success && result.data) {
          setNodes(result.data);
          // 默认选择自己节点
          const selfNode = result.data.find(n => n.type === 'self');
          if (selfNode) {
            setActiveNodeId(selfNode.id);
          }
        } else {
          setError(result.error || 'Failed to fetch universe');
        }
      } catch (err) {
        setError('Failed to fetch universe');
      } finally {
        setLoading(false);
      }
    };

    fetchUniverse();
  }, [filter]);

  const getNode = (id: string) => nodes.find(n => n.id === id);
  const activeNode = activeNodeId ? getNode(activeNodeId) : null;

  // 根据筛选器过滤节点
  const filteredNodes = React.useMemo(() => {
    return nodes.filter(node => {
      if (filter === 'all') return true;
      return node.type === filter;
    });
  }, [nodes, filter]);

  // 获取节点颜色
  const getNodeColor = (node: UniverseNode) => {
    switch (node.type) {
      case 'self':
        return 'var(--color-neon)';
      case 'skill':
        return 'var(--color-secondary)';
      case 'person':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  // 获取类型标签
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'self': return 'SELF';
      case 'skill': return 'SKILL';
      case 'person': return 'PERSON';
      default: return type.toUpperCase();
    }
  };

  return (
    <div className="w-full h-[600px] bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 shadow-sm rounded-lg overflow-hidden relative flex transition-colors">
      {loading && (
        <div className="flex items-center justify-center w-full h-full">
          <Loader2 className="animate-spin text-neon" size={32} />
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center w-full h-full">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-300 font-mono text-sm">
              ERROR: {error}
            </p>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Network Canvas */}
          <div className="flex-1 relative bg-white dark:bg-[#0a0a0a] overflow-hidden cursor-crosshair group">
            {/* Grid Background Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

            {/* 筛选器 */}
            <div className="absolute top-4 left-4 z-30 flex items-center gap-2 bg-white/90 dark:bg-black/80 backdrop-blur-sm rounded-lg p-1 border border-gray-200 dark:border-white/10">
              <Filter size={14} className="text-gray-500 ml-2" />
              {[
                { key: 'all', label: '全部' },
                { key: 'skill', label: '技能' },
                { key: 'person', label: '人脉' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setFilter(item.key as FilterType)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    filter === item.key
                      ? 'bg-ink dark:bg-white text-white dark:text-ink'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* SVG Connections (Dashed Animated Lines) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {filteredNodes.map((node) =>
                node.connections.map((targetId) => {
                  // 只显示当前筛选器内的连接
                  if (!filteredNodes.find(n => n.id === targetId)) return null;

                  const target = getNode(targetId);
                  if (!target) return null;
                  if (node.id > targetId) return null;

                  const isActive = activeNodeId === node.id || activeNodeId === targetId;

                  // Logic: Connections to 'Core' use Neon, others use Secondary or Grey
                  const isCoreConnection = node.nodeType === 'core' || target.nodeType === 'core';
                  const lineColor = isActive
                    ? (isCoreConnection ? 'var(--color-neon)' : 'var(--color-secondary)')
                    : '#525252';

                  return (
                    <line
                      key={`${node.id}-${targetId}`}
                      x1={`${node.x}%`}
                      y1={`${node.y}%`}
                      x2={`${target.x}%`}
                      y2={`${target.y}%`}
                      stroke={lineColor}
                      strokeWidth={isActive ? '1.5' : '1'}
                      strokeOpacity={isActive ? '0.8' : '0.2'}
                      strokeDasharray="4 4"
                    >
                      {/* Add flow animation for active lines */}
                      {isActive && (
                        <animate attributeName="stroke-dashoffset" from="0" to="8" dur="1s" repeatCount="indefinite" />
                      )}
                    </line>
                  );
                })
              )}
            </svg>

            {/* Nodes (Styled like SkillNodes in Profile) */}
            {filteredNodes.map((node) => {
              const isActive = activeNodeId === node.id;

              return (
                <div
                  key={node.id}
                  onClick={() => setActiveNodeId(node.id)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer"
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                >
                  {/* Node Visual */}
                  <div
                    className={`
                      rounded-full flex items-center justify-center border-2 transition-all duration-300 relative
                      ${node.nodeType === 'core' ? 'w-20 h-20 bg-ink shadow-[0_0_30px_rgba(16,185,129,0.3)]' : ''}
                      ${node.nodeType === 'major' ? 'w-12 h-12 bg-white dark:bg-[#222] hover:bg-neutral-900 dark:hover:bg-black group-hover/node:scale-110' : ''}
                      ${node.nodeType === 'minor' ? 'w-8 h-8 bg-gray-100 dark:bg-[#111] border-gray-300 dark:border-gray-700 hover:bg-white' : ''}
                      ${isActive ? 'scale-110' : ''}
                    `}
                    style={{
                      // Dynamic Border Colors
                      borderColor: isActive
                        ? 'var(--color-neon)'
                        : (node.nodeType === 'core' ? 'var(--color-neon)' : (node.nodeType === 'major' ? 'var(--color-secondary)' : ''))
                    }}
                  >
                    {/* Inner Element */}
                    <div
                      className={`
                        rounded-full transition-all duration-500
                        ${node.nodeType === 'core' ? 'w-16 h-16 border border-white/20 animate-spin-slow' : ''}
                        ${node.nodeType === 'major' ? 'w-2 h-2' : ''}
                        ${node.nodeType === 'minor' ? 'w-1 h-1 bg-gray-400' : ''}
                      `}
                      style={{
                        // Dynamic Backgrounds for Inner Dots
                        backgroundColor: isActive
                          ? 'var(--color-neon)'
                          : (node.nodeType === 'major' ? 'var(--color-secondary)' : (node.nodeType === 'core' ? '' : ''))
                      }}
                    />

                    {/* Tooltip Label (Visible on Hover or Active) */}
                    <div
                      className={`
                        absolute top-full mt-2 whitespace-nowrap px-2 py-1 text-[10px] font-mono uppercase tracking-wider transition-all duration-300 z-20
                        ${isActive
                          ? 'text-ink font-bold opacity-100 translate-y-0'
                          : 'bg-ink dark:bg-white text-white dark:text-ink opacity-0 translate-y-2 pointer-events-none'}
                      `}
                      style={{ backgroundColor: isActive ? 'var(--color-neon)' : '' }}
                    >
                      {node.name}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty State */}
            {filteredNodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-6xl mb-4">🌌</p>
                  <p className="text-gray-500 dark:text-gray-400">该分类下暂无节点</p>
                </div>
              </div>
            )}
          </div>

          {/* Side Panel Detail Card */}
          {activeNode && (
            <div className="w-80 border-l border-gray-200 dark:border-white/10 bg-white/95 dark:bg-[#111]/95 backdrop-blur-sm p-0 shadow-2xl z-20 absolute right-0 top-0 bottom-0 overflow-y-auto animate-in slide-in-from-right duration-300 flex flex-col">
              {/* Header */}
              <div className="p-6 bg-ink dark:bg-black text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Share2 size={64} />
                </div>
                <button onClick={() => setActiveNodeId(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
                <h2 className="text-2xl font-sans font-black tracking-tight mb-1">{activeNode.name}</h2>
                <span className="inline-block px-2 py-0.5 border font-mono text-[10px] uppercase" style={{ borderColor: 'var(--color-neon)', color: 'var(--color-neon)' }}>
                  {getTypeLabel(activeNode.type)}
                  {activeNode.nodeType && ` • ${activeNode.nodeType.toUpperCase()}`}
                </span>
              </div>

              {/* Content */}
              <div className="p-6 space-y-8 flex-1">
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--color-secondary)' }}></span>
                    Description
                  </h4>
                  <p className="font-serif text-sm text-gray-700 dark:text-gray-300 leading-relaxed border-l-2 border-gray-100 dark:border-white/10 pl-4">
                    {activeNode.description || activeNode.role || 'No description available.'}
                  </p>
                </div>

                {/* Skill Details */}
                {activeNode.type === 'skill' && (
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--color-secondary)' }}></span>
                      Skill Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      {activeNode.category && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Category</span>
                          <span className="font-mono" style={{ color: 'var(--color-secondary)' }}>{activeNode.category}</span>
                        </div>
                      )}
                      {activeNode.level !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Level</span>
                          <span className="font-mono">{activeNode.level}/100</span>
                        </div>
                      )}
                      {activeNode.rank && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Rank</span>
                          <span className="font-mono" style={{ color: 'var(--color-neon)' }}>{activeNode.rank}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Person Details */}
                {activeNode.type === 'person' && (
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--color-secondary)' }}></span>
                      Role
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                      {activeNode.role || 'Collaborator'}
                    </p>
                  </div>
                )}

                {/* Network */}
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--color-secondary)' }}></span>
                    Network
                  </h4>
                  <div className="flex flex-col gap-2">
                    {activeNode.connections.map(connId => {
                      const connNode = getNode(connId);
                      return connNode ? (
                        <div key={connId} onClick={() => setActiveNodeId(connId)} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-white/20 transition-all group/item">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getNodeColor(connNode) }} />
                            <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-400 group-hover/item:text-ink dark:group-hover/item:text-white">{connNode.name}</span>
                          </div>
                          <span className="text-[10px]" style={{ color: getNodeColor(connNode) }}>{getTypeLabel(connNode.type)}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>

              {/* Footer Action - 使用节点级别的按钮配置 */}
              {activeNode && activeNode.buttonEnabled && (
                <div className="p-6 border-t border-gray-100 dark:border-white/10">
                  <button 
                    onClick={() => {
                      const link = activeNode.buttonLink;
                      if (link) {
                        // 判断是外部链接还是内部链接
                        if (link.startsWith('http://') || link.startsWith('https://')) {
                          window.open(link, '_blank');
                        } else {
                          window.location.href = link;
                        }
                      }
                    }}
                    className="w-full py-3 bg-white dark:bg-[#222] border border-ink dark:border-white/20 text-ink dark:text-white font-mono text-xs hover:bg-ink hover:text-white dark:hover:bg-white dark:hover:text-ink transition-all duration-300 uppercase flex items-center justify-center gap-2 group"
                  >
                    {activeNode.buttonLabel || 'Initialise Protocol'}
                    <span className="w-1.5 h-1.5 rounded-full group-hover:animate-ping" style={{ backgroundColor: 'var(--color-neon)' }}></span>
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UniverseMap;
