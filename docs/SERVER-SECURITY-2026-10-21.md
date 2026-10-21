# Shared Kamal server security review — 21 October 2026

Host: Hetzner `122996717`, `5.78.66.101`, IPv6 `2a01:4ff:1f0:8244::1`.
The host runs Ubuntu 24.04 LTS and 34 production containers. This review covers
host access, network exposure, container isolation and runtime versions, the two
migrated databases, TLS, secret-file exposure and backup recovery. Application
code and dependency vulnerabilities require separate application reviews.

The host baseline has been hardened and live checks pass. Disruptive Docker,
database and kernel maintenance is prepared but has not yet been applied.

## Changes applied and verified

| Control | Verified state |
| --- | --- |
| Cloud firewall | `kamal-public-services`, ID `11858223`, applied only to this server |
| Public ingress | TCP 22, 80, 443 and 4001; UDP 4001; ICMP; IPv4 and IPv6 |
| Other ingress | Default deny at the provider and host; outbound traffic retained |
| SSH | Existing Ed25519 keys retained; root key login allowed; password and keyboard-interactive authentication disabled; X11 forwarding disabled |
| Host firewall | UFW active and enabled at boot, allowing the required public services |
| SSH abuse protection | Fail2ban `sshd` jail enabled, systemd backend, 8 failures per 10 minutes, one-hour bans |
| OS security packages | Ubuntu security updates installed, including Git, PyJWT, CA certificates and xz/liblzma; no Ubuntu security package upgrades remained afterward |
| Automatic updates | Daily package-list and unattended security upgrades enabled; automatic reboot remains disabled |
| Docker API | No public Docker daemon API, privileged containers, host PID/network containers, added capabilities or mounted Docker sockets found |
| Application ports | No application HTTP ports published directly; HTTP/S goes through Kamal Proxy |
| Databases and Redis | All published database/cache ports bind only to loopback; Punkism PostgreSQL has no published port |
| Migrated database auth | Network connections require SCRAM-SHA-256; both passwords are at least 24 characters |
| Secret files | Migrated runtime env files mode 0600; backup directories mode 0700 |
| Node runtimes | All 19 Node containers run the current security releases, 22.23.4 or 24.22.1 |
| TLS | TLS 1.0 and 1.1 rejected; TLS 1.2 and 1.3 accepted; hostname/certificate checks passed |
| HTTP file exposure | `.env`, `.git/config` and `.kamal/secrets` probes on the four migrated frontend/API hosts returned 403 or 404 |
| Service continuity | Seven representative frontend/API checks passed after hardening; baselines captured for all 22 proxy hostnames |

Port 4001 is intentionally public for the existing IPFS peer transport. The IPFS
management port 5001, PostgreSQL, Redis, local registry and Docker API ports are
filtered from the Internet over both IP families.

Docker-published ports bypass UFW's normal input path. The provider firewall is
therefore essential: a disposable Docker HTTP service was published on port
18081, verified locally, and confirmed unreachable externally over IPv4 and IPv6.
The test container was removed. No production data was exposed by the probe.

`scripts/harden-host` records the repeatable SSH/UFW/Fail2ban configuration. It
requires root, `--apply`, the expected host IP, UFW and Fail2ban. It creates a
five-minute SSH/UFW rollback timer, which must be cancelled only after a fresh
SSH connection and service checks pass. Both timers from this run were cancelled.
The original configuration backup is under
`/root/server-security-20261021T195752Z/`; a subsequent application backup is under
`/root/server-security-20261021T195850Z/`. These archives do not include SSH host
private keys.

## Maintenance prepared; approval required for downtime

| Component | Running | Prepared target |
| --- | --- | --- |
| Kernel | `6.8.0-106-generic`, 211 days uptime | Installed `6.8.0-147-generic`, requires reboot |
| Docker Engine | `29.3.0` | `29.9.2` from the configured official Docker repository |
| containerd | `2.2.1` | `2.4.2` from the same repository |
| Opepen PostgreSQL | `15.17` | Tested `postgres:15.19-alpine` |
| Punkism PostgreSQL | `17.9` | Tested `postgres:17.11-alpine` |

The Docker update and reboot affect all 34 production containers, including
Checks, vv.xyz, the self-checkout services and IPFS. Every running container has
`unless-stopped` restart policy, Docker is enabled at boot, and Ubuntu's SSH
socket is enabled. Existing stopped replacement containers must remain stopped.

Fresh Opepen and Punkism database dumps were copied off the server and their
SHA-256 checksums verified. Both full dumps were restored successfully in isolated
containers using the proposed PostgreSQL images: 30 public tables on 15.19 and
12 on 17.11. These test containers had no network access or published ports, and
their containers and volumes were removed afterward.

The proposed PostgreSQL updates retain their major versions and persistent data
paths. Only `plpgsql` and, for Opepen, `uuid-ossp` are installed; there are no
logical replication slots or `btree_gist`/`ltree` indexes requiring the additional
release-note steps. Database collation versions are unset on these Alpine
clusters. Keep the prior images available until the updates pass live checks.

Before a reboot, preserve the running-container and proxy manifests. Afterward,
verify the kernel, daemon versions, all previously running containers, database
versions and counts, the 22 hostname baselines, representative data endpoints,
Chromium rendering, cron progress, and firewall/SSH settings.

## Remaining application and recovery hardening

- Five other existing PostgreSQL containers are also behind the current minor
  release: `checks-indexer-db`, `selfcheckout-server-db`, `checks-api-db` and
  `vv-api-db` run 17.9; `vv-api-2023-db` runs 15.17. Plan their same-major patches
  with their service configuration and backups. These are separate from the two
  migrated database updates prepared above.
- Both migrated applications connect using the PostgreSQL initialization role,
  which is a database superuser. Introduce separate administration/backup and
  least-privileged application roles with tested migration permissions.
- Most existing application containers, including Opepen, use root/default
  users. Punkism's API and frontend already use the unprivileged `node` user.
  Move the remaining apps to unprivileged users with explicit writable paths.
- All applications share the `kamal` Docker network. Per-application private
  database networks would reduce lateral access after an application compromise.
- The new nightly database backups have 14-day local retention. Current manual
  copies are off-server, but automatic encrypted off-server backups, retention
  monitoring and regular restore drills are still needed. Hetzner VM backups
  were disabled when inspected; no paid backup service was enabled by this review.

## Evidence and references

Private evidence is under `.local/security-20261021/`: sanitized Docker inventory,
Node/database versions, public port scans, Docker canary results, TLS and file
exposure probes, service baselines, restore-test results and maintenance-backup
manifests. A full TCP sweep hit its five-minute timeout; the exposure assessment
uses the listener inventory, explicit provider rules, completed targeted scans
and live canary test rather than claiming a completed 65,535-port scan.

- [Docker firewall behavior](https://docs.docker.com/engine/network/packet-filtering-firewalls/)
- [Hetzner stateful firewall behavior](https://docs.hetzner.com/cloud/firewalls/faq/)
- [Ubuntu OpenSSH configuration](https://ubuntu.com/server/docs/how-to/security/openssh-server/)
- [Ubuntu automatic updates](https://ubuntu.com/server/docs/how-to/software/automatic-updates/)
- [Docker 29 security release notes](https://docs.docker.com/engine/release-notes/29/)
- [Current Node releases](https://nodejs.org/en/blog/release)
- [PostgreSQL version policy](https://www.postgresql.org/support/versioning/)
- [PostgreSQL 15.19 notes](https://www.postgresql.org/docs/15/release-15-19.html)
- [PostgreSQL 17.11 notes](https://www.postgresql.org/docs/17/release-17-11.html)
