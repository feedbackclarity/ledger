# Ledger

Personal budget dashboard. Next.js app, SQLite, password-protected. Deploys to DigitalOcean App Platform.

---

## Two-minute deploy (drag-and-drop path)

You have `ledger-app/` extracted from the zip. Here's the whole flow.

### 1. Drop the folder into Claude Code

Open Claude Code on your Mac (or wherever). Drag the `ledger-app/` folder into the chat. Then paste this single message:

> Deploy this Next.js app to my DigitalOcean account using App Platform.
>
> Steps to run for me:
> 1. Initialize a git repo here and create a new GitHub repo called "ledger" on my account (use `gh repo create`)
> 2. Push the code
> 3. Generate a 32-char random string and remember it as NEXTAUTH_SECRET
> 4. Ask me for the password I want to use to log in
> 5. Create a DigitalOcean app from `.do/app.yaml` using `doctl apps create`, but first edit the yaml to fill in my GitHub username, the NEXTAUTH_SECRET, and my chosen password
> 6. Give me the live URL once it's deployed
> 7. If I have a JSON backup file from the artifact, ask me where it is and run `scripts/seed.ts` against the live database after first deploy
>
> Don't ask me to write code. Just run the commands. Show me what each one does. Pause only when you genuinely need input from me.

Claude Code does the rest. You answer 2 questions (password, optional JSON backup location). Done.

---

## What's in this folder

```
ledger-app/
├── app/                          Next.js routes
│   ├── api/storage/route.ts      Mirrors window.storage interface
│   ├── api/upload/route.ts       Receipt/PDF uploads (10MB max, pdf/jpg/png)
│   ├── api/auth/[...nextauth]/   Auth endpoint
│   ├── login/page.tsx            Password gate
│   ├── layout.tsx
│   ├── page.tsx                  Auth-checked home
│   └── providers.tsx
├── components/
│   └── BudgetPlanner.tsx         The full UI (~1000 lines)
├── lib/
│   ├── db.ts                     SQLite (better-sqlite3)
│   ├── auth.ts                   NextAuth config
│   └── storage-client.ts         Client-side window.storage shim
├── scripts/
│   └── seed.ts                   Import JSON backup from artifact
├── .do/app.yaml                  DigitalOcean spec
├── package.json
├── tsconfig.json
├── next.config.js
├── .env.example
└── .gitignore
```

---

## Manual deploy (if you skip Claude Code)

1. `npm install`
2. Copy `.env.example` to `.env.local`, fill in values, set `LEDGER_PASSWORD` to your chosen password
3. `npm run dev` — opens at http://localhost:3000
4. If you have a JSON backup from the artifact: `npx tsx scripts/seed.ts ~/Downloads/ledger-backup-2026-05.json`
5. Push to GitHub: `git init && git add . && git commit -m "initial" && gh repo create ledger --private --source=. --push`
6. On DigitalOcean: Apps → Create App → connect GitHub → pick the `ledger` repo
7. In the env vars step, set:
   - `NEXTAUTH_SECRET` = any 32+ char random string
   - `LEDGER_PASSWORD` = your login password
   - `NEXTAUTH_URL` = the URL DO assigns (paste after first deploy and redeploy)
   - `DATA_DIR` = `/workspace/data`
   - `UPLOADS_DIR` = `/workspace/uploads`
8. Pick the basic plan (~$5/mo). Deploy.

---

## Persistent storage note (read this)

DigitalOcean App Platform's basic instances do **not** persist disk between deploys. Your SQLite file and uploads will be wiped when DO redeploys.

Two options:

**A. Quick start (acceptable for first 1-2 weeks while you test):**
Accept the limitation. Export JSON backups frequently from Settings. After every push, re-seed from your latest backup.

**B. Production setup (do this once you're committed):**
Switch to **DigitalOcean Managed Postgres** ($15/mo) + **Spaces** ($5/mo for receipts). Tell Claude Code:
> "Migrate this from SQLite-on-disk to DO Managed Postgres for data and DO Spaces for uploads. Update `lib/db.ts` and `app/api/upload/route.ts` accordingly. Add the connection strings as new env vars."

Claude Code can do the migration in one session — same drag-and-drop pattern.

---

## Iterating later

To add or change anything: open Claude Code in this folder, describe what you want, let it edit and push. DO auto-redeploys in ~2 minutes.
