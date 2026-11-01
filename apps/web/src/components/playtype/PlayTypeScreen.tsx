'use client';

import { useRouter } from 'next/navigation';
import { ChoiceScreen } from '@/components/ui/ChoiceScreen';
import { PlayTypeCard } from './PlayTypeCard';
import { SORTED_PLAY_TYPES, type PlayType } from '@/data/modes';

/**
 * Select Play Type — the first branch in the flow.
 * Both options lead to the SAME Choose Game Mode screen; only `?path` differs.
 */
export function PlayTypeScreen() {
  const router = useRouter();

  function handleSelect(id: PlayType['id']) {
    router.push(`/game-mode?path=${id}`);
  }

  return (
    <ChoiceScreen
      title="Select Play Type"
      subtitle="How do you want to play?"
      onBack={() => router.back()}
      footer="Local needs no account · Online uses a room code"
    >
      {SORTED_PLAY_TYPES.map((type) => (
        <PlayTypeCard key={type.id} type={type} onSelect={handleSelect} />
      ))}
    </ChoiceScreen>
  );
}
