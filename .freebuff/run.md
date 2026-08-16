# Run doc — web app preview

## Reproduce the uncommitted artifacts

This thread's workspace IS the main checkout (`C:\Users\MAHAJAN ASHOK\OneDrive\Desktop\lms-main`), so there is nothing to copy:

- Env files are already present in `apps/web/` (`.env`, `.env.local`) — the dev server and `prisma generate` read them.
- Dependencies are already installed: root `node_modules` (npm workspaces hoist `apps/*` and `packages/*`) plus `apps/web/node_modules`. If a fresh checkout ever needs them: `npm install` at the repo root.

## Run the dev server

- Working directory: `apps/web`
- Script: `npm run dev` → `vite dev --host` (TanStack Start dev server)
- Port: **3000** — TanStack Start's Vite dev default (not Vite's usual 5173)
- Detached start on Windows (PowerShell; stdout and stderr must be different files):

```
powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -WorkingDirectory 'C:\Users\MAHAJAN ASHOK\OneDrive\Desktop\lms-main\apps\web' -RedirectStandardOutput '<log>' -RedirectStandardError '<log>.err' -WindowStyle Hidden -PassThru).Id"
```

- Verify it answers: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` → `200`

Notes: harmless warnings at startup — `vite-tsconfig-paths` deprecation, and TanStack Router "does not export a Route" warnings for files under `src/routes/api/` that are server helpers, not routes.
