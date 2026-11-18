# Final build — everything left, done

Apply this over your repo at `C:\Users\Lenovo\Desktop\Imposter-2.0` (branch `gamer`, head `8eb8247`).
Nothing here touches `node_modules`, `.env`, or any dependency version.

```
final-changes.zip
├─ all-changes.patch              one git patch — the fastest path
├─ README.md                      this file
└─ files/                         the same changes as whole files
   apps/mobile/app/local/play.tsx            NEW      local game screen
   apps/mobile/app/local/setup.tsx           REPLACED Start game → /local/play
   apps/mobile/app/play-type/index.tsx       REPLACED cards fill the screen
   apps/mobile/app/game-mode/index.tsx       REPLACED cards fill the screen
   apps/mobile/src/components/ui/Screen.tsx  REPLACED ChoiceCard flexes
   apps/mobile/tsconfig.json                 REPLACED React types pinned
   apps/server/package.json                  REPLACED --env-file-if-exists
   apps/server/src/game/rules.ts             REPLACED drawing roles + ties
   apps/server/src/game/rules.test.ts        REPLACED 16 tests
   apps/server/src/sockets/roomHandlers.ts   REPLACED one vote each
   apps/web/src/app/layout.tsx               REPLACED themeColor warning
   apps/web/src/components/local/LocalPlayScreen.tsx  REPLACED shared config
   apps/web/src/components/room/RoomGame.tsx          REPLACED shared settings
   apps/web/src/components/room/RoomScreen.tsx        REPLACED live-connection chip
   apps/web/src/lib/rooms/socket.ts                   REPLACED console handle + watcher
   apps/web/src/lib/rooms/store.ts                    REPLACED shared settings
   tests/rooms.e2e.mjs                       NEW      52 online checks
   tests/rooms-edge.e2e.mjs                  NEW      40 edge-case checks
   tests/README.md                           NEW      how to run them
   DELETED  apps/web/src/data/localConfig.ts   (dead duplicate)
   DELETED  apps/web/src/data/modes.ts         (dead duplicate)
   DELETED  apps/web/src/lib/rooms/settings.ts (duplicate of shared)
```

---

## Apply — pick one

### A. The patch (one command, does everything including the deletes)

Verified: I cloned `gamer` fresh, ran `git apply --check` on this exact patch, applied it,
ran `pnpm install`, then all three typechecks, the 16 unit tests, `next build` and both
e2e suites. Everything passed on the applied copy — not just on my working tree.

```powershell
cd C:\Users\Lenovo\Desktop\Imposter-2.0
git stash list
git apply --stat C:\path\to\final-changes\all-changes.patch
git apply C:\path\to\final-changes\all-changes.patch
```

`--stat` first prints what will change without touching anything. If it lists all files, apply.

If it complains about `LocalPlayScreen.tsx` or `ScreenHeader.tsx`:

```powershell
git checkout origin/gamer -- apps/web/src
git apply C:\path\to\final-changes\all-changes.patch
```

### B. Copy the files

```powershell
Copy-Item -Recurse -Force C:\path\to\final-changes\files\* C:\Users\Lenovo\Desktop\Imposter-2.0\
```

Then delete the three dead files by hand:

```powershell
cd C:\Users\Lenovo\Desktop\Imposter-2.0
Remove-Item apps\web\src\data\localConfig.ts, apps\web\src\data\modes.ts, apps\web\src\lib\rooms\settings.ts
```

Either way, install nothing. `.npmrc` is already in your repo.

---

## Then verify

```powershell
pnpm install

cd apps\web      ; npx tsc --noEmit
cd ..\server     ; npx tsc --noEmit ; npm test
cd ..\mobile     ; npx tsc --noEmit
cd ..\web        ; npx next build
```

That is exactly what I ran here. Results:

| check | result |
|---|---|
| `apps/web` tsc | clean |
| `apps/server` tsc | clean |
| `apps/mobile` tsc | clean |
| server unit tests | **16 / 16 pass** |
| `next build` | ✓ compiled, 17 routes |
| online e2e | **52 / 52 pass** |
| edge e2e | **40 / 40 pass** |
| every route returns 200 | `/`, `/play-type`, `/game-mode`, `/local/setup`, `/local/play`, `/room` |

Run the e2e suites yourself:

```powershell
cd apps\server
pnpm dev                      # terminal 1 — leave it running

# terminal 2
cd C:\Users\Lenovo\Desktop\Imposter-2.0
node tests\rooms.e2e.mjs http://localhost:4000
node tests\rooms-edge.e2e.mjs http://localhost:4000
```

