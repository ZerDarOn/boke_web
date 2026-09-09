import { normalizeExternalUrl } from './externalUrl';

export const boundedLevel = (value: number): number => Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
export const rankLabel = (rank: string): string => ({ MASTER: '专家', EXPERT: '高级', ADEPT: '中级', NOVICE: '初级' }[rank?.toUpperCase()] || rank || '未设置');

export function skillLink(value?: string): string | null {
  const link = value?.trim();
  if (!link || link.startsWith('//') || link.includes('\\')) return null;
  return link.startsWith('/') ? link : normalizeExternalUrl(link);
}

/** Grow rings with the data; never assume the preview's fixed 65 nodes. */
export function radialLayout(count: number) {
  const nodes: Array<{ x: number; y: number }> = [];
  let remaining = count;
  let ring = 0;
  let radius = 165;
  while (remaining > 0) {
    const capacity = 10 + ring * 8;
    const onRing = Math.min(remaining, capacity);
    radius = 165 + ring * 95;
    for (let index = 0; index < onRing; index++) {
      const angle = index / onRing * Math.PI * 2 - Math.PI / 2 + ring * .12;
      nodes.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
    }
    remaining -= onRing;
    ring++;
  }
  const size = 2 * (radius + 70);
  return { size, nodes: nodes.map(node => ({ x: node.x + size / 2, y: node.y + size / 2 })) };
}
