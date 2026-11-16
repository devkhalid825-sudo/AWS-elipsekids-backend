# Deploy: elipse-kids-backend on a Hostinger VPS (Ubuntu)

Node + Express + Prisma + MySQL, run by PM2 as `elipse-kids-api` on port 5006, behind Nginx.
It does not touch your other apps: own folder, own port, own Nginx site file.

## 0. Prerequisites on the server
```bash
node -v        # needs Node 20+ (LTS). If missing: curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs
sudo apt install -y mysql-server nginx
sudo npm i -g pm2
```

## 1. MySQL database and user
```bash
openssl rand -base64 24            # copy this: it is the DB password
nano deploy/setup.sql              # replace REPLACE_WITH_STRONG_PASSWORD with it
sudo mysql < deploy/setup.sql
```
Creates database `elipse_kids_db` (utf8mb4) and user `elipse_user` with access to that database only.

## 2. Code on the server
```bash
sudo mkdir -p /var/www/elipse-kids-backend && sudo chown $USER /var/www/elipse-kids-backend
cd /var/www/elipse-kids-backend
# upload/clone the contents of the backend folder here, then:
cp .env.example .env
nano .env                          # DATABASE_URL password, ADMIN_PASSWORD, TOKEN_SECRET (openssl rand -hex 32), CORS_ORIGIN
npm install                        # also runs `prisma generate`
```

## 3. Create the tables (Prisma migration)
```bash
npx prisma migrate deploy          # applies prisma/migrations/*_init
npx prisma studio                  # optional: browse the data (use an SSH tunnel)
```
Later schema changes (on your computer): `npx prisma migrate dev --name what_changed`, commit the new
folder in `prisma/migrations`, then run `npx prisma migrate deploy` on the server.

## 4. Start with PM2 (separate process)
```bash
pm2 start ecosystem.config.cjs     # process name: elipse-kids-api
pm2 save
pm2 startup                        # run the command it prints, once, so it survives reboots
pm2 logs elipse-kids-api
curl http://127.0.0.1:5006/health  # {"ok":true}
```
Update later: `git pull && npm install && npx prisma migrate deploy && pm2 restart elipse-kids-api`

## 5. Nginx reverse proxy for the API subdomain
1. DNS: add an `A` record `api` -> your VPS IP.
2. Copy `deploy/nginx-api.conf`, change `api.yourdomain.com`, then:
```bash
sudo cp deploy/nginx-api.conf /etc/nginx/sites-available/elipse-kids-api
sudo ln -s /etc/nginx/sites-available/elipse-kids-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com      # HTTPS
```
`nginx -t` must pass before reload, so existing sites are never interrupted.

## 6. Connect the website
In the frontend `.env` set `VITE_API_URL=https://api.yourdomain.com`, rebuild (`npm run build`) and redeploy.
Make sure `CORS_ORIGIN` in the backend `.env` lists the website's domain, then `pm2 restart elipse-kids-api`.

## Back up
- Database: `mysqldump elipse_kids_db > backup.sql`
- Uploaded files: the `uploads/` folder (or `UPLOAD_DIR`)
