# Deployment guide — FITX Gym Sahiwal

This guide takes the app from a fresh Ubuntu/Debian VPS to a live, TLS-secured
site with daily backups. It is written for a single small server
(Node + MySQL + Nginx + PM2); a managed MySQL or a platform like Vercel can be
substituted, but the commands below assume a plain VPS.

> **Assumptions.** Ubuntu 22.04/24.04, a domain pointed at the server, and sudo
> access. Commands use `fitx` as both the Linux user and the database name —
> rename consistently if you prefer. The app reads configuration only from
> environment variables (validated by `src/lib/env.ts`), so no code changes are
> needed between environments.

---

## 0. What gets deployed

| Piece | Where it runs | Notes |
| --- | --- | --- |
| Next.js app | Node, under PM2, bound to `127.0.0.1:3000` | `npm run build && npm start` |
| MySQL 8 | Same server (or managed) | Prisma migrations + seed |
| Uploaded media | Local disk (`uploads/`, `UPLOAD_DIR`) | **Must be backed up**; not in git |
| Nginx | Same server | TLS termination + reverse proxy |
| Daily backups | cron + `deploy/backup.sh` | MySQL dump + `uploads/` tarball |

---

## 1. Server prerequisites

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx mysql-server

# Node 22 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

sudo npm install -g pm2
node -v && npm -v && nginx -v && mysql --version
```

Create a non-root user to own the app:

```bash
sudo adduser --disabled-password --gecos "" fitx
sudo usermod -aG www-data fitx
sudo mkdir -p /var/www/fitx && sudo chown -R fitx:fitx /var/www/fitx
```

---

## 2. Database

```bash
sudo mysql <<'SQL'
CREATE DATABASE fitx CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fitx'@'localhost' IDENTIFIED BY 'REPLACE_WITH_A_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON fitx.* TO 'fitx'@'localhost';
FLUSH PRIVILEGES;
SQL
```

Test: `mysql -u fitx -p fitx -e "SELECT 1;"`.

---

## 3. Application code + environment

```bash
sudo -iu fitx
git clone <REPO_URL> /var/www/fitx
cd /var/www/fitx
npm ci                       # reproducible install from package-lock.json
cp .env.example .env
```

Edit `.env` for production. **Required:**

| Variable | Production value |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `mysql://fitx:PASSWORD@localhost:3306/fitx` |
| `APP_URL` | `https://fitx.pk` (no trailing slash; used for canonical URLs, sitemap, email links) |
| `AUTH_SECRET` | Fresh 48-byte secret — see below |
| `OWNER_EMAIL` / `OWNER_PASSWORD` | The client's owner login (change from any dev value) |
| `UPLOAD_DIR` | `uploads` (relative to the app root) |

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Also set (see `.env.example` for the full list):

- **SMTP** (`SMTP_HOST/PORT/USER/PASSWORD/FROM`, `LEAD_NOTIFY_TO`) so lead
  notifications are emailed. When unset, the app logs the email instead of
  sending it — fine for staging, not for launch.
- **Cloudflare Turnstile** (`TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`)
  for lead-form spam protection (optional; the honeypot works without it).
- `AUTH_SESSION_TTL_HOURS` (default `72`).

> **`NEXT_PUBLIC_*` values are baked in at build time.** Set them before
> `npm run build` and rebuild if they change.

---

## 4. Migrate, generate and seed

```bash
cd /var/www/fitx
npx prisma migrate deploy      # applies committed migrations (never `migrate dev` in prod)
npx prisma generate            # regenerate the client for this platform
npm run db:seed                # idempotent: creates the owner + starter content
```

The seed is safe to re-run: it creates what is missing and leaves existing
records untouched.

---

## 5. Build and run under PM2

```bash
cd /var/www/fitx
npm run build
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup systemd -u fitx --hp /home/fitx   # then run the command it prints
```

Useful commands: `pm2 status`, `pm2 logs fitx`, `pm2 restart fitx`, `pm2 reload fitx`.

Verify locally before adding Nginx:

```bash
curl -s http://127.0.0.1:3000/health
curl -s http://127.0.0.1:3000/robots.txt
```

---

## 6. Nginx + TLS

Copy the provided server block and edit the domain and certificate paths:

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/fitx
sudo ln -s /etc/nginx/sites-available/fitx /etc/nginx/sites-enabled/fitx
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
```

Issue a certificate (Certbot rewrites the block to add TLS and the redirect):

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d fitx.pk -d www.fitx.pk
sudo systemctl reload nginx
```

Certbot installs a renewal timer automatically; confirm with
`sudo systemctl list-timers | grep certbot`.

---

