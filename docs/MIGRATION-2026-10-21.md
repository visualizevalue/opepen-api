# Cleavr to Kamal migration — 21 October 2026

The migration and retirement are complete. `opepen.art`, `api.opepen.art`, and
`metadata.opepen.art` resolve directly to `5.78.66.101`; `www` remains a CNAME to
the apex. Authoritative DNS, Cloudflare and Google resolvers agreed, with no AAAA
records. Old Hetzner server `44713170` (`5.161.113.81`) and its primary IPv4/IPv6
were permanently deleted after explicit user confirmation. The Cleavr Opepen
server entry, both sites and both deployment workflows were removed; their
inventories now contain only the unrelated Punkism resources.

## Releases

| Service | Revision | Role |
| --- | --- | --- |
| `opepen-api` | `a0b1b09366c97fff22182e1ed846572c4b98a58c` | web and cron |
| `opepen-app` | `1b41ef148bd6e5b21663093f0356be05edd37daa` | web |
| `opepen-api-db` | `postgres:15-alpine` | PostgreSQL accessory |

The source revisions were API `21b610e` and frontend `ea48d6e`. Application
changes cover deployment packaging, moving Puppeteer to production dependencies,
removing Chromium's incompatible single-process launch flags, correcting media
preview data URLs, and preserving
the `www` canonical redirect.

## Data and handover

- A rehearsal database restore succeeded before production writes were paused.
- The final PostgreSQL snapshot was transferred directly between servers and
  restored without ownership/ACL inheritance. All 30 public table row counts
  matched the frozen source, independently of locale sorting.
- Reveal inputs and outputs were transferred into persistent host directories.
  The existing DigitalOcean Spaces bucket and production credentials were retained.
- All eight source PM2 instances are stopped, and that state is saved. The nine
  source Opepen cron entries were removed while preserving other crontab entries.
  Both Cleavr workflows had code-push/tag deployments disabled when inspected.
- The new cron role ran sync, staging, reveal-schedule and reveal-execute jobs.
  Sync completed against the current chain head; no reveals were pending.
- The restricted, source-IP-limited transfer SSH authorization and temporary
  private key were removed after transfer. Temporary local TLS key copies were
  removed after securely seeding Kamal's ACME certificate cache.
- The first backup completed at `2026-10-21T17:44:29Z`. Nightly local backups run
  at 03:37 UTC with 14-day retention.

During propagation, the old API Nginx entry was a regular file in `sites-enabled`,
so both its active and available configuration were updated. Forwarding disabled
the old frontend cache, verified certificate chains to depth 3, and disabled
upstream TLS session reuse so the different hostnames had separate TLS sessions. Both applications
forwarded to `https://5.78.66.101` with their original Host/SNI values. This
temporary bridge no longer exists.

## Backups and retirement

- The full production backup at `2026-10-21T18:17:02Z` includes `opepen.dump`,
  global roles, archive contents, manifests and checksums. It was restored into a
  disposable database: 30 public tables, 16,000 tokens and 122 migrations passed.
  Copies remain at `/var/backups/opepen-api/manual-20261021T181702Z/` on Kamal and
  `.local/backups/manual-20261021T181702Z/` locally, with private permissions.
- Before shutdown, all three old databases (`opepen`, `opepen_staging`,
  `testing_opepen`), their global roles, source/configuration, Nginx, PM2 and root
  cron state were archived to
  `/var/backups/opepen-api/retired-cleavr-20261021.tar.gz` on Kamal (445,461,707
  bytes, mode 0600). Extracted files are retained alongside it. Every inner
  checksum and PostgreSQL archive listing passed. Archive SHA-256:
  `ed518700737e536059f4679dc46942a2aeadf0377a7555d67048072bc54219c7`.
- The old machine was powered off first. Public frontend, API, submissions and
  metadata still returned HTTP 200 directly from Kamal. Only then was it deleted.
- Cleavr's provider delete failed because its VPS token was invalid. After the
  provider deletion succeeded in Hetzner, Cleavr's Forget Server action removed
  the server and associated sites/workflows without changing provider access.

## Verification

Passed against the new IP using normal hostname and certificate verification:

- Frontend collection and set detail routes; the `www` redirect preserves path/query.
- API root, stats, sets, token, submissions, featured images and artist endpoints.
- Token 1 metadata matched the source response exactly.
- Nonce cookie flags (`Secure`, `HttpOnly`, `SameSite=None`) and credentialed CORS.
- Engine.IO polling and WebSocket TLS upgrade.
- Chromium screenshot in the production container, production RPC read, and a
  Python reveal smoke with synthetic input: 80 unique tokens, correct edition sizes.
- Production SMTP TCP connectivity on port 587; no email was sent.
- Real SVG and MP4 render endpoints returned PNG artwork at 960×960. Generated
  images were visually inspected after correcting the Chromium flags and data URL.
  The revealed-token 151 OpenGraph endpoint returned a PNG too.

After fixing the bridge, 12 interleaved public frontend/API/metadata probes all
passed. Public WebSocket upgrades passed through the old server. Chrome rendered
the collection and a full set detail view with artwork loading from Spaces.
Checks API, Checks website and vv.xyz also returned HTTP 200 after deployment.

After permanent deletion, seven public probes (root, collection, set detail,
API root, stats, submissions and token metadata) all returned HTTP 200 from
`5.78.66.101` with valid TLS. The exact deployed frontend, web, cron and database
containers remained running. Checks and screenshots are retained privately in
`.local/migration/`, including `post-deletion-checks.json`, `hetzner-retired.png`
and `cleavr-retired.png`.

No wallet message was signed, notification email sent, or real reveal triggered
as a test. Real wallet authentication, submissions, notifications and reveals
remain normal production operations rather than synthetic test actions.

The OpenGraph endpoint for unrevealed token 1 still encounters the existing
missing-set assumption in `OpepenRenderer`; its metadata endpoint passes. That
application behavior predates this deployment and was not changed by the migration.

See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment, backups, data paths and rollback.
Private snapshots, manifests, logs and original configurations remain under
`.local/migration` locally and in the retained backup directories on Kamal.
