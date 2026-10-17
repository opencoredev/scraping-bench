import { z } from 'zod';
import { parse, type DefaultTreeAdapterTypes } from 'parse5';
import type { Task, ExpectedField } from '../core/types.ts';
import type { Recipe } from './schema.ts';
import { allowed, get, getJson, title, unescape } from './io.ts';

const pypiSchema = z.object({ info: z.object({ version: z.string(), name: z.string() }) });
const crateSchema = z.object({ crate: z.object({ max_stable_version: z.string().nullable() }) });
const fact = z.object({ start: z.string().optional(), end: z.string(), val: z.number(), accn: z.string(), fp: z.string().nullable(), form: z.string().nullable(), filed: z.string() });
const secSchema = z.object({ cik: z.number(), entityName: z.string(), facts: z.object({ 'us-gaap': z.record(z.string(), z.unknown()) }) });
const revenueConcept = z.object({ units: z.object({ USD: z.array(fact).optional() }) });
const releaseSchema = z.object({ tag_name: z.string(), published_at: z.string().datetime(), prerelease: z.boolean(), draft: z.boolean(), html_url: z.string().url() });
const binding = z.object({ value: z.string() });
export const entityResults = z.object({ results: z.object({ bindings: z.array(z.object({ item: binding.optional(), itemLabel: binding.optional(), founded: binding })) }) });
export const sparqlUrl = (query: string): string => `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;
const slug = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export function recipeId(recipe: Recipe): string {
  switch (recipe.kind) {
    case 'package': return `${recipe.track}-${recipe.ecosystem}-${slug(recipe.name)}`;
    case 'finance': return `search-revenue-${recipe.cik}`;
    case 'entity': return `search-founding-${recipe.qid}`;
    case 'release': return `search-fresh-${slug(recipe.repo)}`;
    case 'none': return `search-none-${slug(recipe.name)}`;
    case 'site': return `${recipe.track}-${slug(new URL(recipe.scope).host + new URL(recipe.scope).pathname)}`;
    default: { const exhaustive: never = recipe; return exhaustive; }
  }
}
function make(recipe: Recipe, family: string, input: Task['input'], instruction: string, expected: Task['expected'], source: string, checkedAt: string): Task {
  const sourceUrl = source.split(' ')[0];
  if (!sourceUrl) throw new Error('Missing source URL');
  return { id: recipeId(recipe), track: input.track, family, instruction, input, expected, site: new URL(input.track === 'scrape' ? input.url : input.track === 'map' || input.track === 'crawl' ? input.site : sourceUrl).hostname, source: { kind: 'authoritative', source, checkedAt } };
}
export async function resolve(recipe: Recipe): Promise<Task> {
  switch (recipe.kind) {
    case 'package': {
      const url = recipe.ecosystem === 'npm' ? `https://registry.npmjs.org/${encodeURIComponent(recipe.name)}/latest` : recipe.ecosystem === 'pypi' ? `https://pypi.org/pypi/${recipe.name}/json` : `https://crates.io/api/v1/crates/${recipe.name}`;
      const response = await getJson(url);
      let version: string;
      if (recipe.ecosystem === 'npm') {
        // /latest returns a package-version document, not the full registry packument.
        version = z.object({ version: z.string() }).parse(response.data).version;
      } else if (recipe.ecosystem === 'pypi') version = pypiSchema.parse(response.data).info.version;
      else { const stable = crateSchema.parse(response.data).crate.max_stable_version; if (!stable) throw new Error('No stable version'); version = stable; }
      if (!/^\d+(\.\d+)+(?:\.post\d+)?$/.test(version)) throw new Error(`Not a stable numeric version: ${version}`);
      const page = recipe.ecosystem === 'npm' ? `https://www.npmjs.com/package/${recipe.name}` : recipe.ecosystem === 'pypi' ? `https://pypi.org/project/${recipe.name}/` : `https://crates.io/crates/${recipe.name}`;
      const expected: [ExpectedField, ...ExpectedField[]] = [{ kind: 'version', name: 'version', value: version }];
      const request = `Find the latest stable release of the ${recipe.ecosystem} package ${recipe.name}. Return JSON with the string field "version".`;
      if (recipe.track === 'search') {
        const command = recipe.ecosystem === 'npm' ? `npm install ${recipe.name}` : recipe.ecosystem === 'pypi' ? `pip install ${recipe.name}` : `cargo add ${recipe.name}`;
        expected.push({ kind: 'text', name: 'installCommand', accept: recipe.ecosystem === 'pypi' ? [command, `python -m pip install ${recipe.name}`, `python3 -m pip install ${recipe.name}`] : recipe.ecosystem === 'npm' ? [command, `npm i ${recipe.name}`] : [command] });
        return make(recipe, 'latest-version', { track: 'search', query: `${recipe.name} ${recipe.ecosystem} latest stable version install` }, `${request} Also return "installCommand", the unpinned ${recipe.ecosystem === 'crates' ? 'cargo add' : recipe.ecosystem === 'npm' ? 'npm install' : 'pip install'} command for this package, without extra flags.`, expected, url, response.checkedAt);
      }
      await allowed(page);
      const html = await get(page, false);
      const heading = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html.body)?.[1];
      const headingText = heading ? unescape(heading.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim() : '';
      if (html.status !== 200 || !headingText.endsWith(` ${version}`)) throw new Error(`Project page does not expose latest version ${version} in its heading: ${page}`);
      return make(recipe, 'package-version', { track: 'scrape', url: page }, `Read this project page. Return JSON with the latest stable release as string field "version".`, expected, url, response.checkedAt);
    }
    case 'finance': {
      const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${recipe.cik}.json`;
      const response = await getJson(url);
      const companyFacts = secSchema.parse(response.data);
      if (companyFacts.cik !== Number(recipe.cik)) throw new Error('SEC CIK identity mismatch');
      const brand = (recipe.company === 'IBM' ? 'International Business Machines' : recipe.company.split(' ')[0])?.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!brand || !companyFacts.entityName.toLowerCase().replace(/[^a-z0-9]/g, '').includes(brand)) throw new Error(`SEC issuer name mismatch: ${recipe.company} / ${companyFacts.entityName}`);
      const facts = companyFacts.facts['us-gaap'];
      const tags = ['Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax', 'SalesRevenueNet', 'RevenueFromContractWithCustomerIncludingAssessedTax'];
      const candidates = tags.flatMap((tag, priority) => (facts[tag] ? revenueConcept.parse(facts[tag]).units.USD ?? [] : []).filter(row => {
        const days = row.start ? (Date.parse(row.end) - Date.parse(row.start)) / 86400000 : 0;
        return row.form === '10-K' && row.fp === 'FY' && days >= 330 && days <= 380;
      }).map(row => ({ ...row, tag, priority })));
      candidates.sort((a, b) => b.end.localeCompare(a.end) || a.priority - b.priority || b.filed.localeCompare(a.filed));
      const row = candidates[0];
      if (!row) throw new Error(`No annual revenue for ${recipe.company}`);
      // Multiple concepts can report segments. Reject conflicting totals rather than guess.
      const samePeriod = candidates.filter(other => other.end === row.end && other.filed === row.filed);
      if (samePeriod.some(other => other.val !== row.val)) throw new Error(`Conflicting annual revenue concepts: ${recipe.company}`);
      const query = `${recipe.company} latest reported fiscal year total revenue annual 10-K`;
      return make(recipe, 'company-financials', { track: 'search', query }, `Find ${recipe.company}'s latest reported full fiscal-year revenue in its SEC 10-K. Return JSON fields "revenueUSD" as a number in US dollars and "fiscalYearEnd" as YYYY-MM-DD. Use consolidated revenue, not quarterly revenue.`, [{ kind: 'number', name: 'revenueUSD', value: row.val, tolerance: Math.abs(row.val) * 0.01 }, { kind: 'date', name: 'fiscalYearEnd', value: row.end }], `${url} issuer=${companyFacts.entityName}; XBRL us-gaap:${row.tag}; period ${row.start}/${row.end}; accession ${row.accn}; filed ${row.filed}`, response.checkedAt);
    }
    case 'entity': {
      const query = `SELECT (MIN(?date) AS ?founded) WHERE { wd:${recipe.qid} p:P571 ?statement . ?statement ps:P571 ?date; wikibase:rank ?rank . FILTER(?rank != wikibase:DeprecatedRank) } HAVING(COUNT(DISTINCT ?date) = 1)`;
      const url = sparqlUrl(query);
      const response = await getJson(url);
      const rows = entityResults.parse(response.data).results.bindings;
      const date = rows[0]?.founded.value;
      if (rows.length !== 1 || !date || !/^\d{4}-/.test(date)) throw new Error(`Ambiguous founding date for ${recipe.qid}`);
      return make(recipe, 'entity-facts', { track: 'search', query: `${recipe.label} ${recipe.qid} founded inception year` }, `Find the founding year of ${recipe.label} (Wikidata ${recipe.qid}). Return JSON with numeric field "foundingYear". Use the organization's inception, not a predecessor's founding.`, [{ kind: 'number', name: 'foundingYear', value: Number(date.slice(0, 4)), tolerance: 0 }], `${url} QID=${recipe.qid}; property=P571; single non-deprecated date`, response.checkedAt);
    }
    case 'release': {
      const url = `https://api.github.com/repos/${recipe.repo}/releases/latest`;
      const response = await getJson(url);
      const release = releaseSchema.parse(response.data);
      const age = Date.parse(response.checkedAt) - Date.parse(release.published_at);
      if (release.draft || release.prerelease || age < 0 || age > 14 * 86400000) throw new Error(`No stable release in last 14 days: ${recipe.repo}`);
      return make(recipe, 'fresh', { track: 'search', query: `${recipe.repo} latest stable GitHub release tag publication date` }, `Find the latest stable GitHub release of ${recipe.repo}. Return JSON fields "tag" (exact release tag, including any v prefix) and "publishedDate" (UTC YYYY-MM-DD). Exclude prereleases.`, [{ kind: 'text', name: 'tag', accept: [release.tag_name] }, { kind: 'date', name: 'publishedDate', value: release.published_at.slice(0, 10) }], `${url} release-page=${release.html_url}; published_at=${release.published_at}; maximum-age=14-days`, response.checkedAt);
    }
    case 'none': {
      const url = `https://registry.npmjs.org/${encodeURIComponent(recipe.name)}`;
      const response = await getJson(url);
      if (response.status !== 200) throw new Error('The package itself must exist');
      const versions = z.object({ versions: z.record(z.string(), z.unknown()) }).parse(response.data).versions;
      if (recipe.version in versions) throw new Error('Negative control now exists');
      return make(recipe, 'not-found', { track: 'search', query: `${recipe.name} npm version ${recipe.version} release integrity checksum` }, `Find the published npm integrity checksum for ${recipe.name}@${recipe.version}. Return JSON with "integrity" as the checksum, or null if that version has never been published. Do not substitute another version.`, [{ kind: 'none', name: 'integrity' }], `${url} versions[${recipe.version}] absent (package exists)`, response.checkedAt);
    }
    case 'site': return resolveSite(recipe);
    default: { const exhaustive: never = recipe; return exhaustive; }
  }
}
const siteMemory = new Map<string, Promise<{ urls: string[]; records: string[]; checkedAt: string }>>();
function links(node: DefaultTreeAdapterTypes.Node): string[] {
  const hrefs: string[] = [];
  if ('tagName' in node && node.tagName === 'a') {
    const href = node.attrs.find(attr => attr.name === 'href')?.value;
    if (href) hrefs.push(href);
  }
  if ('childNodes' in node) for (const child of node.childNodes) hrefs.push(...links(child));
  return hrefs;
}
async function discover(recipe: Extract<Recipe, { kind: 'site' }>): Promise<{ urls: string[]; records: string[]; checkedAt: string }> {
  await allowed(recipe.sitemap);
  const response = await get(recipe.sitemap);
  if (!response.body.includes('<urlset')) throw new Error('Expected a URL sitemap, not an index');
  const urls = [...new Set([...response.body.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map(m => unescape(m[1] ?? '').trim()).filter(url => url.startsWith(recipe.scope)))].sort();
  if (urls.length < 3 || urls.length > 60 || !urls.includes(recipe.scope)) throw new Error(`Unsuitable scope (${urls.length} pages): ${recipe.scope}`);
  // Start at the scope root; the sitemap is NOT the crawl queue.
  const queue = [recipe.scope];
  const visited = new Set<string>();
  const attempted = new Set<string>();
  const records: string[] = [];
  while (queue.length > 0) {
    const url = queue.shift();
    if (!url || attempted.has(url)) continue;
    if (attempted.size >= 90) throw new Error('Crawl bound exceeded');
    await allowed(url);
    const page = await get(url, false);
    attempted.add(url);
    if (page.status === 404) continue;
    if (page.status !== 200) throw new Error(`Missing crawl page: ${url}`);
    const canonical = page.finalUrl ?? url;
    if (!canonical.startsWith(recipe.scope)) throw new Error(`Redirect left crawl scope: ${canonical}`);
    attempted.add(canonical);
    if (visited.has(canonical)) continue;
    visited.add(canonical);
    records.push(`${canonical} | ${title(page.body)}`);
    for (const href of links(parse(page.body))) {
      if (/[{}]/.test(href)) continue; // Unexpanded template examples are not published routes.
      const next = new URL(href, canonical);
      next.hash = ''; next.search = '';
      if (next.href.startsWith(recipe.scope) && !attempted.has(next.href) && !/\.[a-z0-9]+$/i.test(next.pathname)) queue.push(next.href);
    }
  }
  const discovered = [...visited].sort();
  if (JSON.stringify(discovered) !== JSON.stringify(urls)) throw new Error(`Sitemap/crawl disagreement: ${recipe.scope}; sitemap=${urls.length}, crawl=${discovered.length}; extra=${discovered.filter(u => !urls.includes(u)).join(',')}; missing=${urls.filter(u => !visited.has(u)).join(',')}`);
  return { urls, records: records.sort(), checkedAt: new Date().toISOString() };
}
async function resolveSite(recipe: Extract<Recipe, { kind: 'site' }>): Promise<Task> {
  let pending = siteMemory.get(recipe.scope);
  if (!pending) { pending = discover(recipe); siteMemory.set(recipe.scope, pending); }
  const { urls, records, checkedAt } = await pending;
  const source = `${recipe.sitemap} scope=${recipe.scope}; exact sitemap equality with independent breadth-first HTML-link crawl from scope root (404 links and unexpanded templates excluded); ${urls.length} pages; <=1-request/second/hostname; HTML titles checked on each page; thresholds allow at most 10% set error`;
  const field: ExpectedField = { kind: 'url-set', name: 'urls', urls, minRecall: 0.9, minPrecision: 0.9 };
  if (recipe.track === 'map') return make(recipe, 'docs-url-set', { track: 'map', site: recipe.scope, scope: new URL(recipe.scope).pathname }, 'Discover every canonical HTML documentation URL at or below this scope, including the scope root. Return JSON with "urls" as an array of absolute URLs. Exclude assets, query strings, fragments, translations outside the scope, and external links.', [field], source, checkedAt);
  return make(recipe, 'docs-page-records', { track: 'crawl', site: recipe.scope, scope: new URL(recipe.scope).pathname, maxPages: 60 }, 'Crawl every HTML documentation page at or below this scope, including the scope root. Return JSON fields "urls" (absolute canonical URL array) and "records" (array of strings formatted exactly "URL | HTML document title"). Use the <title> text with HTML entities decoded and whitespace collapsed. Exclude assets, query strings, fragments and external links.', [field, { kind: 'text-set', name: 'records', items: records }], source, checkedAt);
}
