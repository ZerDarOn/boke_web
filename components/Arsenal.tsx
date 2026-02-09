import React from 'react';
import { PROJECTS } from '../constants';
import { Terminal, Cpu, Layers, ExternalLink } from 'lucide-react';

const Arsenal: React.FC = () => {
  return (
    <section id="works" className="py-24 w-full bg-ink text-paper relative rounded-lg overflow-hidden my-12 px-8 shadow-2xl">
      {/* Background Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

      <div className="relative z-10 mb-16 flex flex-col items-start gap-4">
        <div>
           {/* Explicitly text-white to prevent theme overrides */}
           <h2 className="text-4xl md:text-5xl font-sans font-black text-white mb-2 tracking-tighter">
            SELECTED WORKS
          </h2>
          <div className="h-1 w-16 bg-neon"></div>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {PROJECTS.map((project) => (
          <div 
            key={project.id} 
            className="group bg-neutral-900 border border-neutral-700 p-6 flex flex-col h-full hover:border-neon transition-colors duration-300 relative overflow-hidden"
          >
            {/* Tech Decoration */}
            <div className="absolute top-0 right-0 p-3 opacity-50">
                {project.id === 'P-01' && <Cpu className="text-neutral-600 group-hover:text-neon" size={24} />}
                {project.id === 'P-02' && <Terminal className="text-neutral-600 group-hover:text-neon" size={24} />}
                {project.id === 'P-03' && <Layers className="text-neutral-600 group-hover:text-neon" size={24} />}
            </div>

            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <span className="font-mono text-[10px] text-neon border border-neon/30 px-1.5 py-0.5 bg-neon/5">
                {project.id}
              </span>
              <span className={`font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 ${project.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                {project.status}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1">
              <h3 className="text-2xl font-bold font-sans text-white mb-3 group-hover:text-neon transition-colors">
                {project.name}
              </h3>
              <p className="font-mono text-[10px] text-gray-500 mb-4 uppercase tracking-wider">
                [{project.type}]
              </p>
              <p className="text-gray-400 font-serif text-sm leading-relaxed mb-6">
                {project.description}
              </p>
            </div>

            {/* Footer / Tech Stack */}
            <div className="mt-auto pt-4 border-t border-neutral-800 flex justify-between items-end">
              <div className="flex flex-wrap gap-2">
                {project.tech.map(t => (
                  <span key={t} className="text-xs font-mono text-gray-500 hover:text-white transition-colors">#{t}</span>
                ))}
              </div>
              
              <button className="bg-white text-black p-2 hover:bg-neon hover:text-white transition-all duration-300">
                <ExternalLink size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Arsenal;