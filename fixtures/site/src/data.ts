/** Shared deterministic catalog. No runtime or Cloudflare dependencies. */
export const categories = ['sensors', 'controllers', 'gateways', 'accessories'];
export const sections = ['guides/getting-started', 'guides/deployment', 'guides/migration', 'api/devices', 'api/events'];
export const platforms = ['macOS', 'Linux', 'Windows'];
export function parseSeed(seed: string): string {
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(seed)) throw new Error('Seed must contain 1–64 letters, digits, underscores or hyphens');
  return seed;
}
export function freshnessVersion(now = Date.now()): number { return Math.floor(now / 600_000); }
export function generateSite(seed: string) {
  parseSeed(seed);
  let state = 2166136261;
  for (const char of seed) state = Math.imul(state ^ char.charCodeAt(0), 16777619) >>> 0;
  const number = (index: number) => (Math.imul(state ^ index, 1664525) + 1013904223) >>> 0;
  const products = Array.from({ length: 60 }, (_, i) => {
    const category = categories[i % categories.length] ?? 'sensors';
    return { path: `/store/${category}/instrument-${i + 1}`, category, name: `Northstar ${category.slice(0, -1)} ${i + 1}`, price: `${(20 + number(i) % 480)}.${String(number(i + 100) % 100).padStart(2, '0')} USD`, stock: i % 4 === 0 ? 'Out of stock' : 'In stock', sku: `NS-${number(i + 200).toString(16).toUpperCase()}`, specs: { weight: `${100 + number(i + 300) % 900} g`, accuracy: `${1 + number(i + 400) % 9} ppm`, voltage: `${5 + number(i + 500) % 20} V` }, review: `${4 + number(i + 600) % 10 / 10}/5` };
  });
  const docs = Array.from({ length: 50 }, (_, i) => {
    const section = sections[i % sections.length] ?? 'guides/getting-started';
    const version = `3.${number(i + 700) % 20}.${number(i + 800) % 10}`;
    return { path: `/docs/${section}/topic-${i + 1}`, section, title: `Device ${section.split('/')[1]}: workflow ${i + 1}`, version, commands: platforms.map(platform => ({ platform, command: platform === 'Windows' ? `winget install Northstar.Tools --version ${version}` : platform === 'macOS' ? `brew install northstar/tools/ns@${version}` : `pip install northstar-tools==${version}` })), migration: [`Export configuration with ns export --format v${i + 1}`, `Run ns migrate --target ${version}`, 'Restart the device service'] };
  });
  const posts = Array.from({ length: 60 }, (_, i) => ({ path: `/blog/${2025 + i % 2}/field-notes-${i + 1}`, title: `Field notes ${i + 1}: ${['Reliable telemetry', 'Remote deployments', 'Calibration practice'][number(i + 1300) % 3]}`, date: `${2025 + i % 2}-${String(1 + number(i + 1400) % 12).padStart(2, '0')}-${String(1 + number(i + 1500) % 27).padStart(2, '0')}`, author: ['Mira Chen', 'Jonas Reed', 'Amara Okafor'][number(i + 1600) % 3] ?? 'Mira Chen', tags: [categories[(i + number(1700)) % 4] ?? 'sensors', 'engineering'] }));
  const tiers = ['Starter', 'Team', 'Enterprise'].map((name, i) => ({ name, price: `${(i + 1) * 29 + number(900 + i) % 20} USD/month`, devices: (i + 1) * 100 }));
  const special = { js: `Calibration-${number(1000)}`, lazy: `Reserve-${number(1001)}`, iframe: `Permit-${number(1002)}`, shadow: `Serial-${number(1003)}`, tabs: `Recovery-${number(1004)}`, long: `Archive-${number(1005)}`, nonEnglish: `Estación-${number(1006)}`, cookie: `Dispatch-${number(1007)}` };
  const report = Array.from({ length: 12 }, (_, i) => ({ page: i + 1, revenue: 100_000 + number(1100 + i) % 900_000 }));
  const orphans = Array.from({ length: 6 }, (_, i) => ({ path: `/archive/bulletin-${i + 1}`, title: `Service bulletin ${i + 1}`, code: `Notice-${number(1200 + i)}` }));
  return { seed, products, docs, posts, tiers, special, report, orphans };
}
export type SiteData = ReturnType<typeof generateSite>;
export function sitePaths(data: SiteData): string[] {
  return ['/', '/store', ...categories.flatMap(c => [1, 2, 3].map(p => `/store/category/${c}?page=${p}`)), '/docs', ...sections.map(s => `/docs/${s}`), '/blog', ...Array.from({ length: 6 }, (_, i) => `/blog?page=${i + 1}`), '/pricing', '/resources', ...data.products.map(p => p.path), ...data.docs.map(d => d.path), ...data.posts.map(p => p.path), ...Object.keys(data.special).map(s => `/resources/${s}`), '/resources/freshness', '/resources/report.pdf', '/resources/redirect/1', '/resources/soft-404', ...data.orphans.map(o => o.path)];
}
