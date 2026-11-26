import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shuffle } from './DekIcons';
import type { AvatarPresetId, DiceBearStyleId, UserAvatarConfig } from '../types/dek';
import { UserAvatar } from './UserAvatar';

interface AvatarStudioProps {
  value: UserAvatarConfig;
  onChange: (next: UserAvatarConfig) => void;
  compact?: boolean;
}

// Les couleurs d'aura / fond sont des DONNÉES de configuration d'avatar (stockées), pas du style d'interface.
const PRESET_AVATARS: { id: AvatarPresetId; label: string; tag: string; aura: string }[] = [
  { id: 'manga-sprint', label: 'Kuro 5h', tag: 'Manga', aura: '#C8FF00' },
  { id: 'manga-fighter', label: 'Akira KO', tag: 'Manga', aura: '#00E5FF' },
  { id: 'fantasy-paladin', label: 'Aegis', tag: 'Fantaisie', aura: '#C8FF00' },
  { id: 'fantasy-shadow', label: 'Shadow', tag: 'Fantaisie', aura: '#FF2E54' },
];

const DICE_STYLES: { id: DiceBearStyleId; label: string }[] = [
  { id: 'lorelei', label: 'Manga' },
  { id: 'adventurer', label: 'Fantaisie' },
  { id: 'bottts', label: 'Cyber Bot' },
];

const FACE_SEEDS = ['Kuro', 'Sora', 'Nova', 'Titan', 'Yuki', 'Blaze'];

const BG_COLORS = ['0f172a', '1e1b4b', '064e3b', '4c0519', '3b0764', '18181b'];

const AURA_COLORS = ['#C8FF00', '#00E5FF', '#FF2E54', '#F59E0B'];

export function AvatarStudio({ value, onChange, compact = false }: AvatarStudioProps) {
  const [studioTab, setStudioTab] = useState<'preset' | 'custom'>(value.mode);

  const switchMode = (mode: 'preset' | 'custom') => {
    setStudioTab(mode);
    onChange({ ...value, mode });
  };

  const randomize = () => {
    const seeds = ['Ryu', 'Kenshin', 'Zoro', 'Valkyrie', 'Orion', 'Kael', 'Nami', 'Apex'];
    const randomSeed = seeds[Math.floor(Math.random() * seeds.length)] + Math.floor(Math.random() * 99);
    const randomBg = BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)];
    onChange({
      ...value,
      mode: 'custom',
      seed: randomSeed,
      bgColor: randomBg,
    });
  };

  return (
    <div className="rounded-[28px] bg-card p-4">
      {/* Aperçu + onglets */}
      <div className="flex items-center gap-4">
        <UserAvatar avatar={value} size={compact ? 'lg' : 'xl'} />
        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-bold leading-5 text-fg">Ton Avatar DEK</div>
          <p className="mt-0.5 text-[12px] font-medium leading-4 text-mute">
            Style Manga, Fantaisie ou création sur mesure
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-tile p-1">
        {(
          [
            { id: 'preset', label: 'Manga & Fantaisie' },
            { id: 'custom', label: 'Personnaliser' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => switchMode(t.id)}
            className={`h-9 rounded-full text-[13px] font-semibold transition-colors ${
              studioTab === t.id ? 'bg-lime text-on-lime' : 'text-mute'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Mode 1 : 4 avatars illustrés */}
      {studioTab === 'preset' ? (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {PRESET_AVATARS.map((item) => {
            const active = value.mode === 'preset' && value.presetId === item.id;
            return (
              <motion.button
                key={item.id}
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() =>
                  onChange({
                    ...value,
                    mode: 'preset',
                    presetId: item.id,
                    auraColor: item.aura,
                  })
                }
                className={`flex flex-col items-center rounded-[20px] border p-1.5 transition-colors ${
                  active ? 'border-lime bg-tile' : 'border-transparent bg-tile'
                }`}
              >
                <img src={`/avatars/${item.id}.jpg`} alt={item.label} className="h-12 w-12 rounded-2xl object-cover" />
                <span className={`mt-1 w-full truncate text-center text-[11px] font-semibold ${active ? 'text-fg' : 'text-mute'}`}>
                  {item.label}
                </span>
                <span className="text-[11px] font-medium text-faint">{item.tag}</span>
              </motion.button>
            );
          })}
        </div>
      ) : (
        /* Mode 2 : personnalisation DiceBear */
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {DICE_STYLES.map((st) => {
              const active = value.diceStyle === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onChange({ ...value, mode: 'custom', diceStyle: st.id })}
                  className={`h-9 rounded-full text-[13px] font-semibold transition-colors ${
                    active ? 'bg-lime text-on-lime' : 'bg-tile text-mute'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={value.seed}
              onChange={(e) => onChange({ ...value, mode: 'custom', seed: e.target.value })}
              placeholder="Nom du perso (ex: Naruto)"
              className="h-10 min-w-0 flex-1 rounded-2xl bg-tile px-3.5 text-[14px] text-fg outline-none transition placeholder:text-faint focus:ring-1 focus:ring-lime"
            />
            <button
              type="button"
              onClick={randomize}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-tile px-4 text-[13px] font-semibold text-fg transition active:scale-95"
            >
              <Shuffle className="h-4 w-4" /> Aléatoire
            </button>
          </div>

          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {FACE_SEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange({ ...value, mode: 'custom', seed: s })}
                className={`h-8 shrink-0 rounded-full px-3.5 text-[13px] font-semibold transition-colors ${
                  value.seed === s ? 'bg-lime text-on-lime' : 'bg-tile text-mute'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-medium text-mute">Fond</span>
            <div className="flex gap-2">
              {BG_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  aria-label={`Fond ${hex}`}
                  onClick={() => onChange({ ...value, mode: 'custom', bgColor: hex })}
                  className={`h-6 w-6 rounded-full border-2 ${value.bgColor === hex ? 'border-lime' : 'border-rim'}`}
                  style={{ backgroundColor: `#${hex}` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Couleur d'aura (preset et personnalisé) */}
      <div className="mt-4 flex items-center justify-between border-t border-rim pt-3">
        <span className="text-[13px] font-medium text-mute">Aura lumineuse</span>
        <div className="flex gap-2">
          {AURA_COLORS.map((aura) => (
            <button
              key={aura}
              type="button"
              aria-label={`Aura ${aura}`}
              onClick={() => onChange({ ...value, auraColor: aura })}
              className={`h-6 w-6 rounded-full border-2 transition ${
                value.auraColor === aura ? 'border-fg' : 'border-transparent opacity-60'
              }`}
              style={{ backgroundColor: aura }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
