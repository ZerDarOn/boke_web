import React from 'react';
import type { Project } from '../lib/api';
import { useProjectsList } from '../hooks/queries/projects';
import { Terminal, Cpu, Layers, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageLoader } from './DataState';
import SectionHeading from './SectionHeading';

const Arsenal: React.FC = () => {
  const { data: projects = [], isLoading: loading, error, refetch } = useProjectsList({
    featured: true,
    limit: 6,
  });

  // 根据项目ID或类型返回对应的图标
  const getProjectIcon = (project: Project) => {
    const iconClass = "text-stone-600 group-hover:text-neon transition-colors";
    if (project.type?.toLowerCase().includes('ui') || project.type?.toLowerCase().includes('design')) {
      return <Layers className={iconClass} size={24} />;
    } else if (project.type?.toLowerCase().includes('cli') || project.type?.toLowerCase().includes('tool')) {
      return <Terminal className={iconClass} size={24} />;
    } else {
      return <Cpu className={iconClass} size={24} />;
    }
  };

  return (
    <section id="works" className="relative -mx-3 my-10 overflow-hidden bg-[#10120f] px-6 py-20 text-white md:-mx-4 md:px-10 md:py-28 lg:-mx-6 lg:px-14">
      {/* Background Grid Lines */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_16%,hsl(var(--color-neon-hsl)/0.12),transparent_28%),linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:auto,36px_36px,36px_36px]" />

      <div className="relative z-10">
        <SectionHeading
          inverted
          index="03"
          eyebrow="Arsenal / 项目"
          title="正在运转的造物"
          description="这里不陈列漂亮的概念图，只留下真正写过、维护过、推倒再重建过的东西。"
          action={(
            <Link to="/projects" className="group inline-flex min-h-11 items-center gap-2 border-b border-white/50 pb-2 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:border-neon hover:text-neon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon">
              全部项目
              <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          )}
        />

      {/* Loading State */}
      {loading && <PageLoader className="py-20" />}

      {!loading && error && (
        <div className="mt-12 border border-red-300/15 bg-red-300/[0.04] px-6 py-10 text-center" role="alert">
          <p className="font-serif text-lg text-white">项目档案暂时离线。</p>
          <button type="button" onClick={() => refetch()} className="mt-4 font-mono text-xs uppercase tracking-[0.22em] text-neon underline underline-offset-4">重新连接</button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && projects.length === 0 && (
        <div className="mt-12 flex flex-col items-center justify-center border-y border-white/10 py-20 text-stone-500">
          <p className="font-serif text-lg text-stone-300">项目档案正在整理。</p>
        </div>
      )}

      <div className="relative z-10 mt-12 grid grid-cols-1 border-t border-white/10 lg:grid-cols-2">
        {!loading && !error && projects.length > 0 && projects.map((project, index) => (
          <article
            key={project.id} 
            className={`group relative flex min-h-80 flex-col border-b border-white/10 py-9 transition-colors duration-300 hover:bg-white/[0.035] lg:px-9 ${index % 2 === 0 ? 'lg:border-r' : ''}`}
          >
            <div className="absolute right-7 top-9 opacity-60">
              {getProjectIcon(project)}
            </div>

            <div className="mb-8 flex items-center gap-4 pr-12">
              <span className="font-mono text-[0.65rem] text-stone-500 tabular-nums">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-neon">
                {project.status}
              </span>
            </div>

            <div className="flex-1">
              <Link to={`/projects/${project.slug || project.id}`} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon">
                <h3 className="mb-3 max-w-[16ch] font-serif text-3xl font-bold leading-tight tracking-[-0.03em] text-white transition-colors group-hover:text-neon md:text-4xl">
                  {project.name}
                </h3>
              </Link>
              <p className="mb-5 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-stone-500">
                [{project.type}]
              </p>
              <p className="mb-7 max-w-[56ch] font-serif text-sm leading-7 text-stone-400 text-pretty">
                {project.description}
              </p>
            </div>

            <div className="mt-auto flex items-end justify-between gap-5 border-t border-white/10 pt-5">
              <div className="flex flex-wrap gap-x-3 gap-y-2">
                {project.tech.map(t => (
                  <span key={t} className="font-mono text-[0.68rem] text-stone-500">#{t}</span>
                ))}
              </div>
              
              {(project.link || project.demoUrl || project.githubUrl) && (
                <a 
                  href={project.link || project.demoUrl || project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`打开 ${project.name} 的外部链接`}
                  className="grid size-10 shrink-0 place-items-center border border-white/15 text-stone-300 transition-colors hover:border-neon hover:text-neon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon"
                >
                  <ArrowUpRight size={17} strokeWidth={1.6} />
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
      </div>
    </section>
  );
};

export default Arsenal;
