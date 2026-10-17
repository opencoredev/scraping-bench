import type { Task } from '../core/types.ts';
import { freshnessVersion } from '../../fixtures/site/src/data.ts';

/** Plain-fetch origin integrity check, not an extractor score. Never counts a JS miss as extracted evidence. */
export async function checkFixtureTasks(tasks: readonly Task[]): Promise<void> {
  let checked = 0;
  let browserRequired = 0;
  const missing: string[] = [];
  for (const task of tasks) {
    if (task.input.track !== 'scrape') continue;
    const response = await fetch(task.input.url,{signal:AbortSignal.timeout(30_000)});
    if (!response.ok) { missing.push(`${task.id}: HTTP ${response.status}`); continue; }
    const body = await response.text();
    const pdfPage = task.family === 'pdf-number' ? Number(/Read page (\d+)/.exec(task.instruction)?.[1]) : null;
    const evidence = pdfPage === null ? body : [...body.matchAll(/stream\n([\s\S]*?)\nendstream/g)][pdfPage - 1]?.[1] ?? '';
    if (pdfPage !== null && !evidence.includes(`Page ${pdfPage}`)) missing.push(`${task.id}: PDF page witness failed`);
    const visible = evidence.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replaceAll('&#39;',"'").replaceAll('&quot;','"').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&').replace(/\s+/g,' ');
    if (['js-rendered-field','lazy-loaded-field','shadow-dom-field','iframe-field'].includes(task.family)) {
      const field = task.expected[0];
      if (field.kind !== 'text') throw new Error('Interactive field must be text');
      if (visible.includes(field.accept[0])) missing.push(`${task.id}: interactive answer leaked into initial HTML`);
      const kind = task.family === 'js-rendered-field' ? 'js' : task.family === 'lazy-loaded-field' ? 'lazy' : task.family === 'shadow-dom-field' ? 'shadow' : 'iframe';
      const source = new URL(task.input.url); source.pathname = source.pathname.replace(/\/resources\/[^/]+$/,`/content/${kind}`);
      const loaded = await fetch(source,{signal:AbortSignal.timeout(30_000)});
      if (!loaded.ok || !(await loaded.text()).includes(field.accept[0])) missing.push(`${task.id}: interactive content endpoint missing answer`);
      browserRequired++;
      process.stdout.write(`BROWSER REQUIRED ${task.family}: plain fetch correctly misses the field; content endpoint checked\n`);
      continue;
    }
    for (const field of task.expected) {
      let values: readonly string[];
      switch (field.kind) {
        case 'none': {
          // Independent semantic witnesses for the deliberately absent fields.
          const absent = task.family === 'soft-404' ? visible.includes('This item is no longer available') && !/\b\d+[.,]\d{2} USD\b/.test(visible) : visible.includes('Specifications') && !/\bfax\b/i.test(visible);
          if (!absent) missing.push(`${task.id}: absence witness failed`);
          continue;
        }
        case 'text': values = [field.accept[0]]; break;
        case 'number': values = [String(field.value)]; break;
        case 'date': case 'version': values = [field.value]; break;
        case 'text-set': values = field.items.flatMap(item=>item.split(' | ')); break;
        case 'url-set': values = field.urls; break;
        default: { const exhaustive: never = field; throw new Error(String(exhaustive)); }
      }
      if (task.family === 'freshness-version' && field.kind === 'number' && field.value !== freshnessVersion()) throw new Error('Freshness snapshot expired across a ten-minute boundary. Regenerate tasks and rerun.');
      for (const value of values) if (!visible.includes(value)) missing.push(`${task.id}: ${field.name} missing ${value}`);
    }
    checked++;
  }
  if (missing.length) throw new Error(missing.join('\n'));
  process.stdout.write(`PASS: ${checked} plain-fetch scrape checks; ${browserRequired} explicit browser-required pages.\n`);
}
