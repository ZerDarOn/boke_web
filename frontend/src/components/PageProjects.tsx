import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TRANSLATIONS } from '../constants';
import { ArrowUpRight, ExternalLink, Box, Activity, Layers } from 'lucide-react';
import { PageLoader, ErrorBanner } from './DataState';
import { useProjectsList } from '../hooks/queries/projects';

const PageProjects: React.FC = () => {
  const t = TRANSLATIONS['ZH'];
  
  const { data: projects = [], isLoading: loading, error: queryError } = useProjectsList({ limit: 500 });
  const error = queryError?.message ?? null;
  
  const primaryProjects = projects.filter(p => p.featured);
  const otherProjects = projects.filter(p => !p.featured);

  const total = projects.length;
  const completed = projects.filter(p => p.status === 'DEPLOYED' || p.status === 'ARCHIVED').length;
  const active = projects.filter(p => p.status === 'ACTIVE').length;
  
  const techDistribution = useMemo(() => {
    const techCounts: Record<string, number> = {};
    projects.forEach(project => {
      project.tech.forEach(t => {
        techCounts[t] = (techCounts[t] || 0) + 1;
      });
    });
    
    const totalTech = Object.values(techCounts).reduce((a, b) => a + b, 0);
    const sortedTech = Object.entries(techCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4);
    
    const colors = ['bg-neon', 'bg-secondary', 'bg-stone-500', 'bg-stone-300'];
    
    return sortedTech.map(([name, count], index) => ({
      name,
      w: `${((count / totalTech) * 100).toFixed(0)}%`,
      c: colors[index]
    }));
  }, [projects]);

  const popularTags = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    projects.forEach(project => {
      project.tech.forEach(tech => {
        tagCounts[tech] = (tagCounts[tech] || 0) + 1;
      });
    });
    
    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);
  }, [projects]);

  return (
    <div className="flex min-h-[800px] w-full flex-col gap-20 py-12 md:py-16">
      {loading && <PageLoader className="py-20" />}
      
      {error && <ErrorBanner error={error} />}
      
      {!loading && !error && (
        <>
      {/* 1. Dashboard Cards (Refactored to distinct cards) */}
      <section className="flex flex-col gap-6">
          
          {/* Card 1: Project Counters (Distinct Blocks) */}
          <div className="grid grid-cols-1 gap-px bg-ink/10 dark:bg-white/10 md:grid-cols-3">
              {/* Total */}
              <div className="group flex items-center justify-between bg-[#10120f] p-7 text-white transition-colors hover:bg-[#171a16]">
                  <div>
                      <div className="mb-2 font-mono text-5xl font-semibold tabular-nums text-white">{total}</div>
                      <div className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-stone-500">{t.TOTAL_PROJECTS}</div>
                  </div>
                  <Box className="size-10 text-stone-700 transition-colors group-hover:text-neon" strokeWidth={1.3} />
              </div>

              {/* Completed */}
              <div className="group flex items-center justify-between bg-[#10120f] p-7 text-white transition-colors hover:bg-[#171a16]">
                  <div>
                      <div className="mb-2 font-mono text-5xl font-semibold tabular-nums text-white">{completed}</div>
                      <div className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-stone-500">{t.COMPLETED}</div>
                  </div>
                  <Activity className="size-10 text-stone-700 transition-colors group-hover:text-neon" strokeWidth={1.3} />
              </div>

              {/* Active */}
              <div className="group flex items-center justify-between bg-[#10120f] p-7 text-white transition-colors hover:bg-[#171a16]">
                  <div>
                      <div className="mb-2 font-mono text-5xl font-semibold tabular-nums text-white">{active}</div>
                      <div className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-stone-500">{t.IN_PROGRESS}</div>
                  </div>
                  <Layers className="size-10 text-stone-700 transition-colors group-hover:text-secondary" strokeWidth={1.3} />
              </div>
          </div>

          {/* Cards 2 & 3: Stack & Tags (Separate Containers) */}
          <div className="grid grid-cols-1 gap-px bg-ink/10 dark:bg-white/10 lg:grid-cols-2">
              
              {/* Stack Distribution Card */}
              <div className="bg-white/55 p-8 dark:bg-white/[0.025]">
                  <div className="mb-6 flex items-center gap-2 border-l-2 border-neon pl-4">
                       <h3 className="font-serif text-xl font-bold tracking-tight text-ink dark:text-white">技术栈分布</h3>
                  </div>
                  
                  <div className="mb-6 flex h-2 w-full overflow-hidden">
                      {techDistribution.map((item) => (
                          <div key={item.name} style={{ width: item.w }} className={`${item.c} h-full`} title={item.name}></div>
                      ))}
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                      {techDistribution.map((item) => (
                          <div key={item.name} className="flex items-center gap-2 border-b border-ink/10 pb-1 dark:border-white/10">
                              <div className={`size-1.5 ${item.c}`}></div>
                              <span className="font-mono text-xs font-semibold text-stone-600 dark:text-stone-300">{item.name}</span>
                          </div>
                      ))}
                  </div>
              </div>

      {/* Popular Tags Card */}
               <div className="bg-white/55 p-8 dark:bg-white/[0.025]">
                   <div className="mb-6 flex items-center gap-2 border-l-2 border-secondary pl-4">
                        <h3 className="font-serif text-xl font-bold tracking-tight text-ink dark:text-white">常用技术</h3>
                   </div>
                   
                   <div className="flex flex-wrap gap-3">
                       {popularTags.map(([tag, count]) => (
                           <span key={tag} className="group flex cursor-default items-center gap-2 border border-ink/10 px-3 py-2 font-mono text-xs text-ink transition-colors hover:border-neon dark:border-white/10 dark:text-white">
                               {tag} 
                               <span className="text-[0.62rem] font-bold tabular-nums text-stone-500 transition-colors group-hover:text-neon-dark dark:group-hover:text-neon">
                                   {count}
                               </span>
                           </span>
                       ))}
                   </div>
               </div>
          </div>

      </section>

      {/* 2. Primary Projects Section */}
      <section>
          <div className="mb-8 flex items-end justify-between border-b border-ink/15 pb-4 dark:border-paper/15">
             <h2 className="flex items-center gap-3 font-mono text-xs font-semibold uppercase tracking-[0.24em] text-ink dark:text-paper">
                <Box className="text-neon" size={18} /> SELECTED BLUEPRINTS
             </h2>
          </div>

          {primaryProjects.length > 0 ? (
              <div className="grid grid-cols-1 gap-px bg-ink/10 dark:bg-white/10 lg:grid-cols-2">
                  {primaryProjects.map((project, index) => (
                      <Link
                          key={project.id}
                          to={`/projects/${project.id}`}
                          className="group relative flex min-h-72 flex-col bg-white/70 transition-colors duration-300 hover:bg-white dark:bg-white/[0.025] dark:hover:bg-white/[0.05]"
                      >
                       
                          {/* Status Indicator */}
                          <div className="absolute right-6 top-6 z-20 flex items-center gap-2">
                              <div className={`size-1.5 ${project.status === 'ACTIVE' ? 'bg-neon' : 'bg-stone-400'}`}></div>
                              <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-stone-500">{project.status}</span>
                          </div>

                          {/* Content */}
                          <div className="flex flex-1 flex-col p-7 md:p-9">
                              <span className="mb-8 font-mono text-[0.62rem] text-stone-400 tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                              <div className="mb-4 flex items-start justify-between">
                                  <div>
                                      <h3 className="font-serif text-3xl font-bold leading-tight tracking-[-0.03em] text-ink transition-colors group-hover:text-neon-dark dark:text-white dark:group-hover:text-neon">
                                          {project.name}
                                      </h3>
                                      <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-stone-500">
                                          {project.type}
                                      </span>
                                  </div>
                                  <ArrowUpRight className="text-stone-400 transition-all group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-neon" strokeWidth={1.5} />
                              </div>

                              <p className="mb-6 flex-1 font-serif text-sm leading-7 text-stone-600 dark:text-stone-400">
                                  {project.description}
                              </p>

                              <div className="flex flex-wrap gap-x-3 gap-y-2 border-t border-ink/10 pt-4 dark:border-white/10">
                                  {project.tech.map(t => (
                                      <span key={t} className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-stone-500">
                                          {t}
                                      </span>
                                  ))}
                              </div>
                          </div>
                      </Link>
                  ))}
              </div>
          ) : (
              <div className="flex items-center justify-center border-y border-ink/10 p-12 dark:border-white/10">
                  <span className="font-serif text-stone-500">
                      重点项目正在整理
                  </span>
              </div>
          )}
      </section>

      {/* 3. Other Projects List */}
      <section>
          <div className="mb-6">
              <h3 className="font-mono text-sm font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="h-[1px] w-8 bg-gray-300 dark:bg-gray-700"></div>
                  Archive
              </h3>
          </div>

          {otherProjects.length > 0 ? (
              <div className="flex flex-col border-t border-gray-200 dark:border-white/10">
                  {otherProjects.map((project) => (
                      <Link
                          key={project.id}
                          to={`/projects/${project.id}`}
                          className="group flex flex-col md:flex-row md:items-center gap-4 p-4 border-b border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer relative"
                      >
                          <div className="w-1 h-0 bg-neon absolute left-0 top-0 bottom-0 group-hover:h-full transition-all duration-300"></div>
                           
                          <div className="w-32 font-mono text-xs text-gray-400 group-hover:text-neon font-bold">
                              {project.id}
                          </div>

                          <div className="flex-1">
                              <h4 className="font-sans font-bold text-base text-ink dark:text-white group-hover:text-neon transition-colors">
                                  {project.name}
                              </h4>
                              <span className="text-xs font-mono text-gray-400 uppercase hidden md:inline-block">
                                  [{project.type}]
                              </span>
                          </div>

                          <div className="flex-1 text-sm font-serif text-gray-500 dark:text-gray-400 line-clamp-1">
                              {project.description}
                          </div>

                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <ExternalLink size={16} className="text-neon" />
                          </div>
                      </Link>
                  ))}
              </div>
          ) : (
              <div className="flex items-center justify-center border-t border-ink/10 p-12 dark:border-white/10">
                  <span className="font-serif text-stone-500">
                      暂无归档项目
                  </span>
              </div>
          )}
      </section>

      </>
      )}

    </div>
  );
};

export default PageProjects;
