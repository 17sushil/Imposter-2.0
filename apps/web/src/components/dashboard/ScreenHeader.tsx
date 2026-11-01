'use client';

import styles from './ScreenHeader.module.css';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
};

/**
 * Centred screen title + subtitle with a small back arrow above it.
 * Matches the reference mockup: arrow stands alone, text sits centred.
 */
export function ScreenHeader({ title, subtitle, onBack }: Props) {
  return (
    <header className={styles.wrap}>
      {onBack && (
        <button type="button" onClick={onBack} aria-label="Go back" className={styles.back}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path
              d="M15 5l-7 7 7 7"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      <h1 className={styles.title}>{title}</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </header>
  );
}
