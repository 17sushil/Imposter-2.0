# The server is real now

Fastify + Socket.IO in `apps/server`, the rules on the server, the web app rendering what
the server says. No database, no accounts, no voice audio — see the last section.

Everything below was run: 10 rule tests, 38 socket end-to-end checks, and three separate
browser windows playing a full round against each other.

---

## Run it

```powershell
# from the repo root, once
pnpm install

# terminal 1 — the game server
pnpm dev:server          # http://localhost:4000

# terminal 2 — the web app
pnpm dev:web             # http://localhost:3000
```

Then open `http://localhost:3000/room` in **two or three browser windows** (or your phone
and your laptop) and play. Health check: `http://localhost:4000/health`.

**On a phone:** browse to your machine's LAN IP instead of localhost —
`http://192.168.1.20:3000` — and set

```
NEXT_PUBLIC_SERVER_URL=http://192.168.1.20:4000
```

in `apps/web/.env.local`. The server already listens on `0.0.0.0`, so nothing else to do.
(If you skip this the phone will try `localhost:4000`, which means the phone itself.)

**In production** set `NEXT_PUBLIC_SERVER_URL` to the server's public URL and
`CORS_ORIGIN` on the server to your web origin.

---

## What changed in the app

The room no longer polls `/api/rooms`. That route is **deleted**, along with
`src/lib/rooms/store.ts` — rooms live on the server now.

| Before | Now |
| --- | --- |
| lobby polled every 3 s | server pushes `room:state` on every change |
| roles decided in the browser | dealt on the server, word never sent to imposters |
| one device faked the other seats | each player has a real seat and a token |
| refresh lost your seat | `room:resume` puts you back in the same seat |
| no idea if a player left | presence: a dropped player greys out, then is removed after 60 s |
| online drawing had no board | one shared board, strokes streamed to everyone |

---

## How a round runs

```
host creates → others join → host starts
   → reveal    everyone sees their card and taps "I've seen my card";
               the clue phase opens when everyone has
   → clues     one player at a time, in a server-chosen order; only that player
               can send a clue, the input says "Waiting for Maya…" for everyone else
   → discussion chat is open to everyone; the clock (if you set one) closes it,
               or the host presses "Go to vote"
   → voting    pick a suspect or abstain; the result fires when the last vote lands
   → result    who was ejected, whether they were the imposter, who the imposters
               really were, the word, and the winner
```

Drawing rooms skip the cards: the whole round is **one shared board** that each player
adds to in turn, then discussion, then vote.

---

## The rules that are actually enforced server-side

- the crew all get the **same** word; imposters get a category hint and **never** the word
- an imposter can never be more than a third of the table, and never fewer than one
- only the player whose turn it is can send a clue
- you cannot vote for yourself, vote twice, or vote as a spectator
- a tie ejects nobody and the imposters win
- ejected imposter → crew win; anyone else → imposters win
- with **secret** voting, no vote appears in any payload until the result
- joining a room mid-round makes you a spectator until the next round

---

## Tests

```powershell
cd apps\server
npm test          # 10 rule tests
npm run typecheck
```

The word-leak test is the important one: it deals 50 random rounds and, for each, searches
the imposter's entire serialised payload for the secret word.

---

## Deliberately not built

- **No database.** Rooms live in a `Map` and expire after six hours. `rooms/store.ts` is
  the one file to swap if that ever needs Postgres.
- **No accounts.** No passwords, no profiles, no dashboard.
- **No voice audio.** The mic dock is honest UI only — real voice is WebRTC plus a TURN
  server, a separate project. Socket.IO would carry only its signalling.
- **No multi-instance.** Rate limits and rooms are per-process; two servers behind a load
  balancer would need Redis.

---

## Files

```
NEW  apps/server/**                              the server
NEW  packages/shared-types/src/contract.ts       the event + state contract
NEW  apps/web/src/lib/rooms/socket.ts            the browser's socket client
NEW  apps/web/src/components/room/OnlineBoard.tsx shared board for drawing rooms
MOD  apps/web/src/components/room/RoomScreen.tsx  sockets instead of polling
MOD  apps/web/src/components/room/RoomGame.tsx    renders server state
MOD  apps/web/next.config.ts                      /socket.io proxy (for the preview)
MOD  apps/web/package.json, tsconfig.json         + socket.io-client, @shared/contract
MOD  docs/server.md, README.md, .env.example      how to run it
DEL  apps/web/src/app/api/rooms/route.ts          replaced by the server
DEL  apps/web/src/lib/rooms/store.ts              replaced by the server
```

## Apply

```powershell
# repo root
pnpm install
# then delete the two files the server replaces
del apps\web\src\app\api\rooms\route.ts
del apps\web\src\lib\rooms\store.ts
# and run both apps
pnpm dev:server
pnpm dev:web
```
