'use client';

import type { PlayType } from '@/data/modes';
import styles from './PlayTypeCard.module.css';

type Props = {
  type: PlayType;
  locked?: boolean;
  onSelect: (id: PlayType['id']) => void;
};

/** Three little hooded crewmates — Local. */
function LocalArt() {
  return (
    <svg viewBox="0 0 72 52" className={styles.icon} aria-hidden="true">
      {/* left */}
      <g>
        <path
          d="M13 50V34a9 9 0 0 1 18 0v16Z"
          fill="#7C3AED"
          stroke="#3B0764"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="22" cy="30" r="8" fill="#1E1038" stroke="#3B0764" strokeWidth="2" />
        <rect x="17.8" y="28.5" width="3.4" height="4.6" rx="1.7" fill="#A5F3FC" />
        <rect x="22.8" y="28.5" width="3.4" height="4.6" rx="1.7" fill="#A5F3FC" />
      </g>
      {/* right */}
      <g>
        <path
          d="M41 50V34a9 9 0 0 1 18 0v16Z"
          fill="#DB2777"
          stroke="#500724"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="50" cy="30" r="8" fill="#1E1038" stroke="#500724" strokeWidth="2" />
        <rect x="45.8" y="28.5" width="3.4" height="4.6" rx="1.7" fill="#A5F3FC" />
        <rect x="50.8" y="28.5" width="3.4" height="4.6" rx="1.7" fill="#A5F3FC" />
      </g>
      {/* centre, larger */}
      <g>
        <path
          d="M24 52V35a12 12 0 0 1 24 0v17Z"
          fill="#22C55E"
          stroke="#14532D"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <circle cx="36" cy="30" r="10" fill="#0B0618" stroke="#14532D" strokeWidth="2.2" />
        <rect x="30.6" y="28" width="4.2" height="5.6" rx="2.1" fill="#A5F3FC" />
        <rect x="36.8" y="28" width="4.2" height="5.6" rx="2.1" fill="#A5F3FC" />
      </g>
    </svg>
  );
}

/** Blue globe — Online. */
function OnlineArt() {
  return (
    <svg viewBox="0 0 64 64" className={styles.icon} aria-hidden="true">
      <defs>
        <linearGradient id="globeFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#BFE3FF" />
          <stop offset="55%" stopColor="#5BB0F7" />
          <stop offset="100%" stopColor="#2B6FD6" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="23" fill="url(#globeFill)" stroke="#0B2A5B" strokeWidth="2.6" />
      <ellipse cx="32" cy="32" rx="9.5" ry="23" fill="none" stroke="#0B2A5B" strokeWidth="2" />
      <path d="M9.5 25h45M9.5 39h45" stroke="#0B2A5B" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="32" cy="32" rx="23" ry="9" fill="none" stroke="#0B2A5B" strokeWidth="1.6" opacity="0.7" />
      <ellipse cx="24" cy="21" rx="7" ry="4.5" fill="#EAF6FF" opacity="0.75" transform="rotate(-25 24 21)" />
    </svg>
  );
}

/**
 * Big accent card for Local / Online — matches the reference mockup:
 * icon, title, subtitle, small tag bottom-left, round arrow bottom-right,
 * chunky 3D bottom edge.
 */
export function PlayTypeCard({ type, locked = false, onSelect }: Props) {
  const isLocal = type.id === 'local';

  return (
    <button
      type="button"
      onClick={() => onSelect(type.id)}
      aria-label={`${type.title} — ${type.subtitle}${locked ? ' (login required)' : ''}`}
      className={`${styles.card} ${isLocal ? styles.local : styles.online}`}
    >
      <span className={styles.art}>{isLocal ? <LocalArt /> : <OnlineArt />}</span>

      <span className={styles.title}>{type.title}</span>
      <span className={styles.subtitle}>{type.subtitle}</span>

      <span className={styles.tag}>{isLocal ? 'on device' : 'needs login'}</span>

      <span className={styles.go} aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path
            d="M9 5l7 7-7 7"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
}
