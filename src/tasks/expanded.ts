import { z } from 'zod';
import { parse, type DefaultTreeAdapterTypes } from 'parse5';
import type { Task } from '../core/types.ts';
import type { Recipe } from './schema.ts';
import { allowed, get, getJson, title } from './io.ts';
import { recipeId } from './resolve.ts';

function nodeText(node: DefaultTreeAdapterTypes.Node): string {
  if ('tagName' in node) {
    const attribute = (name: string) => node.attrs.find(attr => attr.name === name)?.value ?? '';
    const classes = attribute('class').split(/\s+/);
    const permalink = classes.some(name => /^(?:headerlink|header-anchor|anchor|anchor-link|permalink|hash-link)$/.test(name))
      || /perma(?:nent)?\s*link|(?:direct )?link to (?:this )?(?:heading|section)/i.test(`${attribute('aria-label')} ${attribute('title')}`);
    if (permalink || (node.tagName === 'a' && attribute('href').startsWith('#') && /^[\s¶#§🔗\p{Co}\p{Cf}]*$/u.test(node.childNodes.map(nodeText).join('')))) return '';
  }
  if ('value' in node) return node.value;
  return 'childNodes' in node ? node.childNodes.map(nodeText).join('') : '';
}
export function firstHeading(html: string): string {
  function visit(node: DefaultTreeAdapterTypes.Node): string | undefined {
    if ('tagName' in node && node.tagName === 'h1') return nodeText(node).replace(/[\p{Co}\p{Cf}]/gu, '').replace(/\s+/g, ' ').trim();
    if ('childNodes' in node) for (const child of node.childNodes) { const found = visit(child); if (found) return found; }
    return undefined;
  }
  const heading = visit(parse(html));
  if (!heading || heading.length > 250) throw new Error('No unambiguous bounded H1');
  return heading;
}
export async function resolveExpanded(recipe: Extract<Recipe, { kind: 'page' | 'registry' }>): Promise<Task> {
  if (recipe.kind === 'page') {
    await allowed(recipe.url);
    const response = await get(recipe.url, false);
    if (response.status !== 200) throw new Error('Missing documentation page');
    const heading = firstHeading(response.body);
    const pageTitle = title(response.body);
    const input: Task['input'] = recipe.track === 'scrape' ? { track: 'scrape', url: recipe.url } : { track: 'search', query: `${recipe.url} ${pageTitle} first main heading` };
    return { id: recipeId(recipe), track: recipe.track, family: 'docs-heading', site: new URL(recipe.url).hostname, input,
      instruction: `Read the documentation at ${recipe.url}. Return JSON with string field "heading", the first level-one heading on that page. Omit the heading's permalink marker.`,
      expected: [{ kind: 'text', name: 'heading', accept: [heading] }], source: { kind: 'authoritative', source: `${recipe.url} HTML h1; document-title=${pageTitle}`, checkedAt: response.checkedAt } };
  }
  const encoded = encodeURIComponent(recipe.name);
  let url: string;
  let version: string;
  let checkedAt: string;
  switch (recipe.ecosystem) {
    case 'rubygems': {
      url = `https://rubygems.org/api/v1/gems/${encoded}.json`; const r = await getJson(url); checkedAt = r.checkedAt;
      version = z.object({ version: z.string() }).parse(r.data).version; break;
    }
    case 'go': {
      url = `https://proxy.golang.org/${recipe.name}/@latest`; const r = await getJson(url); checkedAt = r.checkedAt;
      version = z.object({ Version: z.string() }).parse(r.data).Version.replace(/^v/, ''); break;
    }
    case 'hex': {
      url = `https://hex.pm/api/packages/${encoded}`; const r = await getJson(url); checkedAt = r.checkedAt;
      version = z.object({ latest_stable_version: z.string() }).parse(r.data).latest_stable_version; break;
    }
    case 'pub': {
      url = `https://pub.dev/api/packages/${encoded}`; const r = await getJson(url); checkedAt = r.checkedAt;
      version = z.object({ latest: z.object({ version: z.string() }) }).parse(r.data).latest.version; break;
    }
    case 'homebrew': {
      url = `https://formulae.brew.sh/api/formula/${encoded}.json`; const r = await getJson(url); checkedAt = r.checkedAt;
      version = z.object({ versions: z.object({ stable: z.string() }) }).parse(r.data).versions.stable; break;
    }
    case 'nuget': {
      url = `https://api.nuget.org/v3-flatcontainer/${encoded.toLowerCase()}/index.json`; const r = await getJson(url); checkedAt = r.checkedAt;
      const versions = z.object({ versions: z.array(z.string()) }).parse(r.data).versions.filter(v => /^\d+(\.\d+)+$/.test(v));
      const latest = versions.at(-1); if (!latest) throw new Error('No stable release'); version = latest; break;
    }
    case 'packagist': {
      url = `https://repo.packagist.org/p2/${recipe.name}.json`; const r = await getJson(url); checkedAt = r.checkedAt;
      const packages = z.object({ packages: z.record(z.string(), z.array(z.object({ version: z.string() }))) }).parse(r.data).packages;
      const latest = packages[recipe.name]?.find(p => /^v?\d+(\.\d+)+$/.test(p.version)); if (!latest) throw new Error('No stable release'); version = latest.version.replace(/^v/, ''); break;
    }
    case 'metacpan': {
      url = `https://fastapi.metacpan.org/v1/release/${encoded}`; const r = await getJson(url); checkedAt = r.checkedAt;
      version = z.object({ version: z.string() }).parse(r.data).version; break;
    }
    default: { const exhaustive: never = recipe.ecosystem; throw new Error(String(exhaustive)); }
  }
  if (!/^\d+(\.\d+)+$/.test(version)) throw new Error(`Non-numeric stable release ${version}`);
  return { id: recipeId(recipe), track: 'search', family: 'registry-version', site: new URL(url).hostname,
    input: { track: 'search', query: `${recipe.name} ${recipe.ecosystem} latest stable version` },
    instruction: `Find the latest stable release of ${recipe.name} in ${recipe.ecosystem}. Return JSON with string field "version", without a leading v. Exclude prereleases.`,
    expected: [{ kind: 'version', name: 'version', value: version }], source: { kind: 'authoritative', source: url, checkedAt } };
}
