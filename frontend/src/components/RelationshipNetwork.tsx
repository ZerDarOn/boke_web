import React, { useState, useEffect } from 'react';
import { User, X, Share2, Loader2 } from 'lucide-react';
import { useNetworkNodes } from '../hooks/queries/network';

const RelationshipNetwork: React.FC = () => {
  const [activeNodeId, setActiveNodeId] = useState<string | null>('me');
  const { data: nodes = [], isLoading: loading, error: queryError } = useNetworkNodes({ limit: 500 });
  const error = queryError?.message ?? null;

  useEffect(() => {
    if (nodes.length === 0) return;
    setActiveNodeId((prev) => {
      if (prev && nodes.some((n) => n.id === prev)) return prev;
      return nodes[0].id;
    });
  }, [nodes]);
  
  const getNode = (id: string) => nodes.find(n => n.id === id);
  const activeNode = activeNodeId ? getNode(activeNodeId) : null;

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
      {/* Network Canvas - Styled like Profile.tsx */}
      <div className="flex-1 relative bg-white dark:bg-[#0a0a0a] overflow-hidden cursor-crosshair group">
        
        {/* 1. Grid Background Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

         {/* 2. SVG Connections (Dashed Animated Lines) */}
         <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {nodes.map((node) => 
                node.connections.map((targetId) => {
                  const target = getNode(targetId);
                  if (!target) return null;
                  // Don't draw double lines
                  if (node.id > targetId) return null;

                 const isActive = activeNodeId === node.id || activeNodeId === targetId;

                 // Logic: Connections to 'Core' use Neon, others use Secondary or Grey
                 const isCoreConnection = node.type === 'core' || target.type === 'core';
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
                     stroke={lineColor} // Use dynamic variable
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

         {/* 3. Nodes (Styled like SkillNodes in Profile) */}
         {nodes.map((node) => (
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
                        ${node.type === 'core' ? 'w-20 h-20 bg-ink shadow-[0_0_30px_rgba(16,185,129,0.3)]' : ''}
                        ${node.type === 'major' ? 'w-12 h-12 bg-white dark:bg-[#222] hover:bg-neutral-900 dark:hover:bg-black group-hover/node:scale-110' : ''}
                        ${node.type === 'minor' ? 'w-8 h-8 bg-gray-100 dark:bg-[#111] border-gray-300 dark:border-gray-700 hover:bg-white' : ''}
                        ${activeNodeId === node.id ? 'scale-110' : ''}
                    `}
                    style={{
                        // Dynamic Border Colors
                        borderColor: activeNodeId === node.id 
                            ? 'var(--color-neon)' 
                            : (node.type === 'core' ? 'var(--color-neon)' : (node.type === 'major' ? 'var(--color-secondary)' : ''))
                    }}
                >
                    
                    {/* Inner Element */}
                    <div 
                        className={`
                            rounded-full transition-all duration-500
                            ${node.type === 'core' ? 'w-16 h-16 border border-white/20 animate-spin-slow' : ''}
                            ${node.type === 'major' ? 'w-2 h-2' : ''}
                            ${node.type === 'minor' ? 'w-1 h-1 bg-gray-400' : ''}
                        `}
                        style={{
                            // Dynamic Backgrounds for Inner Dots
                            backgroundColor: activeNodeId === node.id 
                                ? 'var(--color-neon)' 
                                : (node.type === 'major' ? 'var(--color-secondary)' : (node.type === 'core' ? '' : ''))
                        }}
                    ></div>

                    {/* Tooltip Label (Visible on Hover or Active) */}
                    <div className={`
                        absolute top-full mt-2 whitespace-nowrap px-2 py-1 text-[10px] font-mono uppercase tracking-wider transition-all duration-300 z-20
                        ${activeNodeId === node.id 
                            ? 'text-ink font-bold opacity-100 translate-y-0' 
                            : 'bg-ink dark:bg-white text-white dark:text-ink opacity-0 translate-y-2 pointer-events-none'}
                    `}
                    style={{ backgroundColor: activeNodeId === node.id ? 'var(--color-neon)' : '' }}
                    >
                        {node.name}
                    </div>
                </div>
            </div>
        ))}
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
                    {activeNode.role}
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
                         {activeNode.description}
                     </p>
                 </div>

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
                                     <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-400 group-hover/item:text-ink dark:group-hover/item:text-white">{connNode.name}</span>
                                     <span className="text-[10px] text-gray-400" style={{ color: 'var(--color-neon)' }}>LINKED</span>
                                 </div>
                             ) : null;
                         })}
                     </div>
                 </div>
             </div>
             
             {/* Footer Action */}
             <div className="p-6 border-t border-gray-100 dark:border-white/10">
                <button className="w-full py-3 bg-white dark:bg-[#222] border border-ink dark:border-white/20 text-ink dark:text-white font-mono text-xs hover:bg-ink hover:text-white dark:hover:bg-white dark:hover:text-ink transition-all duration-300 uppercase flex items-center justify-center gap-2 group">
                    Initialise Protocol
                    <span className="w-1.5 h-1.5 rounded-full group-hover:animate-ping" style={{ backgroundColor: 'var(--color-neon)' }}></span>
                 </button>
              </div>
           </div>
       )}
        </>
      )}
     </div>
   );
};

export default RelationshipNetwork;