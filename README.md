# Collab Editor

A real-time collaborative code editor. Start a session, share the link, and edit
together live — with conflict-free sync and live cursors for every connected user.

**Live demo:** _add your deployed URL here once deployed_

## How it works

Sync is powered by [Yjs](https://yjs.dev), a CRDT (Conflict-free Replicated Data
Type) implementation, connected via `y-websocket`. Concurrent edits from multiple
users merge deterministically — there's no central lock and no last-write-wins
data loss, which is the failure mode naive real-time editors run into.

The editor itself is [CodeMirror 6](https://codemirror.net/), bound to the shared
Yjs document through `y-codemirror.next`. Presence (who's connected, their cursor)
comes from Yjs's built-in `awareness` protocol.

**Stack:** React + Vite · Yjs · y-websocket · CodeMirror 6

## Run it locally

You'll need [Node.js](https://nodejs.org) 18+.

```bash
npm install

# terminal 1 — the real-time sync server
npm run sync-server

# terminal 2 — the frontend
npm run dev
```

Open the printed local URL, click **New Session**, then open the same room URL
in a second tab to see live sync in action.

## Deploy

1. **Sync server** — deploy to [Railway](https://railway.app) (or Fly.io/Render).
   Start command: `npx y-websocket-server --port $PORT`
2. **Frontend** — copy `.env.example` to `.env`, set `VITE_WS_URL` to your deployed
   server's `wss://` URL, then deploy the frontend to [Vercel](https://vercel.com).

## Known limitations

- **No persistence** — a room's content is lost once every user disconnects.
  Production-hardening this would mean adding a Yjs persistence adapter
  (`y-redis` or `y-leveldb`) so documents survive server restarts and empty rooms.
- **No auth** — anyone with the room link can join and edit. Fine for a demo;
  a real product would need room-level access control.