---

## What was actually broken

### 1. Mobile did not typecheck at all — hundreds of errors

```
error TS2786: 'Svg' cannot be used as a JSX component.
error TS2607: JSX element class does not support attributes…
```

Every screen failed. Cause: `react-native-svg` and `expo-linear-gradient` resolve `react`
to **React 19's** types (the hoisted copy web uses) instead of mobile's **18.3.31**. Their
base class ends up extending a `Component` that mobile's JSX namespace cannot see.

Fix, in `apps/mobile/tsconfig.json` — pin `react` to the app's own types:

```json
"paths": {
  "react": ["./node_modules/@types/react"],
  "react/*": ["./node_modules/@types/react/*"]
}
```

No dependency changed. Mobile is clean now.

### 2. Anyone could vote twice

```ts
room.votes.set(player.id, targetId ?? null);   // overwrote silently
```

`app.vote` now refuses a second vote. With open voting this was worse than a double-tap:
you could re-vote after seeing the tally.

### 3. Drawing rooms had no imposter at all

`skipRoles()` skipped the *whole* round setup. `role` stayed `null`, `word` stayed `null`,
`resolveVotes()` named no imposter, the crew could never win, and the result screen was
blank. It now deals a word and an imposter and skips only the card round — which is
correct, because in drawing mode the board *is* the reveal.

The unit test that asserted the old behaviour was rewritten, not deleted.

### 4. No votes counted as an imposter win

An empty tally left `caught = false`, so the imposters scored a point for a round nobody
played. Now `winner: 'none'` and no points. Test added.

### 5. Mobile setup → play was a dead end

`Alert.alert('Coming soon')`. It now pushes `/local/play` with the whole config.

### 6. Mobile money screens left dead space

`ChoiceCard` had a fixed `minHeight: 150`. On a modern phone the two cards huddled in the
middle with empty bands above and below. The card wrapper, the card edge and the card face
are now all `flex: 1`, and the card row is `flex: 1` — the two cards split the available
height exactly, top to bottom, no gaps.

### 7. Server could not start without `.env`

`tsx watch --env-file=.env` exits with `node: .env: not found` on any fresh clone or on
Render, which has no `.env`. Now `--env-file-if-exists=.env`, defaults to port 4000.

### 8. A disconnected player looked frozen

The `connection` state existed in `RoomScreen` but was never rendered. A phone that lost
wifi kept showing the last snapshot and every button silently timed out after 8 seconds.
There is now a **Live / Connecting / Reconnecting…** chip next to the room code.

### 9. Dead duplicate config files

`apps/web/src/data/localConfig.ts` (197 lines), `modes.ts` (72) and
`lib/rooms/settings.ts` (172) were byte-for-byte copies of the shared package, already
drifting. Three imports repointed at `@shared/game` / `@shared/game/settings`, then deleted.
**472 lines gone.**

### 10. `themeColor` build warning

Moved out of `metadata`; `viewport` already had it.

### 11. Debug handle was always `null`

`__imposterSocket` was assigned before `socket = io(...)`, so the console helper never
worked. Now assigned after, plus `watchConnection()`.

---

## Two things I could and did not finish

**Mobile online play.** The app has no socket client, no create/join screens and no
connection to the server. Building that is a multi-screen job with its own state machine —
it cannot be done responsibly in the same pass as everything above. The game-mode screen
still says "Coming soon" for Online, which is honest.

**Drawing on mobile.** React Native has no canvas. The plan was `react-native-svg` strokes,
and you said later — so `/local/play` is word mode only and says so on the handout card.

Everything else on the list is in this zip and verified.

---

## Screens, as they now stand

### Web — complete

| route | state |
|---|---|
| `/` | start screen, animated loading, characters, CTA |
| `/play-type` | Local / Online |
| `/game-mode` | Word (violet) / Drawing (orange) |
| `/local/setup` | 3 tabs, presets, 14 settings |
| `/local/play` | word + drawing, shared board, result |
| `/room` | create, join, lobby, live game, chat, voice, board |

### Mobile — mirrored, word mode complete

| route | state |
|---|---|
| `/` | start screen |
| `/play-type` | Local / Online |
| `/game-mode` | Word (violet) / Drawing (orange) |
| `/local/setup` | full, same 14 settings |
| `/local/play` | **new** — handout, reveal, discuss, result |
| online | not built, says so |

---

## One last thing worth knowing

`git stash list` still shows your old `stash@{0}`. Once you have applied this and played one
round, drop it:

```powershell
git stash drop
```

Do not run it before.
