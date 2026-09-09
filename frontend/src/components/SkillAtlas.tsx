import React, { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { BrainCircuit, ChevronLeft, ChevronRight, Code2, Layers3, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Skill, SkillGroup } from '../lib/api';
import { useSkillGroups } from '../hooks/queries/skills';
import { useProjectsList } from '../hooks/queries/projects';
import { boundedLevel, radialLayout, rankLabel, skillLink } from '../lib/skillAtlas';
import { PageLoader } from './DataState';
import './SkillAtlas.css';

type AtlasView = { kind: 'trunk' | 'panorama' | 'list' } | { kind: 'branch'; category: string };
interface SkillTileProps { skill: Skill; onSelect: (skill: Skill) => void; compact?: boolean }

function SkillTile({ skill, onSelect, compact = false }: SkillTileProps) {
  const image = skillLink(skill.image);
  return <button id={'atlas-skill-' + skill.id} type="button" className={'skill-atlas-tile' + (compact ? ' is-compact' : '')} onClick={() => onSelect(skill)} aria-label={'查看 ' + skill.name + ' 详情'}>
    <span className="skill-atlas-tile-top">{image ? <img src={image} alt="" loading="lazy" onError={event => { event.currentTarget.style.display = 'none'; }} /> : <Code2 size={20} aria-hidden="true" />}<strong>{skill.name}</strong></span>
    <span className="skill-atlas-tile-meta">{rankLabel(skill.rank)}{!compact && <span>{skill.projectCount ?? 0} 个项目</span>}</span>
    <progress max={100} value={boundedLevel(skill.level)} aria-label={skill.name + ' 熟练度'} />
  </button>;
}

interface AtlasGraphProps { groups: SkillGroup[]; view: AtlasView; onView: (view: AtlasView) => void; onSelect: (skill: Skill) => void }
function AtlasGraph({ groups, view, onView, onSelect }: AtlasGraphProps) {
  const [focused, setFocused] = useState<string | null>(null);
  const branch = view.kind === 'branch' ? groups.find(group => group.category === view.category) : undefined;
  const entries = (branch ? [branch] : groups).flatMap(group => group.skills.map(skill => ({ skill, tone: groups.findIndex(item => item.category === group.category) % 5 })));
  const layout = radialLayout(entries.length);
  const center = layout.size / 2;
  return <div className="skill-atlas-graph-scroll" tabIndex={0} role="region" aria-label="技能脑图，可横向滚动">
    <svg className="skill-atlas-graph" viewBox={'0 0 ' + layout.size + ' ' + layout.size}>
      {entries.map(({ skill, tone }, index) => <g key={skill.id} className={'skill-atlas-tone-' + tone + (focused && focused !== skill.category ? ' is-muted' : '')}>
        <path d={'M ' + center + ' ' + center + ' L ' + layout.nodes[index].x + ' ' + layout.nodes[index].y} />
        <foreignObject x={layout.nodes[index].x - 52} y={layout.nodes[index].y - 32} width={104} height={64} onPointerEnter={() => setFocused(skill.category)} onPointerLeave={() => setFocused(null)} onFocus={() => setFocused(skill.category)} onBlur={() => setFocused(null)}><SkillTile compact skill={skill} onSelect={onSelect} /></foreignObject>
      </g>)}
      <foreignObject x={center - 65} y={center - 65} width={130} height={130}><button type="button" className="skill-atlas-core" onClick={() => onView({ kind: 'trunk' })} aria-label="知识大脑：收回主干"><BrainCircuit size={30} /><strong>{branch?.category || '知识大脑'}</strong><small>{entries.length} 个技能 · 收回主干</small></button></foreignObject>
    </svg>
  </div>;
}

function AtlasTrunk({ groups, onView }: Pick<AtlasGraphProps, 'groups' | 'onView'>) {
  const height = Math.max(520, Math.ceil(groups.length / 2) * 160 + 120);
  const total = groups.reduce((sum, group) => sum + group.skills.length, 0);
  return <div className="skill-atlas-graph-scroll" tabIndex={0} role="region" aria-label="技能主干脑图，可横向滚动"><svg className="skill-atlas-trunk" viewBox={'0 0 800 ' + height}>
    {groups.map((group, index) => {
      const x = index % 2 ? 540 : 265;
      const y = 35 + Math.floor(index / 2) * 180 + (index % 2 ? 85 : 0);
      return <g key={group.category} className={'skill-atlas-tone-' + index % 5}><path d={'M 170 ' + height / 2 + ' H 240 C 310 ' + height / 2 + ' 235 ' + (y + 48) + ' ' + x + ' ' + (y + 48)} /><foreignObject x={x} y={y} width={230} height={98}><button type="button" className="skill-atlas-category" onClick={() => onView({ kind: 'branch', category: group.category })} aria-label={'展开 ' + group.category}><span><Layers3 size={22} /><strong>{group.category}</strong><b>{Math.round(group.skills.length / total * 100)}%</b></span><small>{group.skills.length} 个技能 · {group.skills.slice(0, 3).map(skill => skill.name).join(' · ')}</small><i>探索分支 <ChevronRight size={12} /></i></button></foreignObject></g>;
    })}
    <foreignObject x={45} y={height / 2 - 65} width={130} height={130}><button type="button" className="skill-atlas-core" aria-label="知识大脑：展开全景" onClick={() => onView({ kind: 'panorama' })}><BrainCircuit size={30} /><strong>知识大脑</strong><small>{total} 个技能 · 展开全景</small></button></foreignObject>
  </svg></div>;
}

interface SkillDetailsProps { skill: Skill; onClose: () => void }
function SkillDetails({ skill, onClose }: SkillDetailsProps) {
  const { data: projects = [], isLoading, error, refetch } = useProjectsList({ limit: 500 });
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ block: 'nearest', behavior: 'auto' }); }, [skill.id]);
  const related = projects.filter(project => project.tech.some(tech => tech.toLowerCase().includes(skill.name.toLowerCase()) || skill.name.toLowerCase().includes(tech.toLowerCase()))).slice(0, 4);
  const link = skill.buttonEnabled ? skillLink(skill.buttonLink) : null;
  return <section className="skill-atlas-details" aria-label="技能详情"><button className="skill-atlas-close" type="button" aria-label="关闭技能详情" onClick={onClose}><X size={18} /></button><small>{skill.category} / 技能详情</small><h2 tabIndex={-1} ref={heading}>{skill.name}</h2><p>{rankLabel(skill.rank)} · 熟练度 {boundedLevel(skill.level)}% · {skill.projectCount ?? 0} 个项目</p>{link && <a href={link} target={link.startsWith('/') ? undefined : '_blank'} rel="noopener noreferrer">{skill.buttonLabel || '了解更多'} <ChevronRight size={13} /></a>}<h3>关联项目</h3>{isLoading ? <p role="status">正在加载项目…</p> : error ? <p role="alert">项目暂时无法加载。<button onClick={() => refetch()} type="button">重试</button></p> : related.length ? related.map(project => <Link key={project.id} to={'/projects/' + (project.slug || project.id)}>{project.name}<ChevronRight size={15} /></Link>) : <p>暂未找到关联项目。</p>}</section>;
}

