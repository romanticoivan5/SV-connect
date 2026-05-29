# Running SV Connect on Replit (Free Account)

This guide gets your full app (website + API + database) running on Replit with a
shareable link, using **one free Replit account**.

**How it works:** one service runs everything — the API server also serves the
website — at a single URL. The database is SQLite (a file stored inside your Repl),
so there's nothing extra to set up or pay for.

> ⚠️ **Free-tier reality:** the shareable link (`https://...replit.dev`) works while
> your Repl is **running/awake**. Free Repls sleep after inactivity; opening the Repl
> wakes it again. A true always-on 24/7 link needs paid Replit Deployments — not
> required for a normal demo/submission.

---

## STEP 1 — Get the project onto Replit

**Option A — Import from GitHub (recommended, cleanest)**
1. Push this project to GitHub first (create a free repo, then in VS Code terminal):
   ```powershell
   git add .
   git commit -m "SV Connect for Replit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/sv-connect.git
   git push -u origin main
   ```
2. On https://replit.com → **Create Repl → Import from GitHub** → pick your repo.

**Option B — Upload the folder (no GitHub)**
1. On https://replit.com → **Create Repl → Node.js** (name it `sv-connect`).
2. **Important:** before uploading, do NOT include the `node_modules` folder
   (it's huge and Replit rebuilds it). Drag the rest of your project files into
   Replit's file panel.

Either way, Replit will read the `.replit` file we configured.

---

## STEP 2 — Create the database (one time, in the Replit Shell)

1. In your Repl, open the **Shell** tab (not the Console).
2. Run these two commands (wait for each to finish):
   ```bash
   pnpm install --no-frozen-lockfile
   pnpm --filter @workspace/db run push-force && pnpm --filter @workspace/scripts run seed -- --force
   ```
3. You should see **"Changes applied"** then **"Seed complete!"**.
   Your database now has the admin + resident accounts. (You only do this once —
   the SQLite file stays inside your Repl.)

---

## STEP 3 — Press Run

1. Click the big **Run** button at the top.
2. Replit will install, build the website, and start the server (first run takes
   1–2 minutes). When you see **"Server listening"**, it's ready.
3. A **Webview** panel opens with your site. The URL at the top of the webview
   (looks like `https://sv-connect.YOUR-NAME.replit.dev`) is your **shareable link**.

   Log in with: **admin@barangay.ph** / **admin123**

> To share it: copy that webview URL. Anyone can open it while your Repl is running.

---

## STEP 4 — Point the mobile app to your Replit link

When running the mobile app, set the domain to your Replit URL (without `https://`):
```powershell
$env:EXPO_PUBLIC_DOMAIN = "sv-connect.YOUR-NAME.replit.dev"
pnpm --filter @workspace/mobile run dev
```
Now the mobile app talks to your live Replit server.

---

## Login accounts
- **Admin:** `admin@barangay.ph` / `admin123`
- **Resident:** `juan@example.com` / `resident123`

---

## Notes & troubleshooting

- **The link stops working when the Repl sleeps.** Open the Repl and press Run again
  to wake it. (Normal for free Replit.)
- **Data persists** between runs because the SQLite file lives inside your Repl —
  you only seed once (Step 2).
- **"Run" seems stuck the first time:** the initial install + website build takes a
  couple of minutes. Watch the Console for "Server listening".
- **Need to reset the sample data?** Re-run the Step 2 commands in the Shell.
- The `render.yaml` file in the project is for an alternative host (Render) and is
  safely ignored by Replit — you can leave it.
