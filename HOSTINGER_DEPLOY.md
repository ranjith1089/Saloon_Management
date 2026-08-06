# Deploying to Hostinger (Business Web Hosting)

This guide walks you from a fresh Hostinger Business plan to a live domain
serving the salon-management frontend. Backend + PostgreSQL stay on Railway
(Business plan doesn't support them).

## Architecture

```
       your-domain.com                     Railway
           │                                  │
           ▼                                  ▼
   ┌───────────────────┐              ┌────────────────┐
   │  Hostinger Web    │  API calls   │  Node backend  │
   │  Business + SSL   │──────────────►  Express + JWT │
   │  React SPA (dist) │              │  Prisma        │
   └───────────────────┘              └────────┬───────┘
                                               │
                                               ▼
                                       ┌────────────────┐
                                       │ Railway Postgres│
                                       └────────────────┘
```

## Step 1 — Add GitHub secret

GitHub → your repo → Settings → Secrets and variables → Actions → New repository secret.

| Name          | Value                                                                |
|---------------|----------------------------------------------------------------------|
| `VITE_API_URL`| `https://<your-railway-service>.up.railway.app/api/v1`               |

To find your Railway URL:
- Railway → your project → your backend service → Settings → Networking → Public Networking URL.
- Append `/api/v1` (the app's default API prefix).

## Step 2 — Push once to trigger the first build

The workflow at `.github/workflows/deploy-hostinger.yml` fires on every push
to `main` that touches `frontend/`. Push any tiny change (or use the "Run
workflow" button in GitHub → Actions → Deploy frontend to Hostinger).

The build creates a branch called `hostinger-deploy` containing the compiled
`dist/` files. That branch is what Hostinger pulls from — your source code
is never exposed.

## Step 3 — Point your domain to Hostinger

In Hostinger hPanel:
- Domains → Manage → make sure the domain shows "Assigned to hosting"
- If the domain is registered elsewhere, update its nameservers to
  `ns1.dns-parking.com` and `ns2.dns-parking.com`
- Wait for DNS to propagate (usually 5–30 min; can be a few hours worst case)

Verify it works:
```
ping your-domain.com
# should resolve to a Hostinger IP
```

## Step 4 — Enable Auto-Deploy from Git in Hostinger

Hostinger hPanel → Websites → your domain → **Auto-Deploy from Git**.

- **Repository URL**: `https://github.com/<your-user>/Saloon_Management`
- **Branch**: `hostinger-deploy`
- **Deployment path**: `/public_html`
- Save

If it's a private repo:
- Add a Personal Access Token in the URL, or add Hostinger's SSH deploy key
  to your GitHub repo (Settings → Deploy keys).

Once configured, click **Deploy Now** so it grabs the current
`hostinger-deploy` branch. Future pushes to `main` trigger an
Actions build → new commit on `hostinger-deploy` → Hostinger auto-pulls it.

## Step 5 — Enable free SSL

Hostinger hPanel → your domain → **SSL** → **Install SSL** (free Let's Encrypt).

Wait ~5 min for issuance. The site's `.htaccess` already forces HTTPS once
the cert is live.

## Step 6 — Update Railway backend CORS

The backend must accept requests from your new Hostinger domain, not just
Vercel.

Railway → your backend service → Variables → edit `CORS_ORIGIN`:

```
https://your-domain.com,https://www.your-domain.com,https://saloon-management-nine.vercel.app
```

Comma-separated is fine. Save → Railway auto-redeploys.

## Step 7 — Test

Visit `https://your-domain.com`:
- Public landing page loads ✔
- Login works and lands on `/dashboard` ✔
- Booking widget at `/book/<branchId>` loads ✔
- Browser DevTools → Network → API calls go to `<railway-url>/api/v1/...` ✔

## Rolling back a deploy

If a bad build lands on Hostinger, revert instantly:

```bash
# Local
git revert <bad-commit-sha>
git push origin main
# → workflow re-runs → hostinger-deploy branch updated → Hostinger pulls
```

Or in Hostinger hPanel → Auto-Deploy from Git → **Deploy specific commit**
and pick an older SHA from the `hostinger-deploy` branch.

## Where things live after this switch

| Concern         | Where             | Notes                                          |
|-----------------|-------------------|------------------------------------------------|
| Frontend        | Hostinger         | Auto-deployed on every push to `main`          |
| Backend         | Railway           | Unchanged                                      |
| Database        | Railway Postgres  | Unchanged                                      |
| Media           | Cloudinary        | Unchanged                                      |
| WhatsApp API    | Meta              | Env vars on Railway                            |
| SSL             | Hostinger + Railway | Both auto-managed via Let's Encrypt          |
| Custom domain   | Hostinger DNS     | Point A record / nameservers to Hostinger      |

## Old Vercel deploy

You can leave the Vercel frontend running alongside Hostinger indefinitely
(it's free), or delete it once Hostinger is stable. Both point to the same
Railway backend and neither knows about the other.
