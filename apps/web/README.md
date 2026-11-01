# Login prototype

## Run

From `apps/web`, run `npm install`, then `npm start`. Open http://localhost:3000.

Demo account:
- Username: `demo`
- Password: `DemoGame123!`

Accounts are stored in `data/users.json`, with bcrypt password hashes, never plaintext passwords. New registrations are also saved there and survive a restart. This file is for a local demo only: real account data must never be committed to Git. Do not reuse the demo password anywhere else.

## How it works

- The form posts credentials to the server over HTTP (use HTTPS outside localhost).
- The server validates inputs, checks a bcrypt hash and signs a JWT with an eight-hour expiry.
- The JWT is stored only in an HttpOnly cookie, not in local storage. On dashboard requests, the server verifies its signature, expiry, issuer and audience and checks the account exists.
- Form submissions are checked for a matching Origin, and login attempts have a basic in-memory rate limit.
- In embedded previews that block cookies, the dashboard is shown directly after login, but refreshing it may require logging in again. Opening the preview in a new tab permits normal cookie-based sessions.

Set `JWT_SECRET` to a long random secret (at least 32 bytes) and use HTTPS with `NODE_ENV=production`. Without it, a temporary secret is generated on startup, so old sessions stop working after a restart.

This is a prototype, not production-ready authentication: JSON storage is not safe for concurrent/multi-server use; the basic rate limit resets on restart and can group users behind a proxy; there is no account recovery, logout/revocation, or production-grade audit logging. Replace JSON with a database, and use a proper shared rate limiter and security review before deployment.

`src/auth.js` contains the reusable authentication functions; `src/server.js` handles routes; `public/` contains the login screen. Run `npm test` for the authentication tests.
