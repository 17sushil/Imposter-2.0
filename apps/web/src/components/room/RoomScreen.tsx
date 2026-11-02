'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from './RoomScreen.module.css';
type Room = { code: string; mode: 'word' | 'drawing'; capacity: number; players: { name: string; avatar: string; host: boolean }[] };
const avatars = [
  { id: 'crew-red', label: 'Red', image: '/characters/thumbs/crew-red.webp' },
  { id: 'cyber-neon', label: 'Neon', image: '/characters/thumbs/cyber-neon.webp' },
  { id: 'galaxy-cosmic', label: 'Cosmic', image: '/characters/thumbs/galaxy-cosmic.webp' },
  { id: 'premium-galaxy', label: 'Galaxy', image: '/characters/playtype/premium-galaxy-thumb.png' },
  { id: 'premium-gold', label: 'Gold', image: '/characters/playtype/premium-gold-thumb.png' },
  { id: 'premium-neon', label: 'Electric', image: '/characters/playtype/premium-neon-thumb.png' },
];
export function RoomScreen() {
  const router = useRouter();
  const [screen, setScreen] = useState<'choose' | 'create' | 'join' | 'lobby'>('choose');
  const [name, setName] = useState(''); const [avatar, setAvatar] = useState('crew-red');
  const [code, setCode] = useState(''); const [capacity, setCapacity] = useState(4);
  const [mode, setMode] = useState<'word' | 'drawing'>('word'); const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (screen !== 'lobby' || !room) return;
    const roomCode = room.code; let active = true;
    async function refresh() {
      try {
        const response = await fetch(`/api/rooms?code=${encodeURIComponent(roomCode)}`, { cache: 'no-store' });
        const data = await response.json(); if (!active) return;
        if (response.ok) { setRoom(data.room); setError(''); }
        else setError('Could not refresh the room. If cookies are blocked in preview, open this app in a new tab.');
      } catch { if (active) setError('Connection lost. Trying again…'); }
    }
    const timer = setInterval(refresh, 3000);
    return () => { active = false; clearInterval(timer); };
  }, [screen, room?.code]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const response = await fetch('/api/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: screen, name: name.trim(), avatar, code, capacity, mode }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Something went wrong.'); return; }
      setRoom(data.room); setScreen('lobby');
    } catch { setError('Could not reach the server. Please try again.'); }
    finally { setBusy(false); }
  }
  function back() { setError(''); if (screen === 'choose') router.push('/play-type'); else setScreen('choose'); }
  async function copyCode() { if (!room) return; try { await navigator.clipboard.writeText(room.code); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { setError('Copy the room code shown above and share it with your friends.'); } }
  return <main className={styles.stage}><div className={styles.wrapper}>
    {screen !== 'lobby' && <button className={styles.back} onClick={back} aria-label="Go back">←</button>}
    <div className={styles.topline}><span>✦</span> IMPOSTER <span>✦</span></div>
    {screen === 'choose' && <><div className={styles.header}><span className={styles.eyebrow}>PLAY TOGETHER</span><h1>Online play</h1><p>Good friends. Great imposters.</p></div><div className={styles.choiceGrid}>
      <button className={`${styles.choice} ${styles.createChoice}`} onClick={() => setScreen('create')}><span className={styles.choiceIcon}>✦</span><strong>Create room</strong><span>Set up a game and invite your friends</span><i>LET’S HOST <b>→</b></i></button>
      <button className={`${styles.choice} ${styles.joinChoice}`} onClick={() => setScreen('join')}><span className={styles.choiceIcon}>⌁</span><strong>Join room</strong><span>Got a code? Jump into the fun</span><i>JOIN A GAME <b>→</b></i></button>
    </div><p className={styles.footnote}>✧ &nbsp; BETTER TOGETHER, SUSPICIOUS FOREVER &nbsp; ✧</p></>}
    {(screen === 'create' || screen === 'join') && <><div className={styles.header}><span className={styles.eyebrow}>{screen === 'create' ? 'YOUR GAME, YOUR RULES' : 'YOUR FRIENDS ARE WAITING'}</span><h1>{screen === 'create' ? 'Create a room' : 'Join a room'}</h1><p>{screen === 'create' ? 'Get your crew together for game night.' : 'Enter the code and pick your disguise.'}</p></div>
      <form className={styles.panel} onSubmit={submit}>
        {screen === 'join' && <label className={styles.label}>ROOM CODE<input className={`${styles.input} ${styles.codeInput}`} value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. ABC234" minLength={6} maxLength={6} required /></label>}
        <label className={styles.label}>PLAYER NAME<input className={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="What should we call you?" minLength={2} maxLength={20} required /></label>
        <fieldset className={styles.avatarField}><legend>CHOOSE YOUR CHARACTER</legend><div className={styles.avatars}>{avatars.map(a => <button key={a.id} type="button" className={`${styles.avatar} ${avatar === a.id ? styles.selectedAvatar : ''}`} onClick={() => setAvatar(a.id)} aria-label={a.label} aria-pressed={avatar === a.id}><img src={a.image} alt="" /></button>)}</div></fieldset>
        {screen === 'create' && <div className={styles.settings}><fieldset><legend>GAME MODE</legend><div className={styles.modes}><button type="button" className={mode === 'word' ? styles.activeMode : ''} onClick={() => setMode('word')} aria-pressed={mode === 'word'}>💬 &nbsp;Word</button><button type="button" className={mode === 'drawing' ? styles.activeMode : ''} onClick={() => setMode('drawing')} aria-pressed={mode === 'drawing'}>🎨 &nbsp;Drawing</button></div></fieldset><fieldset><legend>MAX PLAYERS</legend><div className={styles.counter}><button type="button" onClick={() => setCapacity(Math.max(3, capacity - 1))} disabled={capacity === 3} aria-label="Fewer players">−</button><strong>{capacity}</strong><button type="button" onClick={() => setCapacity(Math.min(10, capacity + 1))} disabled={capacity === 10} aria-label="More players">+</button></div><small>3–10 players</small></fieldset></div>}
        {error && <p className={styles.error} role="alert">{error}</p>}<button className={styles.primary} disabled={busy} type="submit">{busy ? 'One moment…' : screen === 'create' ? 'Create room' : 'Join room'} <span>→</span></button>
      </form></>}
    {screen === 'lobby' && room && <><div className={styles.header}><span className={styles.eyebrow}>THE PARTY STARTS HERE</span><h1>Game lobby</h1><p>Share the code and gather your crew.</p></div><div className={styles.panel}><div className={styles.roomCode}><div><span>ROOM CODE</span><strong>{room.code}</strong></div><button type="button" onClick={copyCode}>{copied ? 'Copied ✓' : 'Copy code'}</button></div><div className={styles.roomDetails}><span>✦ {room.mode === 'word' ? 'Word mode' : 'Drawing mode'}</span><span>● {room.players.length} / {room.capacity} players</span></div><div className={styles.playerHeading}><span>THE CREW</span><span>{room.players.length}/{room.capacity}</span></div><ul className={styles.players}>{room.players.map(player => <li key={player.name}><img src={avatars.find(a => a.id === player.avatar)?.image} alt="" /><strong>{player.name}</strong>{player.host && <span>👑 HOST</span>}</li>)}</ul>{error && <p className={styles.error} role="alert">{error}</p>}<div className={styles.waiting}><span className={styles.pulse} /> Waiting for players to join…</div><p className={styles.lobbyNote}>Room setup is ready. Gameplay is coming soon.</p></div></>}
  </div></main>;
}
