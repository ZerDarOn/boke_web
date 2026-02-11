import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SKILLS_DATA, PROJECTS, TRANSLATIONS } from '../constants';
import { Zap, Database, Cpu, ExternalLink, X, Code, Server, PenTool } from 'lucide-react';

interface PageSkillsProps {
    // Removed dynamic lang prop to keep content static
}

const PageSkills: React.FC<PageSkillsProps> = () => {
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  
  // Hardcoded to Chinese for content stability
  const lang = 'ZH';
  const t = TRANSLATIONS['ZH'];
  
  // 获取相关项目
  const getRelatedProjects = (skillName: string) => {
    if (!skillName) return [];
    
    const keywords = skillName.split('/').map(s => s.trim().toLowerCase());
    return PROJECTS.filter(project =>
      project.tech.some(tech =>
        keywords.some(keyword => 
          tech.toLowerCase().includes(keyword) ||
          keyword.includes(tech.toLowerCase())
        )
      )
    ).slice(0, 4); // 只显示前4个
  };
  
  const relatedProjects = getRelatedProjects(activeSkill);

  // Aggregate Data for Donut Chart (By Rank)
  const rankCounts: Record<string, number> = {};
  let totalSkills = 0;
  SKILLS_DATA.forEach(group => {
      group.items.forEach(item => {
          rankCounts[item.rank] = (rankCounts[item.rank] || 0) + 1;
          totalSkills++;
      });
  });

  const rankColors: Record<string, string> = {
      'MASTER': '#f43f5e', // Rose
      'EXPERT': '#f97316', // Orange
      'ADEPT': '#fbbf24',  // Amber
      'NOVICE': '#10b981'  // Emerald
  };

  const rankLabels: Record<string, string> = {
      'MASTER': '专家',
      'EXPERT': '高级',
      'ADEPT': '中级',
      'NOVICE': '初级'
  };

  // Calculate Donut Segments
  let cumulativePercent = 0;
  const donutSegments = Object.entries(rankCounts).map(([rank, count]) => {
      const percent = (count / totalSkills) * 100;
      const start = cumulativePercent;
      cumulativePercent += percent;
      return { rank, percent, start, end: cumulativePercent, color: rankColors[rank] };
  });

  // SVG Helper
  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div className="w-full bg-white dark:bg-ink p-6 md:p-12 min-h-[800px] relative flex flex-col gap-12">
        
        {/* 1. Header Section */}
        <div className="w-full">
            <h2 className="text-4xl font-black font-sans text-ink dark:text-paper mb-4">SKILL.ANALYTICS</h2>
            <div className="h-1 w-24 bg-neon mb-6"></div>
            <div className="flex flex-col gap-2 text-gray-500 dark:text-gray-400 font-serif text-sm max-w-2xl">
                <p>全栈技术能力与专业素养的综合可视化分析。</p>
                <p className="font-mono text-xs opacity-70">
                    // CORE_MODULES: FRONTEND, BACKEND, DESIGN_SYSTEMS
                </p>
            </div>
        </div>

        {/* 2. Visual Analytics Section */}
        <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-8 flex flex-col md:flex-row items-center gap-12">
            
            {/* Left: Stats */}
            <div className="flex-1 space-y-8 w-full md:w-auto min-w-[200px]">
                <div>
                    <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">{t.TOTAL_EXP}</div>
                    <div className="text-3xl font-black font-sans text-ink dark:text-white">5Y+</div>
                </div>
                <div>
                    <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">{t.SKILLS_COUNT}</div>
                    <div className="text-3xl font-black font-sans text-ink dark:text-white">{totalSkills}</div>
                </div>
                <div>
                    <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1">{t.GLOBAL_RANK}</div>
                    <div className="text-3xl font-black font-sans text-neon">S-CLASS</div>
                </div>
            </div>

            {/* Center: Donut Chart - Shifted Left */}
            <div className="flex flex-col items-center mr-8 lg:mr-16">
                <div className="relative w-48 h-48 md:w-64 md:h-64 flex-shrink-0">
                    <div className="absolute top-0 left-0 w-full text-left font-bold text-ink dark:text-white text-lg -ml-16">
                       按等级
                    </div>
                    {/* Viewbox adjusted */}
                    <svg viewBox="-1.2 -1.2 2.4 2.4" className="w-full h-full transform -rotate-90 overflow-visible">
                        {donutSegments.map((segment) => {
                            const [startX, startY] = getCoordinatesForPercent(segment.start / 100);
                            const [endX, endY] = getCoordinatesForPercent(segment.end / 100);
                            const largeArcFlag = segment.percent > 50 ? 1 : 0;
                            const pathData = [
                                `M ${startX} ${startY}`,
                                `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                            ].join(' ');
                            return (
                                <path 
                                    key={segment.rank} 
                                    d={pathData} 
                                    fill="none" 
                                    stroke={segment.color} 
                                    strokeWidth="0.25" 
                                    className="hover:opacity-80 transition-opacity cursor-pointer hover:stroke-[0.3]"
                                />
                            );
                        })}
                    </svg>
                    {/* Inner Circle */}
                    <div className="absolute inset-[15%] rounded-full bg-gray-50 dark:bg-[#111]"></div>
                </div>
            </div>

            {/* Right/Bottom: Legend - Improved Layout to prevent overflow */}
            <div className="flex flex-col justify-center gap-4 min-w-[140px] z-10 -ml-4">
                 {Object.entries(rankLabels).map(([rank, label]) => (
                     <div key={rank} className="flex items-center gap-3 group cursor-pointer">
                         {/* Larger Dot */}
                         <div className="w-3 h-3 flex-shrink-0 rounded-full shadow-sm ring-2 ring-transparent group-hover:ring-white/20 transition-all" style={{ backgroundColor: rankColors[rank] }}></div>
                         
                         <div className="flex flex-col">
                             {/* Label on top */}
                             <div className="text-sm font-bold text-ink dark:text-white group-hover:text-neon transition-colors leading-tight">
                                 {label}
                             </div>
                             {/* Stats below */}
                             <div className="text-[10px] font-mono text-gray-400 whitespace-nowrap">
                                 {rankCounts[rank] || 0} ({((rankCounts[rank] || 0) / totalSkills * 100).toFixed(0)}%)
                             </div>
                         </div>
                     </div>
                 ))}
            </div>

        </div>

        {/* 3. Detailed Skill List */}
        <div className="space-y-12">
            {SKILLS_DATA.length > 0 ? (
                SKILLS_DATA.map((group, idx) => (
                    <div key={idx}>
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-white/10 pb-2">
                            <div className="p-1.5 bg-ink dark:bg-white text-white dark:text-black rounded-sm">
                                {idx === 0 && <Code size={16} />}
                                {idx === 1 && <Server size={16} />}
                                {idx === 2 && <PenTool size={16} />}
                            </div>
                            <h3 className="font-sans font-bold text-lg text-ink dark:text-paper uppercase tracking-wider">
                                {group.category}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {group.items.map((skill) => (
                                <div
                                    key={skill.name}
                                    onClick={() => setActiveSkill(skill.name)}
                                    className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 p-4 hover:border-neon transition-all duration-300 cursor-pointer group/item flex flex-col gap-3"
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold font-mono text-ink dark:text-paper">{skill.name}</span>
                                        <span
                                            className="text-[10px] font-black px-1.5 py-0.5 rounded text-white"
                                            style={{ backgroundColor: rankColors[skill.rank] }}
                                        >
                                            {skill.rank}
                                        </span>
                                    </div>

                                    <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-neon relative"
                                            style={{ width: `${skill.level}%` }}
                                        ></div>
                                    </div>

                                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
                                        <span>{skill.projectCount} Projects</span>
                                        <span className="group-hover/item:text-neon transition-colors">Details &rarr;</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                <div className="flex items-center justify-center p-12 bg-gray-50 dark:bg-white/5 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-xl">
                    <span className="text-gray-500 dark:text-gray-400 font-mono text-sm">
                        🚫 暂无技能数据
                    </span>
                </div>
            )}
        </div>

        {/* Interaction Modal */}
        {activeSkill && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-neutral-900 w-full max-w-lg p-8 border-2 border-neon shadow-[0_0_30px_rgba(16,185,129,0.2)] relative">
                    <button 
                        onClick={() => setActiveSkill(null)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>

                    <h3 className="text-2xl font-black font-sans text-ink dark:text-white mb-6 flex items-center gap-2">
                        {activeSkill} <span className="text-neon text-sm font-mono border border-neon px-1">DETAILS</span>
                    </h3>

                    <p className="font-serif text-gray-600 dark:text-gray-300 mb-6">
                        Detailed analytics and project associations for {activeSkill} would be displayed here. 
                        This node is a critical part of the system architecture.
                    </p>

                     <div className="space-y-3">
                          <h4 className="text-xs font-mono font-bold text-gray-500 uppercase">相关项目</h4>
                          {relatedProjects.length > 0 ? (
                              relatedProjects.map((project, index) => (
                                  <Link
                                      key={project.id}
                                      to={`/projects/${project.id}`}
                                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-neon hover:shadow-md transition-all group/item"
                                  >
                                      <div className="flex items-center gap-3">
                                          <span className="text-sm font-bold text-ink dark:text-white group-hover/item:text-neon transition-colors line-clamp-1">
                                              {project.name}
                                          </span>
                                          <span className="text-xs font-mono text-gray-400">({project.type})</span>
                                      </div>
                                      <ExternalLink size={14} className="text-gray-400 group-hover/item:text-neon" />
                                  </Link>
                              ))
                          ) : (
                              <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 border-dashed rounded-lg">
                                  <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                                      📁 暂无相关项目
                                  </span>
                      </div>
                          )}
                     </div>
                 </div>
             </div>
         )}
     </div>
  );
};

export default PageSkills;