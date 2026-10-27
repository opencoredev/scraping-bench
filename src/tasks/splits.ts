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
  const pageSplits = new Map<string, 'dev' | 'test'>();
  for (const task of tasks.filter(task => task.track === 'search')) {
    const recipe = recipes[task.id];
    if (recipe?.kind === 'page') pageSplits.set(recipe.url, splits[task.id] ?? 'test');
  }
  for (const task of tasks) {
    const recipe = recipes[task.id];
    if (recipe?.kind === 'page' && recipe.track === 'scrape') {
      const paired = pageSplits.get(recipe.url); if (paired) splits[task.id] = paired;
    }
  }
  const scopes = tasks.filter(task => recipes[task.id]?.kind === 'site' && task.track === 'map')
    .sort((a, b) => a.input.track === 'map' && b.input.track === 'map' ? a.input.site.length - b.input.site.length : 0);
  for (const parent of scopes) for (const task of tasks) {
    const a = recipes[parent.id], b = recipes[task.id];
    if (a?.kind === 'site' && b?.kind === 'site' && b.scope.startsWith(a.scope)) splits[task.id] = splits[parent.id] ?? 'test';
  }
  // Documentation headings inside a map/crawl scope reveal the crawl answer.
  // The scope split owns every page answer within it, across both page tracks.
  for (const task of tasks) {
    const recipe = recipes[task.id];
    if (recipe?.kind !== 'page') continue;
    const parent = tasks.find(other => {
      const scope = recipes[other.id];
      return scope?.kind === 'site' && scope.track === 'map' && recipe.url.startsWith(scope.scope);
    });
    if (parent) splits[task.id] = splits[parent.id] ?? 'test';
  }
  const registryReleases: Readonly<Record<string, string>> = {
    'jqlang/jq': 'jq', 'BurntSushi/ripgrep': 'ripgrep', 'sharkdp/fd': 'fd',
    'sharkdp/bat': 'bat', 'junegunn/fzf': 'fzf', 'neovim/neovim': 'neovim',
  };
  for (const task of tasks) {
    const recipe = recipes[task.id];
    if (recipe?.kind !== 'release') continue;
    const name = registryReleases[recipe.repo];
    if (!name) continue;
    const paired = splits[recipeId({ kind: 'registry', ecosystem: 'homebrew', name })];
    if (paired) splits[task.id] = paired;
  }
  return splits;
}
