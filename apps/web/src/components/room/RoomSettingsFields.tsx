'use client';

import {
  CAPACITY,
  IMPOSTER_RANGE,
  ROUND_RANGE,
  TEAM_MODES,
  maxImpostersFor,
  type RoomSettings,
} from '@/lib/rooms/settings';

/**
 * Host settings for a new online room.
 *
 * Tailwind-only (the rest of RoomScreen still uses CSS Modules; these fields are
 * new, so they follow the project's Tailwind rule). Arbitrary values for colour,
 * and every native <button> starts from a reset because preflight is off.
 */

const BTN =
  'appearance-none border-0 bg-transparent font-inherit';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[0.66rem] font-bold text-white/90">{label}</span>
      <span className="text-[0.55rem] font-semibold text-[#a99bc6]">{value}</span>
    </div>
  );
}

function Counter({
  value,
  min,
  max,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        aria-label={`Fewer ${label}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className={[BTN, 'grid h-7 w-7 place-items-center rounded-[8px] bg-white/12 text-[1rem] font-extrabold leading-none text-white disabled:opacity-35 enabled:hover:bg-white/20'].join(' ')}
      >
        −
      </button>
      <span className="grid h-7 w-8 place-items-center rounded-[8px] bg-[#1b1236] text-[0.82rem] font-extrabold text-white ring-1 ring-inset ring-white/15">
        {value}
      </span>
      <button
        type="button"
        aria-label={`More ${label}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className={[BTN, 'grid h-7 w-7 place-items-center rounded-[8px] bg-[#5933a2] text-[1rem] font-extrabold leading-none text-white disabled:opacity-35 enabled:hover:bg-[#6b40bf]'].join(' ')}
      >
        +
      </button>
    </div>
  );
}

function Switch({
  label,
  note,
  checked,
  onChange,
}: {
  label: string;
  note?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[BTN, 'flex w-full items-center justify-between gap-2 rounded-[9px] px-1 py-1 text-left hover:bg-white/[0.06]'].join(' ')}
    >
      <span className="min-w-0">
        <span className="block text-[0.66rem] font-bold leading-tight text-white/90">{label}</span>
        {note && <span className="block text-[0.52rem] font-semibold leading-tight text-[#8f80b3]">{note}</span>}
      </span>
      <span
        aria-hidden="true"
        className={[
          'relative h-[18px] w-[32px] shrink-0 rounded-full transition-colors',
          checked ? 'bg-[#7c4ddb] shadow-[0_2px_0_#4722a6]' : 'bg-[#453469] ring-1 ring-inset ring-white/20',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.4)] transition-[left]',
            checked ? 'left-[16px]' : 'left-[2px]',
          ].join(' ')}
        />
      </span>
    </button>
  );
}

