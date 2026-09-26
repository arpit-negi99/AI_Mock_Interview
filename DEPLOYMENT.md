# Deploy InterviewAI on Render Free

The repository includes a [Render Blueprint](render.yaml) that builds React and runs Express as one HTTPS service. The frontend, API and login cookies use the same origin. No paid Redis, disk, or second frontend host is required.

## Required accounts and secrets

- GitHub repository access for Render.
- A Render account using the Free instance plan.
- An existing MongoDB Atlas Free cluster and a database user with read/write access to the application database.
- A Brevo account with transactional sending enabled, a verified sender, and an **API key**, not an SMTP key.
- A Gemini API key and a model available within your project's free-tier quota. Model availability does not establish free usage; check Google AI Studio billing and quota before launch.

Put deployment-only credentials in Render's environment settings. For local assisted deployment, `.deployment/secrets.env` is ignored by Git and may hold `RENDER_API_KEY`, `BREVO_API_KEY`, and `EMAIL_FROM`. Never paste secrets into issue reports, screenshots, or committed files. Existing local MongoDB/Gemini settings are in `backend/.env`.

## Create the service

1. Push the deployment commit to GitHub.
2. In Render, choose **New > Blueprint**, connect this repository, and use `render.yaml` from the deployment branch.
3. Confirm that the service's plan is **Free**. The Blueprint creates no paid resources and initially disables automatic redeployment.
4. Supply `MONGODB_URI`, `BREVO_API_KEY`, `EMAIL_FROM`, `GEMINI_API_KEY`, and `GEMINI_MODEL` when prompted. `EMAIL_FROM` must be the verified email address alone, without a display name.
5. Add the service's outbound IP ranges from the Render dashboard to Atlas Network Access. If the first deploy failed before this was done, redeploy after updating the allowlist.
6. Wait for the deployment and `/api/v1/health/ready` check to pass. Open the HTTPS service URL.

The Blueprint generates separate JWT secrets. Render's `RENDER_EXTERNAL_URL` supplies the allowed frontend origin automatically. If using a custom domain, set `CLIENT_ORIGIN` explicitly to its HTTPS origin without a trailing slash. Multiple origins can be comma-separated.

Do not set a backend-only Root Directory: both `backend` and `frontend` must be available during the build.

For manual Web Service creation, use:

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Plan | Free |
| Root directory | Repository root (blank) |
| Build | `npm --prefix backend ci --omit=dev && npm --prefix frontend ci --include=dev && npm --prefix frontend run build` |
| Start | `npm --prefix backend start` |
| Health check | `/api/v1/health/ready` |

Copy all environment settings from `render.yaml` when creating manually. In particular, use `NODE_ENV=production`, `SERVE_FRONTEND=true`, `TRUST_PROXY_HOPS=1`, `EMAIL_PROVIDER=brevo`, and independent random secrets of at least 32 characters. Leave `VITE_API_BASE_URL` and `VITE_SOCKET_URL` empty to use the page's own origin. Never place secret values in `VITE_*` variables.

## OTP delivery

Production sends registration and password-reset OTPs via `https://api.brevo.com/v3/smtp/email`. SMTP remains supported for local development. Render Free blocks outbound SMTP on ports 25, 465 and 587, so Gmail SMTP settings alone cannot deliver OTPs from this deployment.

Brevo currently allows 300 free sends per day. Account approval, sender verification, spam filtering and daily limits can affect delivery. Inspect Brevo's transactional logs when an email is missing. HTTP 200 from forgot-password intentionally does not reveal whether an account exists.

The transport times out after 10 seconds and does not blindly retry ambiguous email sends. Test mode never sends real email. OTPs are generated cryptographically and expire after 10 minutes. Public registration only creates candidate accounts.

## Database and uploaded files

Production stops at startup if required configuration, the frontend build, MongoDB connectivity, or database index creation fails. If MongoDB disconnects later, API requests return 503 instead of switching to temporary stores. `/api/v1/health/ready` becomes unhealthy until MongoDB reconnects.

New PDF/text resumes are stored in MongoDB GridFS, and their parsed data is stored in the resume collection. Downloads require an access token and ownership. The temporary upload is removed after persistent storage succeeds. Files count toward your Atlas storage quota.

Previously uploaded local files are not migrated automatically; re-upload those resumes after deployment. Production does not expose `/uploads` publicly. Audio uploads are temporary inputs; transcripts and interview results are the persisted record. Browser speech recognition and typed answers do not need permanent audio storage.

## Verify before sharing

Run locally:

```powershell
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix backend test
```

The production-serving test runs when `frontend/dist/index.html` exists. Email tests mock provider requests; they do not establish real inbox delivery. Resume HTTP tests isolate the storage adapter; verify Atlas persistence on the deployed service too.

Then check the actual hosted app:

1. Register using an inbox you own, receive an OTP, and verify the account.
2. Log in, reload a nested route, and verify the session still works.
3. Request a password-reset OTP, change the password, and sign in with it.
4. Upload a small PDF/text resume, complete an interview, and open its report.
5. Redeploy/restart and confirm the account, report and resume remain available.
6. Verify an AI response is labeled AI; quota failures should use the clearly labeled local practice mode.

## Limits and troubleshooting

- Render Free sleeps after 15 idle minutes and may take about a minute to wake. It is appropriate for a portfolio/demo; continuous availability is not guaranteed.
- Select free plans and avoid enabling paid upgrades. Render bandwidth/build allowances, Brevo email limits, Atlas storage, and Gemini quota still apply. Services can stop working when allowances are exhausted.
- A failed readiness check usually means an invalid Atlas connection string, missing network allowlist entries, or failed index creation. Existing duplicate emails can prevent the unique index from being created; resolve actual duplicates before retrying.
- OTP failures usually mean the wrong type of Brevo key, an unverified sender, transactional-account restrictions, or exhausted email quota. The API never returns provider credentials or raw provider responses.
- If the browser requests localhost after deployment, remove old `VITE_*` URL overrides from Render and rebuild.
- Keep one backend instance: interview locks and provider cooldowns are process-local. Shared coordination and crash-atomic interview writes require further work before scaling.
- Old development tokens will be invalid after production secrets change. Sign in again with the account in the deployed database.

## Provider references

- [Render Blueprint configuration](https://render.com/docs/blueprint-spec)
- [Render Free limitations](https://render.com/docs/free)
- [Atlas network access](https://www.mongodb.com/docs/atlas/security/ip-access-list/)
- [Brevo transactional email API](https://developers.brevo.com/reference/send-transac-email)
- [Brevo Free plan](https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan)
- [Gemini billing and free tier](https://ai.google.dev/gemini-api/docs/billing)
