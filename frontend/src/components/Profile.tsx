import React, { useEffect, useState } from 'react';
import { api, Skill } from '../lib/api';

interface SkillNode {
  id: string;
  label: string;
  x: number;
  y: number;
  connections: string[];
  type: 'core' | 'major' | 'minor';
}

const Profile: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.skills.getAll();
      if (result.success && result.data) {
        setSkills(result.data);
      } else {
        setError(result.error || 'Failed to load skills');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Transform API skills to skill nodes
  const skillNodes: SkillNode[] = skills.map(skill => ({
    id: skill.id,
    label: skill.name,
    x: skill.nodeX || 50,
    y: skill.nodeY || 50,
    connections: skill.connections || [],
    type: skill.nodeType || 'minor',
  }));

  // Helper to find coordinates for lines
  const getNode = (id: string) => skillNodes.find(n => n.id === id);

  return (
    <section id="about" className="py-24 w-full bg-neutral-50 dark:bg-black relative overflow-hidden flex flex-col transition-colors duration-300">

      <div className="w-full z-10 flex-1 flex flex-col px-8">
        <div className="text-left mb-12 border-l-4 border-ink dark:border-white pl-6">
          <h2 className="text-3xl md:text-5xl font-serif font-black text-ink dark:text-white mb-2">
            ABOUT THE AUTHOR
          </h2>
          <p className="font-mono text-gray-500 text-xs tracking-widest">
            // IDENTITY & SKILLS MAP
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-400 dark:text-gray-600">Loading skills...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-red-500">
            {error}
          </div>
        ) : skillNodes.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            No skills found. Please add skills in the admin panel.
          </div>
        ) : (
          <div className="relative w-full aspect-square md:aspect-[16/10] bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 shadow-inner rounded-xl overflow-hidden p-4">

            {/* SVG Layer for Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
               {/* Render lines first so they are behind nodes */}
               {skillNodes.map((node) =>
                 node.connections.map((targetId) => {
                   const target = getNode(targetId);
                   if (!target) return null;
                   // Dynamic Stroke Color logic
                   const strokeColor = (node.type === 'major' || target.type === 'major')
                      ? 'var(--color-secondary)'
                      : 'var(--color-neon)';

                   return (
                     <line
                       key={`${node.id}-${targetId}`}
                       x1={`${node.x}%`}
                       y1={`${node.y}%`}
                       x2={`${target.x}%`}
                       y2={`${target.y}%`}
                       stroke={strokeColor} // Use Variable
                       strokeWidth="1.5"
                       strokeOpacity="0.4"
                       strokeDasharray="4 4"
                     >
                       <animate attributeName="stroke-dashoffset" from="0" to="8" dur="1s" repeatCount="indefinite" />
                     </line>
                   );
                 })
               )}
            </svg>

            {/* Nodes Layer */}
            {skillNodes.map((node) => (
              <div
                key={node.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 group cursor-crosshair"
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
              >
                {/* Node Visual */}
                <div
                  className={`
                      rounded-full flex items-center justify-center border-2 transition-all duration-300 relative
                      ${node.type === 'core' ? 'w-20 h-20 bg-ink shadow-[0_0_30px_rgba(16,185,129,0.3)]' : ''}
                      ${node.type === 'major' ? 'w-12 h-12 bg-white dark:bg-[#111] border-ink dark:border-gray-500 hover:bg-neutral-900 dark:hover:bg-white' : ''}
                      ${node.type === 'minor' ? 'w-8 h-8 bg-gray-100 dark:bg-[#222] border-gray-300 dark:border-gray-700 hover:bg-white' : ''}
                  `}
                  style={{
                      // Dynamic Border Colors
                      borderColor: node.type === 'core'
                          ? 'var(--color-neon)'
                          : (node.type === 'major' ? 'var(--color-secondary)' : '') // Major nodes use Secondary
                  }}
                >
                   <div
                      className={`
                          rounded-full transition-all duration-500
                          ${node.type === 'core' ? 'w-16 h-16 border border-white/20 animate-spin-slow' : ''}
                          ${node.type === 'major' ? 'w-2 h-2 bg-ink dark:bg-white' : ''}
                          ${node.type === 'minor' ? 'w-1 h-1 bg-gray-400' : ''}
                      `}
                      style={{
                          // Hover Effects using vars
                          backgroundColor: node.type === 'major' ? '' : (node.type === 'minor' ? '' : '')
                      }}
                   ></div>

                   {/* Tooltip Label */}
                   <div
                      className={`
                          absolute top-full mt-2 whitespace-nowrap px-2 py-1 bg-ink text-white text-[10px] font-mono uppercase tracking-wider
                          opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20
                          ${node.type === 'core' ? 'opacity-100 text-ink font-bold' : ''}
                      `}
                      style={{ backgroundColor: node.type === 'core' ? 'var(--color-neon)' : '' }}
                   >
                     {node.label}
                   </div>
                </div>
              </div>
            ))}

            {/* Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
          </div>
        )}

      </div>
    </section>
  );
};

export default Profile;