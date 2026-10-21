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

The source was Cleavr server `44713170`, IP `5.161.113.81`. Its API and frontend
were at the same application revisions as the local repositories. The production
database and reveal files were copied to Kamal; a rehearsal restore was checked
before the final transfer. The final cutover stopped the old jobs and processes,
transferred a fresh database snapshot, and forwards old Nginx traffic to Kamal over
verified HTTPS. This keeps one writable database during DNS propagation. See the
[migration receipt](MIGRATION-2026-10-21.md) for the completed handover and checks.

Set the A records for `opepen.art`, `api.opepen.art` and `metadata.opepen.art` to
`5.78.66.101`. Keep `www` as a CNAME to `opepen.art`. No AAAA records were present
at migration time; do not leave any record pointing to the old server.

Kamal uses `ssl: true`. Existing unexpired certificates were securely seeded into
the proxy's ACME cache, so HTTPS works before DNS changes; Kamal will renew them
automatically once DNS points to this server. No static certificate configuration
or manual TLS switch is required. Verify direct traffic before retiring Cleavr:

```sh
curl --resolve api.opepen.art:443:5.78.66.101 https://api.opepen.art/
curl --resolve metadata.opepen.art:443:5.78.66.101 https://metadata.opepen.art/1/metadata.json
```

Private migration snapshots, original crontab/Nginx/PM2 state, and manifests are
in `/root/opepen-migration` on the relevant servers and `.local/migration` locally.
Keep the old server until DNS has propagated and public behavior is verified.
It remains a forwarding bridge, not an independent writable deployment.

Do not start the old API or restore the old Nginx configuration after cutover:
its database becomes stale as soon as the new deployment accepts writes. To
return traffic to Cleavr, first pause new writes/jobs and transfer the current
Kamal database and reveal files back, then restore the old processes/routing.
Use Kamal image rollback for application-only problems.
