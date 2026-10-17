import type { Task } from '../core/types.ts';
import type { Recipe } from './schema.ts';
import { digest } from './io.ts';
import { recipeId } from './resolve.ts';

// Repositories whose releases can expose the same answers as registry-version tasks.
const releasePackages: Readonly<Record<string, { ecosystem: 'npm' | 'pypi' | 'crates'; name: string }>> = {
  'astral-sh/uv': { ecosystem: 'pypi', name: 'uv' },
  'astral-sh/ruff': { ecosystem: 'pypi', name: 'ruff' },
  'pydantic/pydantic': { ecosystem: 'pypi', name: 'pydantic' },
  'fastapi/fastapi': { ecosystem: 'pypi', name: 'fastapi' },
  'encode/httpx': { ecosystem: 'pypi', name: 'httpx' },
  'encode/starlette': { ecosystem: 'pypi', name: 'starlette' },
  'astral-sh/ty': { ecosystem: 'pypi', name: 'ty' },
  'pallets/flask': { ecosystem: 'pypi', name: 'flask' },
  'pallets/click': { ecosystem: 'pypi', name: 'click' },
  'pallets/werkzeug': { ecosystem: 'pypi', name: 'werkzeug' },
  'duckdb/duckdb': { ecosystem: 'pypi', name: 'duckdb' },
  'pola-rs/polars': { ecosystem: 'pypi', name: 'polars' },
  'microsoft/playwright': { ecosystem: 'npm', name: 'playwright' },
  'vitejs/vite': { ecosystem: 'npm', name: 'vite' },
  'vitest-dev/vitest': { ecosystem: 'npm', name: 'vitest' },
  'sveltejs/svelte': { ecosystem: 'npm', name: 'svelte' },
  'vercel/next.js': { ecosystem: 'npm', name: 'next' },
};
export function buildSplits(tasks: readonly Task[], recipes: Readonly<Record<string, Recipe>>): Record<string, 'dev' | 'test'> {
  const splits: Record<string, 'dev' | 'test'> = {};
  const groups = new Map<string, Task[]>();
  for (const task of tasks) {
    const key = `${task.track}/${task.family}`;
    const group = groups.get(key) ?? []; group.push(task); groups.set(key, group);
  }
  for (const group of groups.values()) {
    group.sort((a, b) => digest(a.id.replace(/^(search|scrape|map|crawl)-/, '')).localeCompare(digest(b.id.replace(/^(search|scrape|map|crawl)-/, ''))));
    for (const [i, task] of group.entries()) splits[task.id] = i < Math.round(group.length * 0.3) ? 'dev' : 'test';
  }
  for (const task of tasks) {
    if (task.track === 'scrape') {
      const pair = `search-${task.id.slice('scrape-'.length)}`;
      const pairedSplit = splits[pair]; if (pairedSplit) splits[task.id] = pairedSplit;
    }
    if (task.track === 'crawl') {
      const pair = `map-${task.id.slice('crawl-'.length)}`;
      const pairedSplit = splits[pair]; if (pairedSplit) splits[task.id] = pairedSplit;
    }
  }
  for (const task of tasks) {
    const recipe = recipes[task.id];
    if (recipe?.kind !== 'release') continue;
    const pkg = releasePackages[recipe.repo];
    if (!pkg) continue;
    const search = splits[recipeId({ kind: 'package', ...pkg, track: 'search' })];
    const scrape = splits[recipeId({ kind: 'package', ...pkg, track: 'scrape' })];
    if (search ?? scrape) splits[task.id] = search ?? scrape ?? 'test';
  }
  return splits;
}