## 7. Uploads directory

`UPLOAD_DIR` defaults to `uploads/` inside the app root and is created on first
upload. Ensure it is writable and preserved across deploys:

```bash
install -d -m 755 /var/www/fitx/uploads
# If you deploy to a fresh directory, symlink the shared uploads folder:
# ln -s /var/www/fitx-shared/uploads /var/www/fitx/uploads
```

Do **not** put `uploads/` in the web root that Nginx serves directly — it is
streamed by the `/uploads/[...path]` route, which also enforces safe paths.

---

## 8. Backups

`deploy/backup.sh` writes a compressed MySQL dump and an `uploads/` tarball into
a backup directory and prunes old files. Install it as a daily cron job:

```bash
sudo -iu fitx
install -d -m 700 ~/backups
chmod +x /var/www/fitx/deploy/backup.sh /var/www/fitx/deploy/restore.sh
crontab -e
# add:  run every day at 02:30
30 2 * * * /var/www/fitx/deploy/backup.sh >> /home/fitx/backups/backup.log 2>&1
```

`deploy/restore.sh` restores the most recent (or a named) backup. **Restore is
documented and rehearsed** — see the script header and §11.

Off-site copies are recommended: add an `rclone`/`scp` line at the end of
`backup.sh` to ship the day's files to remote storage.

---

## 9. Go-live checklist

- [ ] `APP_URL` is the real HTTPS origin and `npm run build` ran **after** it was set.
- [ ] `NODE_ENV=production`, `AUTH_SECRET` is unique, owner password changed.
- [ ] `prisma migrate deploy` applied; `npm run db:seed` run once.
- [ ] `https://fitx.pk/health` returns OK; `/` renders the CMS content.
- [ ] `/robots.txt` and `/sitemap.xml` resolve on the real domain.
- [ ] Owner can log in at `/admin/login`.
- [ ] SMTP configured: a test lead emails `LEAD_NOTIFY_TO`.
- [ ] Backups run (check `~/backups`) and a restore has been tested once.
- [ ] `pm2 save` done and `pm2 startup` enabled (survives reboot).
- [ ] Nginx + Certbot valid; auto-renew timer active.

---

## 10. Deploying an update

```bash
cd /var/www/fitx
git pull
npm ci
npx prisma migrate deploy     # if there are new migrations
npm run build
pm2 reload fitx               # zero-downtime reload
```

The `uploads/` directory and `.env` are untouched by this flow.

---

## 11. Restoring from backup

```bash
# list backups
ls -lh ~/backups
# restore the newest, or pass a specific pair of files
deploy/restore.sh
deploy/restore.sh ~/backups/fitx-db-2026-10-12.sql.gz ~/backups/fitx-uploads-2026-10-12.tar.gz
pm2 restart fitx
```

The script stops nothing itself — it reloads the database and re-syncs
`uploads/`. Run it during a low-traffic window.

---

## 12. Monitoring & troubleshooting

| Symptom | First checks |
| --- | --- |
| 502 from Nginx | `pm2 status` / `pm2 logs fitx` — is the app up on `:3000`? |
| Site shows "Back shortly" | Maintenance mode is on in **Admin → Settings → General**. |
| 500 on all pages | `DATABASE_URL` wrong or MySQL down: `mysqladmin -u fitx -p status`. |
| 500s with Prisma `pool timeout … active=0 idle=0` (esp. right after MySQL restarts) | `caching_sha2_password` fast-auth cache is cold and the driver can't fetch the server RSA key. `src/lib/db.ts` sets `allowPublicKeyRetrieval: true`; if you see this again confirm the build includes that, or prefer a TLS connection to MySQL in production. |
| Leads not emailed | `SMTP_*` unset or wrong; check `pm2 logs` for the `[email]` line. |
| Uploads 404 after deploy | `uploads/` was not preserved (see §7). |
| Login loops back | `AUTH_SECRET` changed (invalidates sessions) or cookies blocked. |

Logs: `pm2 logs fitx --lines 200`. Nginx: `/var/log/nginx/error.log`.

---

## 13. Security notes

- The admin area is protected by a first-pass `src/proxy.ts` guard plus
  per-page/per-action server checks; **restrict** `/admin` by IP or basic-auth at
  the Nginx layer if the studio only manages content from the office.
- Set `secure` cookies (automatic when `NODE_ENV=production`) and keep TLS on.
- Rotate `AUTH_SECRET` only when you intend to sign everyone out.
- Keep the OS, Node and MySQL patched; `npm audit` after dependency updates.
- Uploaded files are validated by extension allow-list, size and magic bytes;
  the `/uploads/` route refuses path traversal.
