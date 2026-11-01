/**
 * Session stub.
 *
 * There is no auth in this phase on purpose — no backend, no DB, no provider.
 * This module exists so the Local/Online rule has somewhere to read from.
 * Replace the body with the real session when auth is built; callers do not change.
 */

const STORAGE_KEY = 'imposter.session.isLoggedIn';

/** Placeholder account used until real auth lands. */
export type Session = {
  isLoggedIn: boolean;
  playerName?: string;
};

const LOGGED_OUT: Session = { isLoggedIn: false };

export function getSession(): Session {
  if (typeof window === 'undefined') return LOGGED_OUT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === '1') return { isLoggedIn: true, playerName: 'Player1' };
  } catch {
    // private mode / storage blocked — stay logged out rather than crash
  }
  return LOGGED_OUT;
}

export function setLoggedIn(value: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, '1');
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