export default function SkillAtlas() {
  const { data: groups = [], isLoading, error, refetch } = useSkillGroups();
  const [view, setView] = useState<AtlasView>({ kind: 'trunk' });
  const [selected, setSelected] = useState<Skill | null>(null);
  const transition = useRef<{ skipTransition: () => void } | null>(null);
  const skills = useMemo(() => groups.flatMap(group => group.skills), [groups]);
  const activeSkill = selected ? skills.find(skill => skill.id === selected.id) : undefined;
  const visibleView: AtlasView = view.kind === 'branch' && !groups.some(group => group.category === view.category) ? { kind: 'trunk' } : view;
  const handleView = (next: AtlasView) => {
    transition.current?.skipTransition();
    const update = () => { setView(next); setSelected(null); };
    if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const nextTransition = document.startViewTransition(() => flushSync(update));
      transition.current = nextTransition;
      void nextTransition.ready.catch(() => {});
    } else update();
  };
  useEffect(() => () => transition.current?.skipTransition(), []);
  return <section className="skill-atlas"><header className="skill-atlas-heading"><div><h1>技能展示</h1><p>我的技术技能与创作工具，仍在慢慢生长。</p></div><div>{visibleView.kind !== 'trunk' && <button type="button" onClick={() => handleView({ kind: 'trunk' })}><ChevronLeft size={15} />返回主干</button>}<button type="button" disabled={!skills.length} onClick={() => handleView({ kind: visibleView.kind === 'list' ? 'trunk' : 'list' })}><Sparkles size={15} />{visibleView.kind === 'list' ? '返回脑图' : '全部展开'}</button></div></header>
    {isLoading ? <PageLoader /> : error ? <div className="skill-atlas-state" role="alert"><p>技能暂时无法加载。</p><button type="button" onClick={() => refetch()}>重新加载</button></div> : !skills.length ? <div className="skill-atlas-state"><BrainCircuit size={38} /><p>技能正在整理中，稍后再来看看。</p></div> : <><nav className="skill-atlas-breadcrumb" aria-label="技能层级"><button type="button" onClick={() => handleView({ kind: 'trunk' })}>知识大脑 / 主干</button>{visibleView.kind !== 'trunk' && <span> / {visibleView.kind === 'branch' ? visibleView.category : visibleView.kind === 'list' ? '全部技能' : '全景脑图'}</span>}</nav><div className="skill-atlas-stage">
      {visibleView.kind === 'trunk' ? <AtlasTrunk groups={groups} onView={handleView} /> : visibleView.kind === 'list' ? <div className="skill-atlas-list">{groups.map((group, index) => <section className={'skill-atlas-group skill-atlas-tone-' + index % 5} key={group.category}><h2><Layers3 size={18} />{group.category}<b>{group.skills.length}</b></h2><div>{group.skills.map(skill => <SkillTile key={skill.id} skill={skill} onSelect={setSelected} />)}</div></section>)}</div> : <AtlasGraph key={visibleView.kind === 'branch' ? visibleView.category : 'panorama'} groups={groups} view={visibleView} onView={handleView} onSelect={setSelected} />}
    </div>{activeSkill && <SkillDetails skill={activeSkill} onClose={() => { setSelected(null); document.getElementById('atlas-skill-' + activeSkill.id)?.focus({ preventScroll: true }); }} />}</>}
  </section>;
}
