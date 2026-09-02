import React from 'react';
import type { Project } from '../lib/api';
import { useProjectsList } from '../hooks/queries/projects';
import { Terminal, Cpu, Layers, ExternalLink } from 'lucide-react';
import { PageLoader } from './DataState';

const Arsenal: React.FC = () => {
  const { data: projects = [], isLoading: loading } = useProjectsList({
    featured: true,
    limit: 6,
  });

  // 根据项目ID或类型返回对应的图标
  const getProjectIcon = (project: Project, index: number) => {
    const iconClass = "text-gray-400 dark:text-neutral-600 group-hover:text-neon transition-colors";
    if (project.type?.toLowerCase().includes('ui') || project.type?.toLowerCase().includes('design')) {
      return <Layers className={iconClass} size={24} />;
    } else if (project.type?.toLowerCase().includes('cli') || project.type?.toLowerCase().includes('tool')) {
      return <Terminal className={iconClass} size={24} />;
    } else {
      return <Cpu className={iconClass} size={24} />;
    }
  };

  return (
    <section id="works" className="py-24 w-full bg-neutral-50 dark:bg-[#0a0a0a] text-ink dark:text-white relative rounded-lg overflow-hidden my-12 px-8 shadow-sm border border-gray-100 dark:border-white/10">
      {/* Background Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

      <div className="relative z-10 mb-16 flex flex-col items-start gap-4">
        <div>
           <h2 className="text-4xl md:text-5xl font-sans font-black text-ink dark:text-white mb-2 tracking-tighter">
            SELECTED WORKS
          </h2>
          <div className="h-1 w-16 bg-neon"></div>
        </div>
      </div>

      {/* Loading State */}
      {loading && <PageLoader className="py-20" />}

      {/* Empty State */}
      {!loading && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
          <p className="text-lg font-serif">暂无内容</p>
        </div>
      )}

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!loading && projects.length > 0 && projects.map((project, index) => (
          <div 
            key={project.id} 
            className="group bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col h-full hover:border-neon transition-colors duration-300 relative overflow-hidden"
          >
            {/* Tech Decoration */}
            <div className="absolute top-0 right-0 p-3 opacity-50">
              {getProjectIcon(project, index)}
            </div>

            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <span className="font-mono text-[10px] text-neon border border-neon/30 rounded px-1.5 py-0.5 bg-neon/5">
                {project.id}
              </span>
              <span className={`font-mono text-[10px] uppercase tracking-wider rounded px-1.5 py-0.5 ${project.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                {project.status}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1">
              <h3 className="text-2xl font-bold font-sans text-ink dark:text-white mb-3 group-hover:text-neon transition-colors">
                {project.name}
              </h3>
              <p className="font-mono text-[10px] text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">
                [{project.type}]
              </p>
              <p className="text-gray-600 dark:text-gray-300 font-serif text-sm leading-relaxed mb-6">
                {project.description}
              </p>
            </div>

            {/* Footer / Tech Stack */}
            <div className="mt-auto pt-4 border-t border-gray-100 dark:border-neutral-800 flex justify-between items-end">
              <div className="flex flex-wrap gap-2">
                {project.tech.map(t => (
                  <span key={t} className="text-xs font-mono text-gray-500 dark:text-gray-400 hover:text-ink dark:hover:text-white transition-colors">#{t}</span>
                ))}
              </div>
              
              {(project.link || project.demoUrl || project.githubUrl) && (
                <a 
                  href={project.link || project.demoUrl || project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-ink dark:bg-white text-white dark:text-ink rounded-lg p-2 hover:bg-neon hover:text-white dark:hover:bg-neon dark:hover:text-white transition-all duration-300"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Arsenal;