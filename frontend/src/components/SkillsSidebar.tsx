import { BrainCircuit, Layers3 } from 'lucide-react';
import { useSkillGroups } from '../hooks/queries/skills';
import { rankLabel } from '../lib/skillAtlas';
import './SkillAtlas.css';

export default function SkillsSidebar() {
  const { data: groups = [], isLoading, error } = useSkillGroups();
  const skills = groups.flatMap(group => group.skills);
  const ranks = skills.reduce<Record<string, number>>((result, skill) => { const label = rankLabel(skill.rank); result[label] = (result[label] || 0) + 1; return result; }, {});
  return <aside className="skill-atlas-sidebar" aria-label="技能概览"><section><BrainCircuit size={23} /><h2>持续生长的技能</h2>{isLoading ? <p>正在加载…</p> : error ? <p>技能统计暂不可用</p> : <div className="skill-atlas-totals"><strong>{skills.length}<small>技能节点</small></strong><strong>{groups.length}<small>探索领域</small></strong></div>}</section>{!isLoading && !error && <><section><h2>按领域</h2>{groups.map((group, index) => <div className={'skill-atlas-summary-category skill-atlas-tone-' + index % 5} key={group.category}><Layers3 size={16} /><span>{group.category}</span><b>{group.skills.length}</b></div>)}</section><section><h2>熟练度分布</h2>{Object.entries(ranks).map(([label, count]) => <div className="skill-atlas-rank" key={label}><span>{label}<b>{count}</b></span><progress value={count} max={Math.max(1, skills.length)} aria-label={label + '技能数量'} /></div>)}</section></>}</aside>;
}
