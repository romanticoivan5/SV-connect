# Deploying SV Connect (Permanent Online Link)

This guide puts your website + API + database online with one permanent URL,
e.g. `https://sv-connect.onrender.com`, that works even when your PC is off.

**Stack:** Render (hosts website + API) · Turso (cloud database) · GitHub (code).
All three have free tiers.

---

## STEP 1 — Put your code on GitHub

1. Create a free account at https://github.com
2. Click **+ → New repository**. Name it `sv-connect`. Keep it **Private**. Click **Create repository**.
3. In VS Code's terminal (in your project folder), run these commands one by one
   (replace `YOUR-USERNAME` with your GitHub username):

   ```powershell
   git add .
   git commit -m "Prepare SV Connect for deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/sv-connect.git
   git push -u origin main
   ```

   If asked to sign in, a browser window will open — log into GitHub to authorize.

---

## STEP 2 — Create the cloud database (Turso)

1. Create a free account at https://turso.tech (sign in with GitHub — easiest).
2. In the Turso dashboard, click **Create Database**. Name it `sv-connect`. Pick the
   region closest to you. Click create.
3. On the database page, find and copy two things (save them in Notepad):
   - **Database URL** — looks like `libsql://sv-connect-yourname.turso.io`
   - **Auth Token** — click "Create Token" / "Generate Token", copy the long string.

4. Now create the tables and sample accounts in the cloud database. In your VS Code
   terminal, run (paste YOUR url and token):

   ```powershell
   $env:DATABASE_URL = "libsql://sv-connect-yourname.turso.io"
   $env:DATABASE_AUTH_TOKEN = "paste-your-long-token-here"
   pnpm --filter @workspace/db run push-force
   pnpm --filter @workspace/scripts run seed -- --force
   ```

   You should see "Changes applied" then "Seed complete!". Your cloud database now
   has the admin + resident accounts.

---

## STEP 3 — Deploy on Render

1. Create a free account at https://render.com (sign in with GitHub).
2. Click **New + → Blueprint**.
3. Connect your GitHub and select the `sv-connect` repository.
   Render will detect the `render.yaml` file automatically.
4. Click **Apply**. Render starts setting up the service.
5. When prompted for environment variables (or under the service's **Environment** tab),
   add these two (from Step 2):
   - `DATABASE_URL` = your Turso database URL
   - `DATABASE_AUTH_TOKEN` = your Turso auth token

   (`SESSION_SECRET` is generated automatically — leave it.)
6. Click **Deploy** / **Save**. Wait ~3–5 minutes for the build to finish.
7. When it shows **Live**, your link appears at the top, e.g.
   `https://sv-connect.onrender.com` — open it!

   Log in with: **admin@barangay.ph** / **admin123**

---

## STEP 4 — Point the mobile app to your live link

Edit `artifacts/mobile/app/_layout.tsx` and set the domain to your Render URL
(without `https://`), OR when starting the app set:

```powershell
$env:EXPO_PUBLIC_DOMAIN = "sv-connect.onrender.com"
pnpm --filter @workspace/mobile run dev
```

Now the mobile app talks to your live cloud server instead of your PC.

---

## Updating the site later

Whenever you change the code, just push to GitHub and Render auto-redeploys:

```powershell
git add .
git commit -m "describe your change"
git push
```

---

## Notes & troubleshooting

- **First visit is slow (~50 sec):** Render's free service "sleeps" after 15 min of
  no traffic and wakes on the next visit. This is normal for the free tier.
- **Data persists:** because the database is on Turso (cloud), your accounts,
  requests, and announcements are saved permanently — redeploys don't wipe them.
- **Build failed on Render?** Open the deploy logs in Render. The most common cause
  is a missing `DATABASE_URL` / `DATABASE_AUTH_TOKEN` env var — double-check Step 3.5.
- **Keep your Turso token secret.** Never paste it into a public place or commit it.
  (`.env` files are already git-ignored.)
