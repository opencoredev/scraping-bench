// USD list prices checked 2026-10-17. Free grants are balances, not zero list prices.
// Credit conversions use the smallest paid plan / explicit PAYG; not a volume discount.
export const pricing = {
  you: { search: 0.005, scrape: 0.001, source: 'https://you.com/docs/administration/billing', checkedAt: '2026-10-19' },
  firecrawl: { credit: 0.005, scrape: 1, search: 2, map: 1, source: 'https://www.firecrawl.dev/pricing' },
  contextdev: { credit: 0.0022, source: 'https://www.context.dev/pricing' },
  tinyfish: { fetch: 0, search: 0, source: 'https://docs.tinyfish.ai/api-reference/wallet/get-wallet', note: 'Account contract rates frozen from GET /v1/wallet on 2026-10-17: Fetch $0/url, Search $0/query. Recheck the wallet contract before another account or date; daily grants are 1,000 Fetch URLs and 12,000 Search requests.' },
  exa: { search: 0.007, scrape: 0.001, source: 'https://exa.ai/docs/reference/pricing' },
  tavily: { credit: 0.008, source: 'https://docs.tavily.com/documentation/api-credits' },
  parallel: { search: 0.005, scrape: 0.001, additionalResult: 0.001, source: 'https://docs.parallel.ai/resources/pricing' },
  jina: { token: 0.00000005, searchTokens: 10000, source: 'https://jina.ai/reader/', catalogSource: 'https://dash.jina.ai/api/v1/product', note: '$50/1B tokens current Reader UI product price_1RLbwHEoTOtb5eZvZP7kjljR; product catalog includes legacy rates. Reader keyless has no billed account.' },
  spider: { credit: 0.0001, source: 'https://spider.cloud/pricing', note: 'Variable bandwidth/compute; measure reported credits, never assume a flat page price.' },
  linkup: { search: 0.005, scrape: 0.001, renderedScrape: 0.005, source: 'https://docs.linkup.so/pages/documentation/platform/pricing' },
  perplexity: { search: 0.005, source: 'https://docs.perplexity.ai/getting-started/pricing' },
  brightdata: { scrape: 0.0015, search: 0.0015, source: 'https://brightdata.com/pricing/web-unlocker', searchSource: 'https://brightdata.com/pricing/serp' },
  scrapfly: { credit: 0.00015, source: 'https://scrapfly.io/pricing' },
  string: { request_standard: 0.0003, request_premium: 0.003, browser_standard: 0.0015, browser_premium: 0.006, search: 0.0015, source: 'https://portal.usestring.ai/docs/get-started/pricing', checkedAt: '2026-10-24', note: 'Starter plan USD per request, by the x-billed-request-type String returns. The account ran on free credits, which the usage page prices at Starter rates.' },
  browserbase: { scrape: 0.004, search: 0.005, source: 'https://docs.browserbase.com/account/billing/plans', searchSource: 'https://docs.browserbase.com/platform/search/overview' },
} satisfies Record<string, object>;
export const pricingCheckedAt = '2026-10-17';
