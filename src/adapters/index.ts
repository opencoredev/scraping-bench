import type { Adapter, ProviderId } from '../core/types.ts';
import { contextdev } from './contextdev.ts';
import { firecrawl } from './firecrawl.ts';
import { tinyfish } from './tinyfish.ts';
import { exa } from './exa.ts';
import { tavily } from './tavily.ts';
import { parallel } from './parallel.ts';
import { jina } from './jina.ts';
import { spider } from './spider.ts';
import { linkup } from './linkup.ts';
import { perplexity } from './perplexity.ts';
import { brightdata } from './brightdata.ts';
import { scrapfly } from './scrapfly.ts';
import { browserbase } from './browserbase.ts';
export const adapters: Readonly<Record<ProviderId, Adapter>> = { contextdev, firecrawl, tinyfish, exa, tavily, parallel, jina, spider, linkup, perplexity, brightdata, scrapfly, browserbase };
export const registry = adapters;
export const providerIds = Object.keys(adapters);
export const requiredEnv: Readonly<Record<ProviderId, readonly string[]>> = {
  contextdev: ['CONTEXT_DEV_API_KEY'], firecrawl: ['FIRECRAWL_API_KEY'], tinyfish: ['TINYFISH_API_KEY'],
  exa: ['EXA_API_KEY'], tavily: ['TAVILY_API_KEY'], parallel: ['PARALLEL_API_KEY'], jina: [], spider: ['SPIDER_API_KEY'],
  linkup: ['LINKUP_API_KEY'], perplexity: ['PERPLEXITY_API_KEY'], brightdata: ['BRIGHTDATA_API_KEY'],
  scrapfly: ['SCRAPFLY_API_KEY'], browserbase: ['BROWSERBASE_API_KEY'],
};
export function missingEnv(provider: ProviderId): readonly string[] { return requiredEnv[provider].filter(name => !process.env[name]?.trim()); }
