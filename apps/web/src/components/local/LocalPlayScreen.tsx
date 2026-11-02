'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { ScreenShell } from '@/components/ui/ScreenHeader';
import { WordArt, DrawingArt } from '@/components/ui/ModeIcon';
import {
  DOMAINS,
  FALLBACK_DOMAIN,
  CLUE_TIMERS,
  DISCUSSION_TIMERS,
  CLUE_LIMITS,
  VOTING,
  TIE_RULES,
  DIFFICULTIES,
} from '@/data/localConfig';

/**
 * Local round hand-off — reads the configuration back out of the URL.
 *
 * Scaffold only: it proves every setup choice survives the hop and gives the next
 * step a real entry point. No roles, no secret words, no round loop.
 */
function Inner() {
  const router = useRouter();
  const params = useSearchParams();

  const isWord = params.get('mode') !== 'drawing';
  const domainId = params.get('domain') ?? 'food';
  const domain = DOMAINS.find((item) => item.id === domainId) ?? FALLBACK_DOMAIN;

  const clueTimer = Number(params.get('clueTimer') ?? 60);
  const discussionTimer = Number(params.get('discussionTimer') ?? 0);
  const clueLimit = Number(params.get('clueLimit') ?? 1);

  const label = <T extends string | number>(list: { id: T; label: string }[], value: T) =>
    list.find((item) => item.id === value)?.label ?? '—';

  const rows: { label: string; value: string }[] = [
    { label: 'Difficulty', value: label(DIFFICULTIES.map((d) => ({ id: d.id as string, label: d.label })), params.get('difficulty') ?? 'normal') },
    { label: 'Players', value: `${params.get('players') ?? '6'} · ${params.get('imposters') ?? '1'} imposter(s)` },
    { label: 'Rounds', value: params.get('rounds') ?? '3' },
    { label: 'Domain', value: domain.label },
    { label: 'Clue clock', value: label(CLUE_TIMERS, clueTimer) },
    { label: 'Discussion', value: label(DISCUSSION_TIMERS, discussionTimer) },
    { label: 'Clue length', value: clueLimit === 0 ? 'Any' : `${clueLimit} word${clueLimit > 1 ? 's' : ''}` },
    { label: 'Voting', value: label(VOTING, (params.get('voting') ?? 'open') as 'open') },
    { label: 'On a tie', value: label(TIE_RULES, (params.get('tieRule') ?? 'revote') as 'revote') },
    { label: 'Imposter hint', value: params.get('hints') === 'true' ? 'On' : 'Off' },
    { label: 'Knows the word', value: params.get('imposterKnowsWord') === 'true' ? 'On' : 'Off' },
    { label: 'Pass and play', value: params.get('passAndPlay') === 'true' ? 'On' : 'Off' },
    { label: 'Scoreboard', value: params.get('scoreboard') === 'true' ? 'On' : 'Off' },
  ];

  return (
    <ScreenShell backdrop="gamemode">
      <div className="relative z-[1] flex h-full w-full max-w-[460px] flex-col items-center justify-center gap-[clamp(8px,1.8dvh,15px)]">
        <div className="text-center">
          <h1 className="m-0 font-display text-[clamp(1.3rem,5.6vw,1.8rem)] font-extrabold leading-tight text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.7)]">
            Ready to Play
          </h1>
          <p className="m-0 text-[0.62rem] font-semibold text-white/80 [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]">
            Configuration loaded
          </p>
        </div>

        <div className="w-full rounded-[18px] bg-[#120A26] p-3.5 ring-1 ring-inset ring-white/12 shadow-[0_18px_40px_rgba(0,0,0,0.5)]">
          <div className="mb-2 flex items-center gap-2">
            <span
              className={[
                'grid h-7 w-7 place-items-center rounded-[8px]',
                isWord
                  ? 'bg-[linear-gradient(170deg,#A78BFA_0%,#7C3AED_100%)] shadow-[0_3px_0_#4C1D95]'
                  : 'bg-[linear-gradient(170deg,#FB923C_0%,#EA580C_100%)] shadow-[0_3px_0_#7C2D12]',
              ].join(' ')}
            >
              <span className="block h-5 w-5">{isWord ? <WordArt /> : <DrawingArt />}</span>
            </span>
            <span className="text-[0.6rem] font-extrabold uppercase tracking-[0.12em] text-white/85">
              {isWord ? 'Word mode' : 'Drawing mode'} · local
            </span>
          </div>

          <dl className="m-0 divide-y divide-white/10">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-2 py-[3px]">
                <dt className="m-0 text-[0.6rem] font-semibold text-[#BDAEDC]">{row.label}</dt>
                <dd className="m-0 text-right text-[0.62rem] font-extrabold text-white">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex w-full max-w-[300px] flex-col gap-1.5">
          <button
            type="button"
            onClick={() => router.push(`/local/setup?mode=${isWord ? 'word' : 'drawing'}`)}
            className="appearance-none rounded-[12px] border-0 bg-white/12 px-3 py-2 text-[0.66rem] font-extrabold uppercase tracking-[0.1em] text-white ring-1 ring-inset ring-white/15 transition-transform duration-fast active:translate-y-[1px]"
          >
            Edit setup
          </button>
          <p className="m-0 rounded-[10px] bg-[#0B0618]/70 px-2.5 py-1.5 text-center text-[0.55rem] font-semibold leading-[1.4] text-[#C4B5FD]">
            Roles, secret words and the round loop come next — this is the scaffolded
            hand-off.
          </p>
        </div>
      </div>
    </ScreenShell>
  );
}

export function LocalPlayScreen() {
  return <Inner />;
}
