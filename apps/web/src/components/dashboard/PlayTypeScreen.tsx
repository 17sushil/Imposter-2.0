'use client';

import { useRouter } from 'next/navigation';
import { StartBackdrop } from '@/components/start/StartBackdrop';
import { ScreenHeader } from './ScreenHeader';
import { PlayTypeCard } from './PlayTypeCard';
import { SORTED_PLAY_TYPES, type PlayType } from '@/data/modes';
import { getSession } from '@/lib/session';
import styles from './PlayTypeScreen.module.css';

/**
 * Select Play Type — the first real branch in the flow.
 *
 *   Local  → Choose Game Mode (no login, ever)
 *   Online → logged in ? Dashboard : Login → Dashboard
 */
export function PlayTypeScreen() {
  const router = useRouter();
  const session = getSession();

  function handleSelect(id: PlayType['id']) {
    if (id === 'local') {
      router.push('/game-mode?path=local');
      return;
    }

    // online is gated — but a logged-in player goes straight through
    router.push(session.isLoggedIn ? '/dashboard' : '/login?next=/dashboard');
  }

  return (
    <main className={styles.root}>
      <StartBackdrop />

      <div className={styles.content}>
        <ScreenHeader
          title="Select Play Type"
          subtitle="How do you want to play?"
          onBack={() => router.back()}
        />

        <div className={styles.cards}>
          {SORTED_PLAY_TYPES.map((type) => (
            <PlayTypeCard
              key={type.id}
              type={type}
              locked={type.id === 'online' && !session.isLoggedIn}
              onSelect={handleSelect}
            />
          ))}
        </div>

      </div>
    </main>
  );
}
