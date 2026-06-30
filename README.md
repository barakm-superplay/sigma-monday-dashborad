# Monday Sprint Dashboard (self-hosted)

A sprint metrics dashboard for the Server Team and Releases boards: sprint capacity per
developer, a configurable burndown, completion and work-by-status, capacity vs. delivered,
blocked items, and a data-integrity panel. It runs as a static page plus one serverless
function on Vercel. Each developer connects with their own monday API token.

## How it works

- `public/index.html` - the whole dashboard (HTML + CSS + JS, no build step).
- `api/monday.js` - a serverless proxy. The browser sends the developer's monday token in
  the `x-monday-token` header; the function attaches it and relays the GraphQL request to
  `api.monday.com`. The token is never logged and never stored on the server.
- `vercel.json` / `package.json` - Vercel config and Node engine.

The browser talks only to this app. Tokens live in each developer's own `localStorage` and
go only to this app's own proxy.

## Deploy to Vercel

### Option A - Vercel dashboard (no CLI)
1. Push this `monday-dashboard/` folder to a Git repo (GitHub/GitLab/Bitbucket).
2. In Vercel: New Project -> import that repo.
3. Framework preset: **Other**. Leave build command empty. Output: default. Root directory:
   the folder that contains `public/` and `api/`.
4. Deploy. Open the URL, click **Settings**, paste your monday token, **Test connection**,
   then **Save & load**.

### Option B - Vercel CLI
```bash
npm i -g vercel
cd monday-dashboard
vercel          # first run links/creates the project
vercel --prod   # production deploy
```

### Local preview
```bash
npm i -g vercel
cd monday-dashboard
vercel dev      # serves the static page AND the /api function locally
```
Then open the printed localhost URL. (Opening `index.html` directly from disk will not work,
because the page needs the `/api/monday` function.)

## Using it

1. Click **Settings** (top right).
2. Paste your monday personal API token. Get one in monday: avatar -> **Developers** ->
   **My Access Tokens**, or Admin -> API.
3. **Test connection** confirms the token (shows who you're connected as), then **Save & load**.
4. Pick a board from the dropdown. Your selection, sprint-days target, vacation/sick days,
   and burndown timeframe are all remembered in this browser.

## Token / security notes

- Each developer's token is stored in their own browser `localStorage` and sent only to this
  app's proxy. It is not shared between users and not stored server-side.
- `localStorage` is readable by any script running on this origin. Keep the deployment on a
  trusted domain and prefer a monday token scoped to the access you're comfortable sharing.
- The data each person sees reflects their own monday permissions.
- If you'd rather not have tokens in browsers at all, switch to a single server-side token:
  set it as a Vercel environment variable and read it in `api/monday.js` instead of the
  `x-monday-token` header. That makes everyone see the same data (one service account).

## Board list

The boards are defined in `public/index.html` in `BOARD_GROUPS` (Server Team sprints and
Releases). Edit that array to add/remove boards. Estimate columns are resolved by title at
runtime: "Real Estimation" (Server Team) and "Original Estimate (Hours)" (Releases); both are
in hours and 8h = 1 day. "Removed" subitems are excluded.

## Notes / limits

- The burndown is approximate: a point-in-time API read has no daily history, so completion
  dates are inferred from each subitem's last-updated date.
- "Done" / "Blocked" / "Removed" are detected from status label text. If your boards use
  different wording, adjust the regexes in `classifyStatus` / `doneLabelsOf` / `blockedLabelsOf`.
- Item pagination stops after 20 pages (2,000 parent items) as a safety cap; the diagnostics
  panel flags if a board was truncated.
