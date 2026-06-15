# Pageview Worker

Optional first-party article read counting for Lens Frontier.

Article pages send a small pageview event when `PUBLIC_PAGEVIEW_ENDPOINT` is configured during the Astro build. The site displays total pageviews when the Worker read endpoint is available.

## Behavior

- Counts only article pages.
- Uses `articleId` such as `papers/swe-bench-verified`.
- Increments the displayed pageview count on every accepted pageview event, so browser refreshes count as new reads.
- Separately stores one anonymous visitor event per article per day for backend analysis.
- Stores a salted hash, not raw IP addresses.
- Receives only `siteId`, `articleId`, and page path from the site.
- Exposes `GET /views?articleId=<collection>/<slug>` for article read-count display.

Displayed pageviews are a lightweight public signal, not an audit-grade metric. If stronger abuse protection is needed, put Cloudflare WAF / rate limiting in front of the Worker. The deduplicated daily visitor events are better for trend analysis than the public counter.

## Deploy

```sh
cd workers/pageviews
cp wrangler.toml.example wrangler.toml
wrangler d1 create lens-frontier-pageviews
wrangler d1 execute lens-frontier-pageviews --file schema.sql
wrangler secret put VIEW_SALT
wrangler deploy
```

Set the production build variable:

```txt
PUBLIC_PAGEVIEW_ENDPOINT=https://<pageview-api-domain>/pageview
PUBLIC_PAGEVIEW_COUNT_ENDPOINT=https://<pageview-api-domain>/views
PUBLIC_PAGEVIEW_SITE_ID=lens-frontier
```

`PUBLIC_PAGEVIEW_COUNT_ENDPOINT` is optional when the read endpoint is the same Worker with `/views`; the site can derive it from `/pageview`.

Do not configure these variables for PR previews unless preview traffic should also be counted.

Use a Worker Custom Domain, Worker route, or stable Pages Functions endpoint for production. Avoid relying on `*.workers.dev` for the public site, because that default endpoint can be less reliable on some networks.

For a custom production domain, set `ALLOWED_ORIGIN` in the Worker environment.
