import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSkillGroups, useSkillNodes } from '../hooks/queries/skills';
import SectionHeading from './SectionHeading';

interface SkillNode {
  id: string;
  label: string;
  x: number;
  y: number;
  connections: string[];
  type: 'core' | 'major' | 'minor';
}

const Profile: React.FC = () => {
  const { data: skills = [], isLoading: nodesLoading, error: nodesError, refetch: refetchNodes } = useSkillNodes();
  const { data: skillGroups = [], isLoading: groupsLoading, error: groupsError, refetch: refetchGroups } = useSkillGroups();
  const loading = nodesLoading || groupsLoading;
  const error = skills.length === 0 && skillGroups.length === 0
    ? nodesError?.message || groupsError?.message || null
    : null;

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
    <section id="about" className="relative flex w-full flex-col overflow-hidden py-16 transition-colors duration-300 md:py-28">

      <div className="z-10 flex w-full flex-1 flex-col">
        <SectionHeading
          index="04"
          eyebrow="Identity / 关于"
          title="能力不是清单，是星图"
          description="工具会更替，真正留下来的是理解问题、拆解系统和把想法做成作品的方式。"
          action={(
            <Link to="/about" className="group inline-flex min-h-11 items-center gap-2 border-b border-ink pb-2 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink transition-colors hover:border-neon hover:text-neon-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon dark:border-white/60 dark:text-white dark:hover:border-neon dark:hover:text-neon">
              认识作者
              <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          )}
        />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-stone-400">Mapping skills...</div>
          </div>
        ) : error ? (
          <div className="mt-12 flex flex-col items-center justify-center border border-red-900/20 bg-red-950/[0.04] py-14 text-red-700 dark:border-red-300/15 dark:text-red-300" role="alert">
            <p className="font-serif">技能星图暂时离线。</p>
            <button type="button" onClick={() => { refetchNodes(); refetchGroups(); }} className="mt-4 font-mono text-xs uppercase tracking-[0.22em] underline underline-offset-4">重新连接</button>
          </div>
        ) : skillNodes.length === 0 && skillGroups.length === 0 ? (
          <div className="mt-12 flex items-center justify-center border-y border-ink/10 py-20 text-stone-400 dark:border-white/10 dark:text-stone-500">
            <p className="font-serif text-lg">能力档案正在整理。</p>
          </div>
        ) : skillNodes.length === 0 ? (
          <div className="mt-12 grid gap-px bg-ink/10 dark:bg-white/10 md:grid-cols-2">
            {skillGroups.map((group, groupIndex) => (
              <article key={group.category} className="min-h-52 bg-paper p-7 dark:bg-[#0b0d0c] md:p-9">
                <div className="mb-8 flex items-center justify-between">
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-neon-dark dark:text-neon">{group.category}</span>
                  <span className="font-mono text-[0.62rem] text-stone-400 tabular-nums">{String(groupIndex + 1).padStart(2, '0')}</span>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-4">
                  {group.skills.map((skill) => (
                    <span key={skill.id} className="border-b border-ink/15 pb-1 font-serif text-lg font-semibold text-ink dark:border-white/15 dark:text-white">
                      {skill.name}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="relative mt-12 aspect-square w-full overflow-hidden border border-ink/10 bg-white/55 p-4 shadow-[inset_0_0_80px_rgba(29,35,30,0.04)] dark:border-white/10 dark:bg-white/[0.025] md:aspect-[16/9]">

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
                     />
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
                          ${node.type === 'core' ? 'w-16 h-16 border border-white/20' : ''}
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
