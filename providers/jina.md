# Jina AI

Sources: https://docs.jina.ai (fetched 2026-10-16), https://jina.ai/reader (fetched 2026-10-16)

## 1. Auth
- Source: https://docs.jina.ai
- Header: `Authorization: Bearer $JINA_API_KEY` (works for r.jina.ai and s.jina.ai)
- No project or zone IDs.

## 2. Search (s.jina.ai)
- Source: https://docs.jina.ai
- Endpoint: `POST https://s.jina.ai/`, parameters sent as a JSON body.
- Params: `q` (required), `gl` (two-letter country code), `location` (city-level origin), `hl` (two-letter language code), `num` (max results, may add latency), `page` (offset for pagination).
- Site restriction: header `X-Site: https://domain.com` (not a body param).
- Not found: `count`, `freshness`, depth modes, include-content flag.
- Response fields: not found in the docs page. Docs say only to "pay attention to the response format."
- Sync or async: not stated.

## 3. Scrape / Reader (r.jina.ai)
- Source: https://docs.jina.ai
- Endpoint: `https://r.jina.ai/<url>`
- Headers:
  - `X-Return-Format`: `markdown`, `html`, `text`, `screenshot`, `pageshot`
  - `X-Engine`: `browser`, `direct`, `cf-browser-rendering` (JS rendering choice)
  - `X-No-Cache: true` (cache bypass)
  - `X-Timeout` (seconds)
- PDF: not found.
- Response fields: `data.content`; also `data.links` and `data.images` when the links/images summary headers are set.

## 4. Map (site -> URL list)
- not found

## 5. Crawl
- not found

## 6. Pricing, credits, rate limits
- Source: https://jina.ai/reader (WebFetch summary, fetched 2026-10-16; dollar rates not on the page)
- Reader price: not found per 1M tokens or per request. Billing is by output tokens ("Count the number of tokens in the output response.").
- Search price: not found in dollars. Each request costs "a fixed number of tokens, starting from 10,000 tokens."
- Free credits: "Every new API key comes with 10M free tokens!"
- Reader rate limit (free key): 500 RPM. Without a key: 20 RPM.
- Search rate limit (free key): 100 RPM.
- Concurrency: not found for the free tier. The "around 4,000 requests" figure on the page refers to the service overall.
- Note: https://jina.ai/pricing returned HTTP 404 on fetch. Not used.

## 7. npm SDK
- not found in fetched pages

## 8. Fairness gotchas
- Not checked yet. Reader engine and cache behavior are set per request through headers.
- Search costs a minimum of about 10,000 tokens per request, so the free 10M token credit covers far fewer searches than Reader calls.

## Curl examples
```
# Scrape
curl "https://r.jina.ai/https://example.com" \
  -H "Authorization: Bearer $JINA_API_KEY" \
  -H "X-Return-Format: markdown"

# Search
curl -X POST "https://s.jina.ai/" \
  -H "Authorization: Bearer $JINA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"q": "web scraping APIs", "num": 5}'
```

Supported tracks: search, scrape (map and crawl not found in docs).
