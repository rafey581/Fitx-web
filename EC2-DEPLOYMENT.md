# How to Deploy FITX on AWS EC2 (Ubuntu)

This is an EC2-specific walkthrough based on `DEPLOYMENT.md`. It covers launching an EC2 instance, installing dependencies, setting up MySQL/Nginx/PM2, configuring SSL with Certbot, and going live.

## 1. Launch an EC2 Instance

1. Go to [AWS EC2 Console](https://console.aws.amazon.com/ec2/) → **Launch Instance**
2. **Name**: `fitx-app`
3. **AMI**: Ubuntu Server 22.04 LTS (or 24.04 LTS) — x86_64
4. **Instance Type**: `t3.small` is recommended (minimum `t3.micro` works for small traffic)
5. **Key Pair**: Create a new key pair (or use existing). Download the `.pem` file and store it securely
6. **Network Settings (Security Group)**: Create a new SG with these inbound rules:

| Type  | Port | Source        | Purpose |
|---|------|---------------|---------|
| SSH   | 22   | Your IP (`/32`) | Secure SSH access (restrict to your home/office IP) |
| HTTP  | 80   | `0.0.0.0/0`, `::/0` | Lets Certbot/HTTP redirect to HTTPS |
| HTTPS | 443  | `0.0.0.0/0`, `::/0` | Secure public traffic |

7. **Storage**: 20–30 GB (General Purpose SSD) is enough. Increase if you expect many media uploads.
8. Click **Launch Instance**

## 2. Allocate an Elastic IP (Recommended)

EC2 public IPs change if you stop/start the instance. To keep your domain pointing to a stable IP:

1. EC2 Console → **Elastic IPs** → **Allocate Elastic IP address**
2. Allocate → Select it → **Actions → Associate Elastic IP address**
3. Choose your `fitx-app` instance → Associate
4. Note this IP (you'll point your domain to it)

## 3. Connect to Your EC2 Instance

On your local machine (Linux/macOS/WSL):

```bash
chmod 400 /path/to/your-key.pem
ssh -i /path/to/your-key.pem ubuntu@<YOUR-EC2-PUBLIC-IP>
```

You should be logged in as the `ubuntu` user.

## 4. Install Server Prerequisites

Update packages and install Node.js 22, MySQL, Nginx, PM2:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx mysql-server build-essential

# Install Node.js 22 LTS (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Verify versions
node -v && npm -v && nginx -v && mysql --version
```

## 5. Create the App User & Directory

The official guide runs the app as `fitx`. Create that user and set permissions:

```bash
sudo adduser --disabled-password --gecos "" fitx
sudo usermod -aG www-data fitx
sudo mkdir -p /var/www/fitx
sudo chown -R fitx:fitx /var/www/fitx
```

## 6. Set Up the MySQL Database

Run the MySQL secure setup (recommended):

```bash
sudo mysql_secure_installation
```

Create the database and user:

```bash
sudo mysql <<'SQL'
CREATE DATABASE fitx CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fitx'@'localhost' IDENTIFIED BY 'REPLACE_WITH_A_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON fitx.* TO 'fitx'@'localhost';
FLUSH PRIVILEGES;
SQL
```

Test it:

```bash
mysql -u fitx -p fitx -e "SELECT 1;"
```

## 7. Clone the Code & Configure Environment

Switch to the `fitx` user and clone your repo:

```bash
sudo -iu fitx
cd ~
git clone <YOUR_REPO_URL> /var/www/fitx
cd /var/www/fitx
npm ci
cp .env.example .env
```

Edit `.env` for production:

```bash
nano .env
```

Set the following **required** values:

| Variable | Value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | |
| `DATABASE_URL` | `mysql://fitx:YOUR_DB_PASSWORD@localhost:3306/fitx` | Use the DB password you created above |
| `APP_URL` | `https://yourdomain.com` | **No trailing slash.** Use your real domain (required for sitemap, canonical URLs, emails) |
| `AUTH_SECRET` | Generate a strong secret | Run: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` and paste it |
| `OWNER_EMAIL` | Your admin email | |
| `OWNER_PASSWORD` | A strong admin password | Change this from any dev value |
| `UPLOAD_DIR` | `uploads` | Relative to `/var/www/fitx` |

### Optional but recommended for production

- **SMTP**: Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `LEAD_NOTIFY_TO` to receive lead emails. If left unset, leads are logged (not emailed).
- **Turnstile (spam protection)**: `TURNSTILE_SECRET_KEY` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- **Auth TTL**: `AUTH_SESSION_TTL_HOURS` (default 72)

> `NEXT_PUBLIC_*` variables are baked into the build. Set them **before** `npm run build`.

Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

## 8. Run Migrations, Generate Prisma Client & Seed

Still as `fitx` user in `/var/www/fitx`:

```bash
npx prisma migrate deploy
npx prisma generate
npm run db:seed
```

This is idempotent. It creates the owner account + starter content if missing.

## 9. Build the App

```bash
npm run build
```

This must complete successfully before starting with PM2.

## 10. Run with PM2 (Process Manager)

Start the app using the provided ecosystem config:

```bash
pm2 start deploy/ecosystem.config.cjs
pm2 save
```

Set PM2 to auto-start on server reboot (run the command PM2 prints):

```bash
pm2 startup systemd -u fitx --hp /home/fitx
```

PM2 will output a command like:

```bash
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u fitx --hp /home/fitx
```

**Copy and run that exact command** (as `ubuntu` or with `sudo` as shown).

Verify it's running:

```bash
pm2 status
pm2 logs fitx --lines 50
```

Health check locally:

```bash
curl -s http://127.0.0.1:3000/health
```

Should return `OK`.

## 11. Point Your Domain to EC2

1. Go to your domain registrar (GoDaddy, Cloudflare, Namecheap, etc.)
2. Create **A records** pointing to your Elastic IP:

| Host | Type | Value |
|---|------|-------|
| `@` | A    | `<YOUR-ELASTIC-IP>` |
| `www` | A    | `<YOUR-ELASTIC-IP>` |

DNS propagation can take 1–30 minutes. You can check with `nslookup yourdomain.com`.

## 12. Configure Nginx Reverse Proxy + SSL (Certbot)

Exit `fitx` user (`exit`) back to `ubuntu` user.

Copy the Nginx config:

```bash
sudo cp /var/www/fitx/deploy/nginx.conf /etc/nginx/sites-available/fitx
sudo ln -s /etc/nginx/sites-available/fitx /etc/nginx/sites-enabled/fitx
sudo rm -f /etc/nginx/sites-enabled/default
```

**Edit the Nginx config** to use your domain:

```bash
sudo nano /etc/nginx/sites-available/fitx
```

Replace `fitx.pk` and `www.fitx.pk` with your actual domain (e.g. `yourdomain.com` and `www.yourdomain.com`). Save and exit.

Test Nginx config:

```bash
sudo nginx -t
```

If OK, reload:

```bash
sudo systemctl reload nginx
```

## 13. Install SSL with Certbot (Let's Encrypt)

Install Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Request and install a free SSL certificate (covers both root + www):

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

- Choose whether to redirect HTTP → HTTPS (recommended: **Yes**)
- Certbot will auto-update the Nginx config and set up auto-renewal

Verify auto-renew is active:

```bash
sudo systemctl list-timers | grep certbot
```

Test renewal (dry run):

```bash
sudo certbot renew --dry-run
```

Reload Nginx:

```bash
sudo systemctl reload nginx
```

## 14. Prepare Uploads Directory (Media)

Ensure the uploads folder is writable and persists across future deploys:

```bash
sudo install -d -m 755 /var/www/fitx/uploads
sudo chown -R fitx:fitx /var/www/fitx/uploads
```

Uploads are served through the app route (`/uploads/[...path]`) — do **not** expose this folder directly via Nginx static paths.

## 15. Go-Live Verification

Test your live site:

| URL | Expected |
|---|---|
| `https://yourdomain.com/health` | Returns `OK` (200) |
| `https://yourdomain.com/` | Loads homepage |
| `https://yourdomain.com/robots.txt` | Returns valid robots |
| `https://yourdomain.com/sitemap.xml` | Returns XML sitemap |
| `https://yourdomain.com/admin/login` | Admin login page loads (HTTPS) |

Also verify:
- [ ] Admin login works with `OWNER_EMAIL`/`OWNER_PASSWORD`
- [ ] Lead form submits successfully (check SMTP logs if configured: `pm2 logs fitx`)
- [ ] Images upload correctly in Admin → Media

## 16. Deploying Future Updates (Zero-Downtime)

When you push new code:

```bash
sudo -iu fitx
cd /var/www/fitx
git pull
npm ci
npx prisma migrate deploy  # Only if new migrations exist
npm run build
pm2 reload fitx
pm2 save
```

`.env` and `uploads/` are never touched in this flow.

## 17. Quick Troubleshooting (EC2)

| Issue | Fix |
|---|---|
| **Can't SSH** | Check Security Group allows port 22 from your IP. Verify key permissions (`chmod 400`). |
| **502 Bad Gateway** | App not running: `pm2 status` and `pm2 logs fitx`. Ensure it's bound to `127.0.0.1:3000`. |
| **Site not loading on domain** | DNS not propagated yet (wait 5–30 min). Check `nslookup yourdomain.com` vs Elastic IP. |
| **Certbot fails** | Ensure domain A records point to EC2 and ports 80/443 are open in Security Group. |
| **MySQL connection errors** | Verify `DATABASE_URL` matches DB/user/password. Check MySQL: `sudo systemctl status mysql`. |
| **Uploads 404** | Ensure `/var/www/fitx/uploads` is owned by `fitx:fitx` (`sudo chown -R fitx:fitx /var/www/fitx/uploads`). |
| **PM2 doesn't survive reboot** | Re-run the `pm2 startup` command from Step 10 (it prints the exact sudo command to execute). |

## 18. Security Recommendations (EC2)

- **Restrict SSH**: Keep port 22 limited to your IP only (don't use `0.0.0.0/0`).
- **Keep updated**: `sudo apt update && sudo apt upgrade -y` regularly.
- **Restrict `/admin`**: If only your team accesses it, consider IP allowlisting in Nginx for `/admin` as an extra hardening layer.
- **Backups**: Set up the daily cron from [DEPLOYMENT.md §8](DEPLOYMENT.md#8-backups) (MySQL + uploads). Copy backups off-server (S3/rclone) for disaster recovery.
- **Patch dependencies**: Run `npm audit` periodically after updates.