function Chips<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (next: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1">
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.id)}
            className={[
              BTN,
              'rounded-[8px] px-2 py-1 text-[0.56rem] font-extrabold uppercase tracking-[0.05em] transition-transform active:translate-y-[1px]',
              active
                ? 'bg-[#5933a2] text-white shadow-[0_2px_0_#34186b] ring-1 ring-inset ring-[#c49aff]/50'
                : 'bg-white/8 text-[#c9bee4] ring-1 ring-inset ring-white/12 hover:bg-white/14',
            ].join(' ')}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[13px] bg-[#160d33]/80 p-2.5 ring-1 ring-inset ring-[#8a69c4]/35">
      <h3 className="m-0 mb-1.5 text-[0.55rem] font-extrabold uppercase tracking-[0.13em] text-[#cdbde8]">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

export function RoomSettingsFields({
  settings,
  onChange,
}: {
  settings: RoomSettings;
  onChange: (patch: Partial<RoomSettings>) => void;
}) {
  const ceiling = maxImpostersFor(settings.capacity);

  return (
    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
      <Section title="Table">
        <Row label="Max players" value={`${CAPACITY.min}–${CAPACITY.max}`} />
        <Counter
          label="players"
          value={settings.capacity}
          min={CAPACITY.min}
          max={CAPACITY.max}
          onChange={(capacity) => onChange({ capacity })}
        />
        <div className="pt-1">
          <Row label="Imposters" value={`max ${ceiling}`} />
          <Counter
            label="imposters"
            value={settings.imposters}
            min={IMPOSTER_RANGE.min}
            max={ceiling}
            onChange={(imposters) => onChange({ imposters })}
          />
        </div>
        <div className="pt-1">
          <Row label="Imposter words" value={TEAM_MODES.find((t) => t.id === settings.imposterTeam)?.note ?? ''} />
          <Chips
            label="Imposter team words"
            value={settings.imposterTeam}
            options={TEAM_MODES.map((t) => ({ id: t.id, label: t.label }))}
            onChange={(imposterTeam) => onChange({ imposterTeam })}
          />
        </div>
      </Section>

      <Section title="Rounds & clocks">
        <Row label="Rounds" value={`${ROUND_RANGE.min}–${ROUND_RANGE.max}`} />
        <Counter
          label="rounds"
          value={settings.rounds}
          min={ROUND_RANGE.min}
          max={ROUND_RANGE.max}
          onChange={(rounds) => onChange({ rounds })}
        />
        <div className="pt-1">
          <Row label="Clue clock" value={settings.clueTimer === 0 ? 'off' : `${settings.clueTimer}s`} />
          <Chips
            label="Clue clock"
            value={String(settings.clueTimer)}
            options={[
              { id: '30', label: '30s' },
              { id: '60', label: '60s' },
              { id: '90', label: '90s' },
              { id: '0', label: 'Off' },
            ]}
            onChange={(value) => onChange({ clueTimer: Number(value) })}
          />
        </div>
        <div className="pt-1">
          <Row label="Discussion" value={settings.discussionTimer === 0 ? 'off' : `${settings.discussionTimer}s`} />
          <Chips
            label="Discussion clock"
            value={String(settings.discussionTimer)}
            options={[
              { id: '0', label: 'Off' },
              { id: '30', label: '30s' },
              { id: '60', label: '60s' },
              { id: '90', label: '90s' },
            ]}
            onChange={(value) => onChange({ discussionTimer: Number(value) })}
          />
        </div>
      </Section>

      <Section title="Content">
        <p className="m-0 text-[0.6rem] font-bold text-white/85">Word domain</p>
        <Chips
          label="Word domain"
          value={settings.domain}
          options={[
            { id: 'food', label: 'Food' },
            { id: 'animals', label: 'Animals' },
            { id: 'places', label: 'Places' },
            { id: 'movies', label: 'Movies' },
            { id: 'objects', label: 'Objects' },
            { id: 'sports', label: 'Sports' },
          ]}
          onChange={(domain) => onChange({ domain })}
        />
        <div className="pt-1">
          <Switch
            label="Hint for imposter"
            note="They are told the category"
            checked={settings.hints}
            onChange={(hints) => onChange({ hints })}
          />
          <Switch
            label="Reveal teammates"
            note="Imposters see each other"
            checked={settings.revealTeammates}
            onChange={(revealTeammates) => onChange({ revealTeammates })}
          />
        </div>
      </Section>

      <Section title="Room flow">
        <Switch
          label="Auto-start when full"
          checked={settings.autoStart}
          onChange={(autoStart) => onChange({ autoStart })}
        />
        <Switch
          label="Allow spectators"
          note="Watch without playing"
          checked={settings.allowSpectators}
          onChange={(allowSpectators) => onChange({ allowSpectators })}
        />
        <Switch
          label="Late join"
          note="Join after round one"
          checked={settings.lateJoin}
          onChange={(lateJoin) => onChange({ lateJoin })}
        />
        <div className="pt-1">
          <p className="m-0 mb-0.5 text-[0.6rem] font-bold text-white/85">Voting</p>
          <Chips
            label="Voting method"
            value={settings.voting}
            options={[
              { id: 'open', label: 'Open' },
              { id: 'secret', label: 'Secret' },
            ]}
            onChange={(voting) => onChange({ voting })}
          />
        </div>
      </Section>
    </div>
  );
}
