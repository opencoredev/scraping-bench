import type { Task, Track } from '../core/types.ts';
import { random, shuffle } from '../run/limits.ts';
export const coreDesign = {
  search: { size: 30, clusters: 10, maxPerSite: 3 },
  scrape: { size: 40, clusters: 15, maxPerSite: 3 },
  map: { size: 15, clusters: 10, maxPerSite: 2 },
  crawl: { size: 12, clusters: 8, maxPerSite: 2 },
} satisfies Record<Track, { size: number; clusters: number; maxPerSite: number }>;
export function selectDiverse(tasks: readonly Task[], size: number, maxPerSite: number, seed = 19020): Task[] {
  const pool = shuffle([...tasks], random(seed));
  const families = [...new Set(pool.map(task => task.family))];
  const sites = new Map<string, number>();
  const counts = new Map<string, number>();
  const selected: Task[] = [];
  while (selected.length < size && pool.length) {
    const viable = pool.filter(task => (sites.get(task.site) ?? 0) < maxPerSite);
    if (!viable.length) break;
    // Registered family round-robin, then least-used sites, with seeded tie breaking.
    viable.sort((a, b) => (counts.get(a.family) ?? 0) - (counts.get(b.family) ?? 0) || (sites.get(a.site) ?? 0) - (sites.get(b.site) ?? 0) || families.indexOf(a.family) - families.indexOf(b.family));
    const chosen = viable[0]; if (!chosen) break;
    selected.push(chosen); pool.splice(pool.indexOf(chosen), 1);
    sites.set(chosen.site, (sites.get(chosen.site) ?? 0) + 1);
    counts.set(chosen.family, (counts.get(chosen.family) ?? 0) + 1);
  }
  return selected;
}
export function validateCore(tasks: readonly Task[], track: Track): void {
  const design = coreDesign[track];
  const sites = new Map<string, number>();
  for (const task of tasks) {
    if (task.track !== track || task.source.kind !== 'authoritative' && !(track === 'scrape' && task.source.kind === 'fixture' && task.family === 'js-rendered-field')) throw new Error('Core must use independently verified real-web tasks');
    sites.set(task.site, (sites.get(task.site) ?? 0) + 1);
  }
  if (tasks.filter(task => task.source.kind === 'fixture').length !== (track === 'scrape' ? 2 : 0)) throw new Error('Exact core JS allocation missing');
  if (tasks.length !== design.size || new Set(tasks.map(task => task.id)).size !== tasks.length || sites.size < design.clusters || [...sites.values()].some(n => n > design.maxPerSite)) throw new Error(`Core diversity/size failure for ${track}: ${tasks.length} tasks / ${sites.size} clusters`);
}
