# Deploying this Twenty fork to Railway

Twenty is a **monolith**: one server container serves the GraphQL/REST API **and** the built
frontend. So there is **no separate Vercel frontend** — the server serves everything. The full
production stack is **4 Railway services**:

| Service | What it is | Start command |
|---|---|---|
| **Postgres** | Railway managed Postgres (v16+) | — |
| **Redis** | Railway managed Redis | — |
| **twenty-server** | Web service (API + frontend) | `node dist/main` (image default) |
| **twenty-worker** | Background jobs (BullMQ): drip delays, email sync, etc. | `yarn worker:prod` |

> The **worker is required** for drip campaigns — the `DELAY` steps that schedule "wait 1 week"
> run on the worker. Without it, drips will send the first email and never advance.

---

## 1. Get the image

This is a fork with (eventually) custom code, so build from the repo Dockerfile:

- **Dockerfile path:** `packages/twenty-docker/twenty/Dockerfile`
- **Build context / root directory:** repo root
- **Target:** `twenty` (default — bundles server + frontend)

In Railway: *New Service → Deploy from GitHub repo* → pick `kylevanbibber/twenty` → set the
Dockerfile path above. Create the **worker** as a second service from the **same repo/image**,
just override its start command to `yarn worker:prod`.

> The monorepo image build is large and memory-hungry. If the Railway build runs out of memory,
> bump the builder resources, or — only until you have custom backend code — deploy the official
> image `twentycrm/twenty:latest` to validate the setup, then switch to building the fork.

---

## 2. Environment variables

### Shared by **both** server and worker

```bash
NODE_ENV=production
NODE_PORT=3000                       # Twenty listens on NODE_PORT (NOT $PORT). Point Railway's
                                     # service target port at 3000.
PG_DATABASE_URL=${{Postgres.DATABASE_URL}}     # reference the Railway Postgres plugin
REDIS_URL=${{Redis.REDIS_URL}}                 # reference the Railway Redis plugin
APP_SECRET=<run: openssl rand -base64 32>      # MUST be identical on server and worker
SERVER_URL=https://<your-server-domain>        # the public Railway domain (or custom domain)
FRONTEND_URL=https://<your-server-domain>      # same as SERVER_URL (monolith serves the front)
STORAGE_TYPE=local
```

### Worker **only** — add these so it doesn't fight the server

```bash
DISABLE_DB_MIGRATIONS=true
DISABLE_CRON_JOBS_REGISTRATION=true
```

(The **server** runs migrations + registers cron jobs on boot; the worker must not.)

### Storage caveat (read this)

`STORAGE_TYPE=local` writes uploaded files to the container's ephemeral disk, which is **wiped on
redeploy and is NOT shared between the server and worker**. For anything beyond a demo, use S3:

```bash
STORAGE_TYPE=S_3
STORAGE_S3_REGION=...
STORAGE_S3_NAME=<bucket>
STORAGE_S3_ENDPOINT=...
STORAGE_S3_ACCESS_KEY_ID=...
STORAGE_S3_SECRET_ACCESS_KEY=...
```

---

## 3. Connecting Gmail/Outlook mailboxes (required for sending drips)

Drips send through a **connected mailbox**, which uses OAuth. You must create OAuth credentials in
Google Cloud (and/or Azure) and set:

```bash
# Google / Gmail
AUTH_GOOGLE_ENABLED=true
AUTH_GOOGLE_CLIENT_ID=<from Google Cloud console>
AUTH_GOOGLE_CLIENT_SECRET=<from Google Cloud console>
AUTH_GOOGLE_CALLBACK_URL=https://<your-server-domain>/auth/google/redirect
AUTH_GOOGLE_APIS_CALLBACK_URL=https://<your-server-domain>/auth/google-apis/get-access-token
MESSAGING_PROVIDER_GMAIL_ENABLED=true
CALENDAR_PROVIDER_GOOGLE_ENABLED=true   # optional

# Microsoft / Outlook (optional)
AUTH_MICROSOFT_ENABLED=true
AUTH_MICROSOFT_CLIENT_ID=...
AUTH_MICROSOFT_CLIENT_SECRET=...
AUTH_MICROSOFT_CALLBACK_URL=https://<your-server-domain>/auth/microsoft/redirect
AUTH_MICROSOFT_APIS_CALLBACK_URL=https://<your-server-domain>/auth/microsoft-apis/get-access-token
MESSAGING_PROVIDER_MICROSOFT_ENABLED=true
```

In **Google Cloud Console**: create an OAuth client (Web), enable the **Gmail API**, configure the
OAuth consent screen, and add **both** callback URLs above to the authorized redirect URIs. Reply
detection (replied vs. no-response) relies on Gmail/Outlook inbox sync, which uses these same
scopes.

---

## 4. First deploy / migrations

On first boot the **server** auto-initializes the DB if it's empty (`database:init:prod` →
`database:migrate:prod`). Just deploy the server first and watch the logs for
`Nest application successfully started`. Then deploy the worker.

After a deploy that includes new migrations, the server applies them automatically on restart
(unless you set `DISABLE_DB_MIGRATIONS=true` on it — don't).

---

## 5. Custom domain

Add your domain to the **server** service in Railway, then set `SERVER_URL` and `FRONTEND_URL` to
it and update the OAuth redirect URIs to match. No DNS is needed for the worker, Postgres, or Redis.

---

## Quick checklist

- [ ] Postgres + Redis plugins added
- [ ] Server service: Dockerfile build, all shared env vars, target port 3000, domain set
- [ ] Worker service: same image, `yarn worker:prod`, shared env + the two `DISABLE_*` flags
- [ ] `APP_SECRET` identical on server and worker
- [ ] S3 configured (if you need file uploads/attachments)
- [ ] Google/Microsoft OAuth set up + redirect URIs registered (for mailbox sending)
- [ ] Server boots → `Nest application successfully started`, then deploy worker
