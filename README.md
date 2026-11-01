# Imposter Game

A multiplayer social deduction party game for **Android, iOS, and the web**.

Most players in a round receive the same secret word or drawing prompt. One or more players — the imposters — receive something different: a related word, a different prompt, or nothing at all. Everyone talks, gives clues, draws, argues and then votes. The majority has to find the imposters; the imposters have to blend in and survive.

> **Project status: foundation + first screens.**
> The monorepo structure is in place and the **start screen** and **loading screen** are built
> and running on **both** web (Next.js) and mobile (Expo). No game logic, no backend, no
> Socket.IO events and no databases exist yet.

---

## Styling

Tailwind runs in both apps — Tailwind CSS 3.4 on web, **NativeWind 4** on mobile, so the
same class names work on both. No shadcn / component library. Full details, rules and
gotchas: **`TAILWIND.md`**.

---

## Getting the project folder

Download `imposter-game.zip`, then extract it. You get **one folder** called
`imposter-game/`. Copy **that** folder — not its contents — into your project directory,
then run `npm install` inside `apps/web` and `apps/mobile`.

The zip contains **no `node_modules`**. That is intentional: dependencies are installed
per app on the machine that runs them.

---

## What runs today

| Screen | Web | Mobile |
| --- | --- | --- |
| **Loading screen** — real asset preload, animated progress bar, one tile per character, rotating status lines | ✅ `src/components/start/LoadingScreen.tsx` | ✅ `src/components/start/LoadingScreen.tsx` |
| **Start screen** — logo lockup, 3 characters each in a *different* gesture, gold CTA, fantasy backdrop | ✅ `src/components/start/StartScreen.tsx` | ✅ `src/components/start/StartScreen.tsx` |
| Boot sequence (loading → start) | ✅ `SplashGate.tsx` | ✅ `SplashGate.tsx` |

```bash
# web
cd apps/web && npm install && npm run dev      # http://localhost:3000

# mobile (Expo)
cd apps/mobile && npm install && npm run dev   # press a / i / w
```

Preview routes (web): `/` boot · `/preview/loading` · `/preview/start`
Preview routes (mobile): `app/preview/loading.tsx` · `app/preview/start.tsx`

Screenshots are in [`screenshots/`](./screenshots). Asset layout is documented in
[`ASSETS.md`](./ASSETS.md).

---

## Table of contents

