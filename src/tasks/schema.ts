import { z } from 'zod';
import type { Task } from '../core/types.ts';

export const recipeSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('fixture'), seed: z.string(), id: z.string() }),
  z.object({ kind: z.literal('page'), url: z.string().url(), track: z.enum(['search', 'scrape']) }),
  z.object({ kind: z.literal('registry'), ecosystem: z.enum(['rubygems', 'go', 'hex', 'pub', 'packagist', 'nuget', 'homebrew', 'metacpan']), name: z.string() }),
  z.object({ kind: z.literal('package'), ecosystem: z.enum(['npm', 'pypi', 'crates']), name: z.string(), track: z.enum(['search', 'scrape']) }),
  z.object({ kind: z.literal('finance'), cik: z.string(), company: z.string() }),
  z.object({ kind: z.literal('entity'), qid: z.string().regex(/^Q\d+$/), label: z.string() }),
  z.object({ kind: z.literal('release'), repo: z.string() }),
  z.object({ kind: z.literal('none'), name: z.string(), version: z.string() }),
  z.object({ kind: z.literal('site'), sitemap: z.string().url(), scope: z.string().url(), track: z.enum(['map', 'crawl']) }),
]);
export type Recipe = z.infer<typeof recipeSchema>;
const named = { name: z.string() };
const field = z.discriminatedUnion('kind', [
  z.object({ ...named, kind: z.literal('text'), accept: z.tuple([z.string()], z.string()) }),
  z.object({ ...named, kind: z.literal('number'), value: z.number(), tolerance: z.number() }),
  z.object({ ...named, kind: z.literal('version'), value: z.string() }),
  z.object({ ...named, kind: z.literal('date'), value: z.string() }),
  z.object({ ...named, kind: z.literal('none') }),
  z.object({ ...named, kind: z.literal('text-set'), items: z.array(z.string()) }),
  z.object({ ...named, kind: z.literal('url-set'), urls: z.array(z.string()), minRecall: z.number(), minPrecision: z.number() }),
]);
export const taskSchema: z.ZodType<Task> = z.object({
  id: z.string(), track: z.enum(['search', 'scrape', 'map', 'crawl']), family: z.string(), instruction: z.string(), site: z.string(),
  input: z.discriminatedUnion('track', [
    z.object({ track: z.literal('search'), query: z.string() }), z.object({ track: z.literal('scrape'), url: z.string().url() }),
    z.object({ track: z.literal('map'), site: z.string(), scope: z.string() }),
    z.object({ track: z.literal('crawl'), site: z.string(), scope: z.string(), maxPages: z.number() }),
  ]),
  expected: z.tuple([field], field),
  source: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('authoritative'), source: z.string(), checkedAt: z.string().datetime() }),
    z.object({ kind: z.literal('fixture'), page: z.string() }),
    z.object({ kind: z.literal('dataset'), dataset: z.string(), itemId: z.string() }),
  ]),
});
export const provenanceSchema = z.object({ formatVersion: z.literal(1), recipes: z.record(z.string(), recipeSchema) });
