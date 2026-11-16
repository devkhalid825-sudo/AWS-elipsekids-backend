# elipse-kids-backend

Express + Prisma + MySQL API for maryamandzayn.com: editable site content (incl. hero slider),
image / video uploads, YouTube videos, parent feedback and partner inquiries.
Uploaded files live in `uploads/`. Server setup: see **DEPLOY.md** (MySQL, Prisma, PM2, Nginx).

## Run locally
Needs a MySQL database (`deploy/setup.sql`), then:
```
cp .env.example .env     # set DATABASE_URL, ADMIN_PASSWORD, TOKEN_SECRET, CORS_ORIGIN
npm install
npx prisma migrate deploy
npm start                # port from .env (5006)
```
Frontend: set `VITE_API_URL=http://localhost:5006` in the root `.env`.

## Endpoints
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /auth/login | - | `{name,password}` -> `access_token` |
| GET / PUT / DELETE | /content, /content/:key | PUT, DELETE | Section overrides (site, hero, bond, whatsNew, about, partner, pages) |
| POST | /upload | admin | Upload one image/video, returns `{url}` |
| GET / POST / DELETE | /videos | POST, DELETE | YouTube link (JSON) or file upload (multipart `video`, `thumbnail`) |
| GET / POST | /feedback, /feedback/approved | list/moderate: admin | Parent testimonials |
| POST / GET | /inquiries | GET: admin | Partner form. Always stored; emailed to `INQUIRY_TO` when SMTP_* is set |

