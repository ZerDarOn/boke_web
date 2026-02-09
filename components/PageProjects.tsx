import React, { useMemo } from 'react';
import { PROJECTS, TRANSLATIONS, TAGS } from '../constants';
import { ArrowUpRight, Github, ExternalLink, Box, Activity, Layers, Tag } from 'lucide-react';

interface PageProjectsProps {
    // Removed dynamic lang prop
}

const PageProjects: React.FC<PageProjectsProps> = () => {
  // Hardcoded to Chinese for content stability
  const lang = 'ZH';
  const t = TRANSLATIONS['ZH'];
  
  const primaryProjects = PROJECTS.filter(p => p.featured);
  const otherProjects = PROJECTS.filter(p => !p.featured);

  // Analytics
  const total = PROJECTS.length;
  const completed = PROJECTS.filter(p => p.status === 'DEPLOYED' || p.status === 'ARCHIVED').length;
  const active = PROJECTS.filter(p => p.status === 'ACTIVE').length;
  
  // Tech Stack Mock Calc
  const techDistribution = [
      { name: 'TS/JS', w: '45%', c: 'bg-blue-500' },
      { name: 'Rust', w: '25%', c: 'bg-orange-500' },
      { name: 'CSS', w: '20%', c: 'bg-pink-500' },
      { name: 'Other', w: '10%', c: 'bg-gray-500' },
  ];

  // Memoize random counts so they don't change on re-render/language toggle
  const tagCounts = useMemo(() => {
      return TAGS.map(() => Math.floor(Math.random() * 10) + 1);
  }, []);

  return (
    <div className="w-full bg-white dark:bg-ink p-6 md:p-8 min-h-[800px] flex flex-col gap-12">
      
      {/* 1. Dashboard Cards (Refactored to distinct cards) */}
      <section className="flex flex-col gap-8">
          
          {/* Card 1: Project Counters (Distinct Blocks) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total */}
              <div className="bg-[#1a1a1a] p-6 rounded-2xl flex items-center justify-between shadow-lg group hover:ring-2 hover:ring-gray-500 transition-all">
                  <div>
                      <div className="text-6xl font-black font-sans text-white mb-2">{total}</div>
                      <div className="text-sm font-mono text-gray-400 uppercase tracking-widest">{t.TOTAL_PROJECTS}</div>
                  </div>
                  <Box className="text-gray-600 w-12 h-12 group-hover:text-white transition-colors" />
              </div>

              {/* Completed */}
              <div className="bg-[#064e3b] p-6 rounded-2xl flex items-center justify-between shadow-lg group hover:ring-2 hover:ring-neon transition-all">
                  <div>
                      <div className="text-6xl font-black font-sans text-white mb-2">{completed}</div>
                      <div className="text-sm font-mono text-green-200 uppercase tracking-widest">{t.COMPLETED}</div>
                  </div>
                  <Activity className="text-green-800 w-12 h-12 group-hover:text-neon transition-colors" />
              </div>

              {/* Active */}
              <div className="bg-[#1e3a8a] p-6 rounded-2xl flex items-center justify-between shadow-lg group hover:ring-2 hover:ring-blue-400 transition-all">
                  <div>
                      <div className="text-6xl font-black font-sans text-white mb-2">{active}</div>
                      <div className="text-sm font-mono text-blue-200 uppercase tracking-widest">{t.IN_PROGRESS}</div>
                  </div>
                  <Layers className="text-blue-800 w-12 h-12 group-hover:text-blue-300 transition-colors" />
              </div>
          </div>

          {/* Cards 2 & 3: Stack & Tags (Separate Containers) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Stack Distribution Card */}
              <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-8 rounded-2xl">
                  <div className="flex items-center gap-2 border-l-4 border-neon pl-4 mb-6">
                       <h3 className="font-bold text-xl text-ink dark:text-white tracking-tight">技术栈统计</h3>
                  </div>
                  
                  <div className="flex h-4 w-full rounded-full overflow-hidden mb-6">
                      {techDistribution.map((item) => (
                          <div key={item.name} style={{ width: item.w }} className={`${item.c} h-full`} title={item.name}></div>
                      ))}
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                      {techDistribution.map((item) => (
                          <div key={item.name} className="bg-white dark:bg-black/40 px-3 py-2 rounded-lg flex items-center gap-3 border border-gray-100 dark:border-white/5">
                              <div className={`w-3 h-3 rounded-full ${item.c}`}></div>
                              <span className="text-sm font-mono text-gray-600 dark:text-gray-300 font-bold">{item.name}</span>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Popular Tags Card */}
              <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-8 rounded-2xl">
                  <div className="flex items-center gap-2 border-l-4 border-white dark:border-gray-500 pl-4 mb-6">
                       <h3 className="font-bold text-xl text-ink dark:text-white tracking-tight">热门标签</h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                      {TAGS.slice(0, 8).map((tag, index) => (
                          <span key={tag} className="bg-black text-white px-4 py-2 text-sm font-mono rounded-lg flex items-center gap-2 group cursor-default hover:bg-neon transition-colors">
                              {tag} 
                              <span className="bg-white/20 px-1.5 rounded text-xs font-bold group-hover:bg-black/20 group-hover:text-white transition-colors">
                                  {tagCounts[index]}
                              </span>
                          </span>
                      ))}
                  </div>
              </div>
          </div>

      </section>

      {/* 2. Primary Projects Section */}
      <section>
          <div className="flex items-end justify-between mb-8 border-b-2 border-ink dark:border-paper pb-2">
            <h2 className="text-2xl font-black font-sans text-ink dark:text-paper tracking-tight flex items-center gap-3">
               <Box className="text-neon" /> PRIMARY_BLUEPRINTS
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {primaryProjects.map((project) => (
                  <div key={project.id} className="group border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-neon transition-all duration-300 relative flex flex-col shadow-sm hover:shadow-xl">
                      
                      {/* Status Indicator */}
                      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/80 px-2 py-1 rounded">
                          <div className={`w-2 h-2 rounded-full ${project.status === 'ACTIVE' ? 'bg-neon animate-pulse' : 'bg-gray-400'}`}></div>
                          <span className="text-[10px] font-mono text-white">{project.status}</span>
                      </div>

                      {/* Content */}
                      <div className="p-6 flex-1 flex flex-col">
                          <div className="flex justify-between items-start mb-4 mt-2">
                              <div>
                                  <h3 className="text-2xl font-bold font-sans text-ink dark:text-white group-hover:text-neon transition-colors">
                                      {project.name}
                                  </h3>
                                  <span className="font-mono text-xs text-gray-400 uppercase tracking-wider">
                                      {project.type}
                                  </span>
                              </div>
                              <ArrowUpRight className="text-gray-300 group-hover:text-neon transition-colors" />
                          </div>

                          <p className="font-serif text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6 flex-1">
                              {project.description}
                          </p>

                          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100 dark:border-white/10">
                              {project.tech.map(t => (
                                  <span key={t} className="px-2 py-1 bg-gray-50 dark:bg-white/10 text-[10px] font-mono text-gray-500 dark:text-gray-400 uppercase rounded hover:bg-neon hover:text-white transition-colors">
                                      {t}
                                  </span>
                              ))}
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </section>

      {/* 3. Other Projects List */}
      <section>
          <div className="mb-6">
             <h3 className="font-mono text-sm font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                 <div className="h-[1px] w-8 bg-gray-300 dark:bg-gray-700"></div>
                 Archive
             </h3>
          </div>

          <div className="flex flex-col border-t border-gray-200 dark:border-white/10">
              {otherProjects.map((project) => (
                  <div key={project.id} className="group flex flex-col md:flex-row md:items-center gap-4 p-4 border-b border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer relative">
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
                  </div>
              ))}
          </div>
      </section>

    </div>
  );
};

export default PageProjects;