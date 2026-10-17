# Linkup

Slug: `linkup`
Sources: https://docs.linkup.so/ (home page, fetched 2026-10-16), plus the endpoint pages, pricing page, and for-agents page listed per section.

## 1. Auth

Header: `Authorization: Bearer <LINKUP_API_KEY>`. Base URL: `https://api.linkup.so/v1`. No project or zone IDs required. Source: https://docs.linkup.so/pages/documentation/endpoints/search/overview (Fetch uses the same header and adds `Content-Type: application/json`, per https://docs.linkup.so/pages/documentation/endpoints/fetch/overview).

## 2. Search

Endpoint: `GET https://api.linkup.so/v1/search`. Source: https://docs.linkup.so/pages/documentation/endpoints/search/overview

Params:
- `q` (query string, natural language). The docs' curl example sends it as `q`.
- `depth`: `flash`, `fast`, `standard`, or `deep`.
- `outputType`: `searchResults`, `sourcedAnswer`, or `structured`.
- `structuredOutputSchema`: JSON schema, required when `outputType` is `structured`.
- `includeDomains` / `excludeDomains`: lists of domains, up to 100 each.
- `fromDate` / `toDate`: ISO 8601 dates.
- `maxResults`: number of sources (type not stated on the page).
- `includeImages`: boolean (type not stated on the page).
- Country: not found. Language: not found.

Response fields:
- `sourcedAnswer`: `answer` (string), `sources` (array of `name`, `url`, `snippet`).
- `searchResults`: `results` (array of `type`, `name`, `url`, `content`).
- `structured`: JSON matching `structuredOutputSchema`. Wrapper fields: not found.

Sync or async: synchronous ("Linkup's synchronous web search endpoint").

## 3. Scrape (fetch)

Endpoint: `POST https://api.linkup.so/v1/fetch`. Source: https://docs.linkup.so/pages/documentation/endpoints/fetch/overview

Params (JSON body):
- `url` (string, required): HTTP/HTTPS page. HTML and PDF supported. Other binaries (ZIP, image, video) return 400.
- `mode`: `"standard"` (default) or `"pro"`.
- `renderJs` (boolean, default `false`): render JavaScript before extraction.
- `includeRawHtml` (boolean, default `false`).
- `extractImages` (boolean, default `false`).
- `schema` (object, optional): JSON Schema with root `type: "object"`.
- `instructions` (string, optional, max 4,000 characters): requires `schema`.
- Wait/timeout, output format selection (markdown/text/html), cache/freshness, PDF-specific params: not found.

Response fields:
- `markdown`: always returned.
- `rawHtml`: only when `includeRawHtml` is true.
- `images`: only when `extractImages` is true; array of `alt` and `url`.
- `data`: only when `schema` is provided; object matching the schema.

Sync or async: not explicitly stated. Examples show a single request returning the result, so treated as synchronous.

## 4. Map

not found. The Linkup home page and the for-agents page (https://docs.linkup.so/pages/documentation/get-started/for-agents) list the endpoints as Search, Fetch, Research, Extract, and Tasks. No map endpoint appears.

## 5. Crawl

not found. Same pages as Map. No crawl endpoint appears.

## 6. Pricing and free tier

Source: https://www.linkup.so/pricing (fetched 2026-10-16)

- Fetch: $0.001 to $0.006 per request (Standard and Pro modes). The page gives a range, not a price per mode.
- Search: $0.005 to $0.006 per request (Fast, Standard, and Deep depths). Same caveat.
- Free tier: 4,000 queries free ("Run 4,000 queries for free").
- Startup program: $5,000 in free credits for approved startups. This is an application program, not the free tier.
- Free-tier rate limits or concurrency: not found.

## 7. npm SDK package

not found. The for-agents page links to a Python SDK page (https://docs.linkup.so/pages/sdk/python/python) and does not name an npm package or install command. The JavaScript SDK page was not checked. The home page points to https://github.com/LinkupPlatform/linkup-for-agents, which was not fetched.

## 8. Fairness gotchas

not found. The pages read so far say nothing about caching, internal retries, or whether results come from a live fetch or a prebuilt index.

## Endpoints listed on home page (https://docs.linkup.so/)

- Search: https://docs.linkup.so/pages/documentation/endpoints/search/overview
- Fetch: https://docs.linkup.so/pages/documentation/endpoints/fetch/overview
- Research: https://docs.linkup.so/pages/documentation/endpoints/research/overview (not read)
- Tasks: https://docs.linkup.so/pages/documentation/endpoints/tasks/overview (not read)
- Extract (closed beta, access by request): https://docs.linkup.so/pages/documentation/endpoints/extract/overview (not read)

## Curl examples

Built from the parameter names and routes documented above. These are not copied verbatim from the docs. Confirm against the API reference before relying on them.

Search:

```
curl -X GET "https://api.linkup.so/v1/search?q=latest+python+release&depth=standard&outputType=sourcedAnswer" \
  -H "Authorization: Bearer $LINKUP_API_KEY"
```

Fetch:

```
curl -X POST "https://api.linkup.so/v1/fetch" \
  -H "Authorization: Bearer $LINKUP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "mode": "standard"}'
```