- [What the game is](#what-the-game-is)
- [Game modes](#game-modes)
  - [Word Mode](#word-mode)
  - [Drawing Mode](#drawing-mode)
- [How a round works](#how-a-round-works)
- [Multiplayer options](#multiplayer-options)
  - [Local Mode](#local-mode)
  - [Online Mode](#online-mode)
- [How the system works](#how-the-system-works)
- [How the web app works](#how-the-web-app-works)
- [How the mobile app works](#how-the-mobile-app-works)
- [How web and mobile share one backend](#how-web-and-mobile-share-one-backend)
- [Repository structure](#repository-structure)
- [Technology stack](#technology-stack)
- [Planned later (not installed)](#planned-later-not-installed)
- [Architecture principles](#architecture-principles)
- [Getting started](#getting-started)
- [Repository status](#repository-status)
- [Roadmap](#roadmap)
- [Documentation](#documentation)
- [Glossary](#glossary)

---

## What the game is

Imposter Game is a **pass-and-play and online party game** built around hidden information.

The core idea:

- The group shares a **secret** — a word (Word Mode) or a drawing prompt (Drawing Mode).
- Almost everyone gets the **same** secret.
- The imposter(s) get a **different, related** secret, or **no secret at all**.
- Nobody knows for sure who is who.
- Players produce **clues** (spoken, or drawn) that prove to the group they know the secret — without being so obvious that the imposter can copy them.
- The imposter has to fake it from incomplete information.
- After a discussion phase, everyone **votes**. The group wins by finding the imposter; the imposter wins by surviving the vote (or by correctly guessing the secret).

It is a **social deduction** game: the interesting part is the conversation, the bluffing, and the accusations — not the software. The app's job is to deal the secrets privately, keep the round in sync, collect the votes, and reveal the result at the right moment.

Design consequences that shape the whole project:

- **Private information is the product.** Revealing words and prompts must be a deliberate, one-player-at-a-time action — especially when several people share a single phone. This drives the shared-device reveal flow.
- **The phone is not the game.** In Local Mode the app is a card dealer and a timer. In Online Mode it becomes a shared table plus private hands.
- **Cross-platform by design.** Some of a group will have iPhones, some Androids, some only a laptop browser. A room must accept all of them.
- **Short rounds, instant restarts.** Party games live or die on "play again" friction.

---

## Game modes

Two modes are planned. **Neither is implemented yet** — this section describes the intended behaviour so the shared logic and types can be designed correctly later.

### Word Mode

- Every non-imposter receives the **same secret word** (e.g. *"Volcano"*).
- The imposter receives either a **different but related word** (e.g. *"Geyser"*) or **no word at all**, depending on the configuration.
- Players take turns **giving a one-word or one-sentence clue** that relates to their secret without saying it outright.
- Because a "related word" imposter knows the neighbourhood but not the exact secret, their clues tend to be *plausible but slightly off* — which is the entire tension of the mode.
- A "no word" imposter has to infer the topic purely from other players' clues.
- After the clue rounds, the group **discusses** freely, then **votes**.

### Drawing Mode

- Every non-imposter receives the **same secret drawing prompt** (e.g. *"a cat riding a bicycle"*).
- The imposter receives a **different prompt** or **no prompt**.
- Players draw their interpretation of the prompt on their device (canvas / sketch surface).
- Drawings are revealed, discussed, and voted on.
- Drawing Mode is a natural fit for Online Mode, where each player has their own screen and their own canvas. In Local Mode with one shared device it means passing the device around so each player can draw their own picture.
- The drawing surface technology is deliberately **undecided** (React Native Skia or another suitable solution) and will be chosen when the mode is actually built.

Both modes share the same skeleton — *assign secrets → produce clues → discuss → vote → reveal → score → replay* — which is why the round/phase model belongs in the shared game engine rather than being duplicated per mode.

---

## How a round works

A round is a small state machine. The phases below are the intended design; they are **not implemented** in this repository.

```
        ┌──────────┐
        │  LOBBY   │  players gather (shared device queue, or online room)
        └────┬─────┘
             │ start game
        ┌────▼─────────┐
        │  ASSIGN      │  server/engine deals secrets: word or prompt,
        │  SECRETS     │  and designates who is the imposter
        └────┬─────────┘
             │ each player reveals privately
        ┌────▼─────────┐
        │  REVEAL      │  Local: pass the device, one reveal at a time
        │  (private)   │  Online: each player taps to reveal on their own screen
        └────┬─────────┘
             │ all secrets seen
        ┌────▼─────────┐
        │  CLUE /      │  Word Mode: spoken clue rounds
        │  DRAW PHASE  │  Drawing Mode: each player draws their prompt
        └────┬─────────┘
             │
        ┌────▼─────────┐
        │  DISCUSSION  │  free discussion, accusations, defence
        └────┬─────────┘
             │
        ┌────▼─────────┐
        │  VOTING      │  everyone votes for a suspected imposter
        └────┬─────────┘
             │
        ┌────▼─────────┐
        │  REVEAL      │  imposter(s) revealed, outcome decided,
        │  RESULT      │  scores updated
        └────┬─────────┘
             │
        ┌────▼─────────┐
        │ PLAY AGAIN / │  next round with new secrets, or back to lobby
        │ END GAME     │
        └──────────────┘
```

Key rules the engine will eventually need to own:

- **Player count and imposter count** are configurable (with sensible defaults), and the imposter count must be validated against the number of players so the game stays winnable.
- **Secret assignment must be unpredictable and private.** The imposter must never be derivable from what any client is told.
- **Reveal must be gated.** You cannot proceed until every player has confirmed they have seen their secret — this matters enormously on a shared device, where a stray glance ruins the round.
- **Voting is simultaneous-ish** and must be resolved deterministically (including tie-break rules), so web and mobile clients never disagree on the result.
- **The engine is the single source of truth** for phases and transitions; frontends render state, they do not invent it.

---

## Multiplayer options

### Local Mode

Multiple players share **one device**.

- Players enter their names, then the device is **passed around**.
- For each player: a "pass the phone to X" screen → tap to reveal → secret shown → tap to hide → hand over.
- Word Mode continues with spoken clues; Drawing Mode passes the device so each player draws in turn.
- **No network is required.** Local Mode is fully playable in a car, on a plane, or with bad Wi-Fi — a genuine selling point, and the reason the shared logic must be able to run client-side without the server.
- No backend state is needed, so Local Mode is the natural first playable milestone.

### Online Mode

Each player uses **their own device**, anywhere.

- A host creates a **room**; everyone else joins with a **room code** or an **invitation link**.
- Players can be on **web or mobile in the same room** — that is the whole point of the shared backend.
- The **server owns the room state**: who is connected, who is ready, the current phase, whose turn it is, the votes, and the result. Clients send intents and render the state they receive.
- Real-time updates go over **Socket.IO** — phase changes, player joins/leaves, ready checks, vote counts, results.
- Online Mode is what makes the shared backend necessary, and it is the reason the repository separates frontends from `apps/server`.

Both modes share the same rules, the same types, and the same engine. Only the transport and the reveal UX differ.

---

## How the system works

The project is a **monorepo** with three applications and five shared packages.

```
┌────────────────────┐        ┌────────────────────┐
│   apps/mobile      │        │   apps/web         │
│   Expo + RN + TS   │        │   Next.js + TS     │
│   Android / iOS    │        │   Browsers         │
└─────────┬──────────┘        └─────────┬──────────┘
          │                             │
          │        Socket.IO / HTTP     │
          └──────────────┬──────────────┘
                         │
                ┌────────▼─────────┐
                │   apps/server    │
                │ Node + TS +      │
                │ Socket.IO        │
                │ (rooms, sessions,│
                │  real-time sync) │
                └────────┬─────────┘
                         │ imports
        ┌────────────────┼─────────────────┐
        │                │                 │
┌───────▼──────┐ ┌───────▼───────┐ ┌───────▼──────┐
│game-engine   │ │shared-types   │ │validation    │
│rules, phases │ │interfaces,    │ │Zod schemas   │
│scoring       │ │enums, DTOs    │ │for payloads  │
└──────────────┘ └───────────────┘ └──────────────┘
        │                │                 │
        └────────────────┼─────────────────┘
                         │
                ┌────────▼─────────┐  ┌──────────────┐
                │   packages/ui    │  │packages/utils│
                │ reusable UI      │  │helpers       │
                └──────────────────┘  └──────────────┘
```

Request/update flow in Online Mode, at a high level:

1. A client (web or mobile) emits an **intent** — join room, ready up, submit vote, mark secret as seen.
2. The server **validates** the payload using the shared Zod schemas in `packages/validation`.
3. The server applies the **rules** from `packages/game-engine` to produce a new authoritative state.
4. The server **broadcasts** state (with per-recipient filtering, so secrets only go to their owner) over Socket.IO.
5. Both frontends **render** that state using shared types and (where practical) shared UI components.

Because the engine and the validation schemas live in shared packages, web and mobile cannot drift apart in how they interpret a round — and the same logic can be executed locally for Local Mode without a server.

---

## How the web app works

`apps/web` is a **Next.js + React + TypeScript** application — a normal web app in the browser, not a wrapper around the mobile app.

What it is for:

- **The everywhere client.** Someone with no app installed can open a link and join a room. This is the lowest-friction path into a game and is especially important for invitation links.
- **Desktop and mobile browser play.** Both must work; the layout adapts, but the game is the same.
- **Local Mode on a laptop/tablet.** A tablet passed around a table is a genuinely good shared-device experience, and the web build supports it without an app install.
- **Drawing Mode's natural home** on devices with a mouse, trackpad, or touchscreen, once the drawing solution is chosen.

How it will talk to the backend:

- Connection to `apps/server` over Socket.IO, using shared event types from `packages/shared-types` and shared schemas from `packages/validation`.
- Rendering driven by server state rather than local guesses, so a browser tab and a phone always show the same round.
- Reusable presentational pieces (buttons, player chips, timer, vote rows) come from `packages/ui` where sharing is practical; anything Next.js-specific (routing, metadata, server rendering) stays inside `apps/web`.

Deliberately **not decided yet** at scaffold time: routing structure, rendering strategy per screen, styling approach, and how much of `packages/ui` is actually shareable with React Native (see the caveat below).

---

## How the mobile app works

`apps/mobile` is an **Expo + React Native + TypeScript** application targeting **Android and iOS**.

What it is for:

- **The native, tactile client** — the version people install and keep on their phones for game night.
- **Pass-and-play Local Mode**, which is the most natural fit for a phone in hand: a big "tap to reveal" surface, a clear "hide and pass" step, and no network dependency at all.
- **Online Mode on the go**, joining the same rooms as web players via room code or invitation link / deep link.
- **Drawing Mode** with touch/stylus input, once a drawing surface is selected (React Native Skia or another suitable option).

How it will talk to the backend:

- The same Socket.IO protocol and the same shared types as the web app. There is no "mobile API" — there is one backend contract.
- Secrets and reveal screens live entirely on-device for Local Mode; in Online Mode they are delivered privately by the server.

Deliberately **not decided yet** at scaffold time: navigation library, Expo Router vs. alternatives, native module choices, build/release pipeline (EAS or otherwise), and the drawing implementation.

---

## How web and mobile share one backend

This is the central architectural commitment of the project:

- **One backend, two frontends.** `apps/web` and `apps/mobile` are separate applications with separate builds, dependencies and UX — but they speak to the **same** server with the **same** protocol.
- **A mixed-device room is a first-class case.** A round with three phones and two laptops must work, which means the server never assumes a platform-specific capability.
- **Contracts live in packages.** Event names, payload shapes and validation rules are defined once in `packages/shared-types` and `packages/validation`, then imported by the server and both frontends. Changing the contract is a single, reviewable change.
- **Rules live in packages.** `packages/game-engine` is platform-agnostic TypeScript, so the same rules run on the server for Online Mode and on-device for Local Mode.
- **Platform-specific code stays platform-specific.** Expo APIs never appear in `apps/web`; browser APIs never appear in `apps/mobile`; neither appears in `apps/server`.

A caveat worth stating plainly: **`packages/ui` is the hardest package to share.** React Native and the DOM do not share a component model, so "reusable UI components where practical" will realistically mean shared *design tokens and primitives* rather than one component tree rendered on both platforms. That trade-off belongs in `docs/technical-decisions.md` when the first shared component is built.

---

## Repository structure

```
imposter-game/
│
├── apps/
│   ├── mobile/                     # Expo + React Native + TS (Android, iOS)
│   │   ├── app/                    # expo-router routes (_layout, index, preview/*)
│   │   ├── src/
│   │   │   ├── components/start/   # StartScreen, LoadingScreen, LogoLockup,
│   │   │   │                       # CharacterStage, StartBackdrop, PlayButton, SplashGate
│   │   │   ├── data/characters.ts  # featured character manifest
│   │   │   ├── lib/preloadAssets.ts
│   │   │   └── theme/tokens.ts     # mirrors web tokens.css
│   │   ├── assets/                 # backgrounds/, characters/start
│   │   ├── app.json  babel.config.js  package.json  tsconfig.json
│   │
│   ├── web/                        # Next.js + React + TS
│   │   ├── src/
│   │   │   ├── app/                # layout.tsx, page.tsx, globals.css, preview/*
│   │   │   ├── components/start/   # same component names as mobile
│   │   │   ├── data/characters.ts
│   │   │   ├── lib/preloadImages.ts
│   │   │   └── styles/tokens.css
│   │   ├── public/                 # backgrounds/, characters/{featured,thumbs,all}
│   │   ├── next.config.ts  package.json  tsconfig.json
│   │
│   └── server/                     # empty — Node + Socket.IO not built yet
│
├── packages/
│   ├── game-engine/                # empty
│   ├── shared-types/               # empty
│   ├── validation/                 # empty
│   ├── ui/                         # empty
│   └── utils/                      # empty
│
├── assets/                         # source of truth: 27-character roster + start poses + backgrounds
├── TAILWIND.md                     # Tailwind/NativeWind rules and gotchas
├── docs/                           # project-overview, architecture,
│                                   # development-workflow, technical-decisions
├── screenshots/                    # verified renders of the built screens
├── scripts/                        # empty
├── tests/                          # empty
├── .github/workflows/              # empty
│
├── ASSETS.md                       # where every image lives
├── .env.example  .gitignore  package.json
├── pnpm-workspace.yaml  tsconfig.base.json  README.md
```

> Empty folders contain a `.gitkeep` because git cannot track directories.
> Delete each one when the folder gets its first real file.

> Each empty folder contains a `.gitkeep` file. **Git does not track empty
> directories**, so those placeholders keep the agreed tree intact in version
> control and in the zip. Delete each `.gitkeep` when the folder receives its
> first real file.

Why the folders exist:

| Path | Purpose |
| --- | --- |
| `apps/mobile` | The installable Android/iOS client. Self-contained. |
| `apps/web` | The browser client. A separate app, not generated from mobile. |
| `apps/server` | The only backend. Owns online rooms, sessions and real-time sync. |
| `packages/game-engine` | Pure, platform-agnostic rules: secret assignment, phases, wins, scoring. No UI, no network. |
| `packages/shared-types` | The contract: events, payloads, enums, models used by all three apps. |
| `packages/validation` | Zod schemas for anything crossing a trust boundary (and for forms). |
| `packages/ui` | Shared visual building blocks, where sharing is genuinely practical. |
| `packages/utils` | Small dependency-light helpers (room codes, shuffling, formatting). |
| `docs/` | Long-form documentation; the four named files are the permanent set. |
| `scripts/` | Automation (setup, codegen, release helpers) as the project grows. |
| `tests/` | Tests that span apps/packages or exercise full flows (e.g. a mixed web+mobile room). |
| `.github/workflows` | Continuous integration. |

**No dependency direction is allowed to go upward:** packages never import from apps, and apps never import each other. `apps/web` and `apps/mobile` may import from any package; `apps/server` may import from `game-engine`, `shared-types`, `validation` and `utils` (not `ui`).

---

## Technology stack

### Mobile — `apps/mobile`

| Concern | Choice |
| --- | --- |
| Framework | Expo |
| UI | React Native |
| Language | TypeScript |
| Targets | Android, iOS |

### Web — `apps/web`

| Concern | Choice |
| --- | --- |
| Framework | Next.js |
| UI | React |
| Language | TypeScript |
| Targets | Modern browsers, desktop and mobile |

### Backend — `apps/server`

| Concern | Choice |
| --- | --- |
| Runtime | Node.js |
| Language | TypeScript |
| Real-time | Socket.IO |
| Responsibility | Online rooms, session/game state, real-time synchronisation |

### Shared packages — `packages/*`

| Concern | Choice |
| --- | --- |
| Language | TypeScript |
| Validation | Zod |
| Contents | Shared types and interfaces, game logic, utilities, reusable UI where practical |

### Repository tooling

| Concern | Choice |
| --- | --- |
| Monorepo manager | pnpm workspaces |
| Task running | pnpm recursive scripts (no task-cache layer) |
| Shared TS config | `tsconfig.base.json` |

**On Turborepo:** deliberately **not** used; `turbo.json` was removed during scaffolding. pnpm's recursive commands already cover dependency-ordered and parallel execution (`pnpm -r run build`, `pnpm -r --parallel run dev`) plus per-package filtering (`pnpm --filter web dev`) — everything a project of this size needs. Turbo's only meaningful advantage is content-hash caching, which pays off once there are many packages or slow CI builds and is near-zero now. It is purely additive to reintroduce later (add `turbo` as a devDependency, add a `turbo.json`, prefix the same scripts), so nothing is locked in. Recorded in `docs/technical-decisions.md`.

---

## Planned later (not installed)

These are candidates for **future** adoption. They are listed here so the architecture leaves room for them, and they are **explicitly not installed or configured** in this repository:

- **Zustand** — frontend state management, if React state alone becomes unwieldy.
- **React Native Skia** (or another suitable drawing solution) — Drawing Mode canvas.
- **PostgreSQL** — persistent data, if the game needs history, stats or accounts.
- **Prisma** — ORM, if a database is introduced.
- **Neon** — a possible PostgreSQL hosting provider.
- **Redis** — scaling real-time multiplayer across multiple server instances (adapter/backplane).

Nothing in the current structure depends on any of these; each can be added later without restructuring the repo.

---

## Architecture principles

1. **Mobile and web remain separate applications.** Separate folders, separate dependencies, separate builds, separate UX. No shared "app" that tries to be both.
2. **Both frontends talk to the same backend.** One server, one protocol, one backend contract.
3. **Shared game logic and common types belong in shared packages.** `game-engine`, `shared-types`, `validation`.
4. **Backend responsibilities stay separate from frontend responsibilities.** The server never renders; frontends never own authoritative online state.
5. **Each application and package is independently organised.** Own folder, own concerns, own (future) manifests.
6. **The architecture allows future expansion without major restructuring.** New game modes, new packages, extra server instances, a database — all addable in place.
7. **Nothing is assumed.** Authentication, user accounts, persistent databases and other optional features are **not** requirements. The game must be playable without an account.

Additional conventions worth keeping:

- **The server is authoritative in Online Mode.** Clients send intents, not state.
- **Secrets travel only to their owner.** No payload may let another player derive an imposter.
- **The engine stays pure.** Given a state and an action it returns a new state — no I/O, no timers, no randomness that cannot be injected. This is what makes it testable and reusable in Local Mode.
- **Local Mode needs no network.** Anything that would break offline pass-and-play is a design bug.
- **Type everything that crosses a boundary**, and validate it with Zod at runtime — types alone do not protect a socket.

---

## Getting started

### Prerequisites

- **Node.js 20+** (`node --version`)
- **npm** (comes with Node) — or pnpm if you prefer, see the note below
- For mobile: **Expo Go** on a phone, or Android Studio / Xcode for an emulator

### Run the web app

```bash
cd apps/web
npm install          # first time only
npm run dev          # http://localhost:3000
```

Then open **http://localhost:3000** — that is the boot sequence (loading → start).

| Route | Shows |
| --- | --- |
| `/` | Boot: loading screen, then start screen |
| `/preview/loading` | Loading screen only |
| `/preview/start` | Start screen only |
| `/play-type` | Select Play Type (Local / Online) |
| `/preview/play-type` | Play Type only |
| `/preview/boot` | Same as `/` |

Production build:

```bash
cd apps/web
npm run build
npm start            # http://localhost:3000
```

### Run the mobile app

```bash
cd apps/mobile
npm install          # first time only
npm run dev          # Expo dev server
```

Then press **`w`** for browser, **`a`** for Android, **`i`** for iOS, or scan the
QR code with **Expo Go** on a real phone. Mobile preview routes:
`app/preview/loading.tsx` and `app/preview/start.tsx`.

### Run everything from the repo root (pnpm)

The root `package.json` has workspace scripts, but they need pnpm:

```bash
corepack enable pnpm
pnpm install
pnpm dev:web         # web only
pnpm dev:mobile      # mobile only
pnpm dev             # all apps in parallel
```

> **Not yet verified:** the per-app `npm install` path above has been run and tested.
> The pnpm workspace path is configured but untested — if `pnpm install` complains about
> workspace protocol versions, use the per-app `npm install` commands instead.
> `apps/server` and `packages/*` are still empty, so `pnpm dev` only starts the two frontends.

### Environment variables

Copy `.env.example` to `.env` and fill in real values. `.env` files stay out of version
control via `.gitignore`. Rule to remember: `NEXT_PUBLIC_*` and `EXPO_PUBLIC_*` are inlined
into the client bundle and are therefore **public** — never put a secret behind those
prefixes. Nothing currently reads a variable yet; the start and loading screens need none.

---

## Repository status

Honest inventory of what exists today.

**Created (as specified):**

- All directories: `apps/{mobile,web,server}`, `packages/{game-engine,shared-types,validation,ui,utils}`, `docs/`, `scripts/`, `tests/`, `.github/workflows/`.
- All listed root files as **empty placeholders**, exactly as specified: the four `docs/*.md` files, `.env.example`, `.gitignore`, `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json` — plus this `README.md`, the only file with content.
- A `.gitkeep` file in each otherwise-empty folder (`apps/*`, `packages/*`, `scripts/`, `tests/`, `.github/workflows/`), because git cannot track empty directories. Delete each one when its folder receives its first real file.

**Not present, by design:**

- ❌ No application code, components, screens, pages or routes.
- ❌ No game logic, round engine, secret assignment or scoring.
- ❌ No Socket.IO server, events or API endpoints.
- ❌ No Expo or Next.js project initialisation.
- ❌ No installed dependencies, no `node_modules`, no lockfile.
- ❌ No database, ORM, or migrations.
- ❌ No authentication or user accounts.
- ❌ No CI workflow definitions (the `workflows/` folder is empty), no lint/format/type-check configuration.
- ❌ No working `package.json` scripts — the file is an empty placeholder.

So: the repository *describes* a game; it does not yet *contain* one. Every "how it works" section above describes the agreed design and intent, not implemented behaviour.

---

## Roadmap

Roughly ordered, each step to be agreed before it starts:

1. **Root workspace configuration** — `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.gitignore`, `.env.example`.
2. **Shared contract** — `packages/shared-types` and `packages/validation` with the round/player/event shapes.
3. **Game engine** — pure round state machine, secret assignment, voting resolution, unit tests.
4. **Local Mode first playable** — Word Mode on a single device (web and/or mobile), no server required.
5. **Backend** — Node + Socket.IO rooms, join by code, authoritative state, real-time sync.
6. **Online Mode** — rooms across web and mobile in the same game.
7. **Drawing Mode** — prompt assignment plus a chosen drawing surface.
8. **Polish** — replay loops, reconnect handling, accessibility, CI, deployment.
9. **Optional/unplanned** — accounts, persistence, stats, Redis scaling. Only if the product needs them.

---

## Documentation

The `docs/` folder holds the long-form project documentation. Files exist but are intentionally empty; they are the agreed permanent set.

| File | Will cover |
| --- | --- |
| `docs/project-overview.md` | Vision, target players, game modes, scope and non-goals. |
| `docs/architecture.md` | System diagram, application/package boundaries, data flow, online vs. local execution, scaling notes. |
| `docs/development-workflow.md` | Local setup, branch and commit conventions, review process, testing strategy, build and release steps. |
| `docs/technical-decisions.md` | Decision log: what was chosen, what was rejected, and why (including the shared-UI trade-off and the deferred technologies above). |

---

## Glossary

| Term | Meaning |
| --- | --- |
| **Imposter** | Player who receives a different secret, or none, and must avoid detection. |
| **Secret** | What a player is shown: a word (Word Mode) or a drawing prompt (Drawing Mode). |
| **Clue** | What a player contributes to prove knowledge of the secret — a spoken hint or a drawing. |
| **Local Mode** | Several players sharing a single device, revealing secrets in turn. No network required. |
| **Online Mode** | Each player on their own device, joined to a shared room by code or link. Server-synchronised. |
| **Room** | A server-side game session identified by a short code, holding players and authoritative state. |
| **Phase** | A stage of the round: lobby, reveal, clue/draw, discussion, voting, result. |
| **Round** | One full cycle of secret assignment → clues → vote → result. |
| **Engine** | The pure, platform-agnostic rules module in `packages/game-engine`. |
| **Intent** | A client message expressing a desired action (join, ready, vote), validated server-side. |

---

## License

Not yet decided. Add a `LICENSE` file and update this section before publishing or distributing the project.
