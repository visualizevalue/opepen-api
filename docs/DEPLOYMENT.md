# Production deployment

Opepen runs on Hetzner server `122996717` (`5.78.66.101`) using Kamal 2.11.
The API serves `api.opepen.art` and `metadata.opepen.art`; the frontend is in
`visualizevalue/opepen-app` and deploys independently.

## Deploy

Use the Ruby version in `.ruby-version`, Docker, SSH access as root, and the
ignored `.env.production` file. Install the locked gems with `bundle install`.
`./scripts/deploy` loads the production environment and runs the locked Kamal.
From a shell with mise, `mise exec ruby@4.0.6 -- ./scripts/deploy ...` also works.

```sh
./scripts/deploy deploy
./scripts/deploy app details
./scripts/deploy app logs --roles=web
./scripts/deploy app logs --roles=cron
```

The single web container runs database migrations with its freshly uploaded
runtime environment before starting the HTTP server. Migration failures stop
deployment. Keep one web container while using this migration strategy. Take a database backup
before changes that need a data rollback; rolling back an image does not roll
back its database schema.

The image installs Chromium, FFmpeg and Python for artwork rendering and reveals.
Puppeteer is a production dependency. The cron role runs the nine schedules from
`config/crontab` in UTC. Each job uses a shared host lock to prevent overlap across
releases. `/run/opepen-cron-env.json` contains its private runtime environment and
is readable only by root inside that container.

## Data and credentials

- PostgreSQL 15: accessory `opepen-api-db`, database/user `opepen`, data under
  `/root/opepen-api-db/data`. Its host port is bound only to `127.0.0.1:5436`.
  App containers connect over the private Docker network to `opepen-api-db:5432`.
- `/var/lib/opepen-api/tmp`: temporary uploads and rendering files.
- `/var/lib/opepen-api/reveal-data` and `reveal-results`: reveal inputs and outputs.
- `/var/lib/opepen-api/cron-locks`: locks shared across application releases.
- Production images and uploads remain in the existing DigitalOcean Spaces bucket.
- `.env.production`, `.local/` and `.kamal` runtime environment files contain
  credentials. Keep local files private and never commit or print their contents.
  Preserve `APP_KEY` across migrations so existing cookie sessions remain valid.

The server runs `/usr/local/sbin/opepen-db-backup` nightly at 03:37 UTC and retains
14 days of database dumps in `/var/backups/opepen-api` (mode 0700). These are local
server backups. The script is maintained at `scripts/backup-db`. Check the backup
log at `/var/log/opepen-db-backup.log`.

## 2026-10-21 migration and DNS cutover

The source was Hetzner server `44713170`, IP `5.161.113.81`, managed by Cleavr. Its API and frontend
were at the same application revisions as the local repositories. The production
database and reveal files were copied to Kamal; a rehearsal restore was checked
before the final transfer. The final cutover stopped the old jobs and processes,
transferred a fresh database snapshot, and forwarded old Nginx traffic to Kamal over
verified HTTPS during DNS propagation. See the
[migration receipt](MIGRATION-2026-10-21.md) for the completed handover and checks.

The A records for `opepen.art`, `api.opepen.art` and `metadata.opepen.art` now point
to `5.78.66.101`. `www` is a CNAME to `opepen.art`; no AAAA records are present.

Kamal uses `ssl: true`. Existing unexpired certificates were securely seeded into
the proxy's ACME cache. Kamal renews them automatically. No static certificate
configuration or manual TLS switch is required. To verify direct traffic:

```sh
curl --resolve api.opepen.art:443:5.78.66.101 https://api.opepen.art/
curl --resolve metadata.opepen.art:443:5.78.66.101 https://metadata.opepen.art/1/metadata.json
```

The old Hetzner server and primary IPs were permanently deleted after DNS and
public checks passed with it powered off. Its Cleavr server, sites and deployment
workflows were removed too. There is no forwarding bridge or old host to restart.

The restore-tested full production backup is retained at
`/var/backups/opepen-api/manual-20261021T181702Z/` and locally at
`.local/backups/manual-20261021T181702Z/`. The old machine's databases and
source/configuration archive is `/var/backups/opepen-api/retired-cleavr-20261021.tar.gz`.
These manual archives are outside the nightly retention pattern. See the receipt
for validation and checksums. Private verification logs remain in `.local/migration`.

Use Kamal image rollback for application-only problems. Infrastructure recovery
requires provisioning a replacement host and restoring the current database and
reveal files; the archived old database is a historical snapshot.
