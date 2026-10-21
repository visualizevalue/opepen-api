# Cleavr to Kamal migration — 21 October 2026

The production handover is complete. DNS is intentionally unchanged:
`opepen.art`, `api.opepen.art`, and `metadata.opepen.art` still resolve to
`5.161.113.81`; its Nginx forwards to Kamal on `5.78.66.101` using verified TLS.
Change those three A records to `5.78.66.101` and retain the existing `www` CNAME.
Keep the old server until DNS propagation and public checks are complete.
No server has been deleted.

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

The old API Nginx entry was a regular file in `sites-enabled`, so both its active
and available configuration were updated. Forwarding disables the old frontend
cache, verifies certificate chains to depth 3, and disables upstream TLS session
reuse so the different hostnames have separate TLS sessions. Both applications
forward to `https://5.78.66.101` with their original Host/SNI values.

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

No wallet message was signed, notification email sent, or real reveal triggered
as a test. Real wallet authentication, submissions, notifications and reveals
remain normal production operations rather than synthetic test actions.

The OpenGraph endpoint for unrevealed token 1 still encounters the existing
missing-set assumption in `OpepenRenderer`; its metadata endpoint passes. That
application behavior predates this deployment and was not changed by the migration.

See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment, backups, data paths and rollback.
Private snapshots, manifests, logs and original configurations remain under
`.local/migration` locally and `/root/opepen-migration` on the servers.
