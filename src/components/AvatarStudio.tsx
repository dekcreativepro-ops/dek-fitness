import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shuffle, Sparkle } from './DekIcons';
import type { AvatarPresetId, DiceBearStyleId, UserAvatarConfig } from '../types/dek';
import { UserAvatar } from './UserAvatar';

interface AvatarStudioProps {
  value: UserAvatarConfig;
  onChange: (next: UserAvatarConfig) => void;
  compact?: boolean;
}

const PRESET_AVATARS: { id: AvatarPresetId; label: string; tag: string; aura: string }[] = [
  { id: 'manga-sprint', label: 'Kuro 5AM', tag: 'Manga', aura: '#C8FF00' },
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
    <div className="rounded-2xl border border-white/10 bg-[#11151D] p-3">
      {/* Aperçu Avatar + Onglets Manga & Fantaisie / Personnaliser */}
      <div className="flex items-center gap-3">
        <UserAvatar avatar={value} size={compact ? 'lg' : 'xl'} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-xs font-bold text-white">
            <Sparkle weight="duotone" className="h-4 w-4 text-[#C8FF00]" />
            <span>Ton Avatar DEK</span>
          </div>
          <p className="mt-0.5 text-[10px] text-slate-400">
            Style Manga, Fantaisie ou création sur mesure
          </p>

          <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-[#080A0E] p-1">
            <button
              type="button"
              onClick={() => switchMode('preset')}
              className={`font-hud relative rounded-lg py-1 text-[10px] font-bold transition ${
                studioTab === 'preset' ? 'bg-[#C8FF00] text-black' : 'text-slate-300'
              }`}
            >
              Manga & Fantaisie
            </button>
            <button
              type="button"
              onClick={() => switchMode('custom')}
              className={`font-hud relative rounded-lg py-1 text-[10px] font-bold transition ${
                studioTab === 'custom' ? 'bg-[#C8FF00] text-black' : 'text-slate-300'
              }`}
            >
              Personnaliser
            </button>
          </div>
        </div>
      </div>

      {/* Mode 1 : 4 Avatars illustrés exclusifs */}
      {studioTab === 'preset' ? (
        <div className="mt-3 grid grid-cols-4 gap-2">
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
                className={`flex flex-col items-center rounded-2xl border p-1.5 transition ${
                  active
                    ? 'border-[#C8FF00] bg-[#C8FF00]/12'
                    : 'border-white/10 bg-[#0B0E14]'
                }`}
              >
                <img
                  src={`/avatars/${item.id}.jpg`}
                  alt={item.label}
                  className="h-12 w-12 rounded-xl object-cover"
                />
                <span className="font-hud mt-1 truncate text-[10px] font-bold text-white">
                  {item.label}
                </span>
                <span className="text-[8px] text-slate-400">{item.tag}</span>
              </motion.button>
            );
          })}
        </div>
      ) : (
        /* Mode 2 : Personnalisation DiceBear */
        <div className="mt-3 space-y-2.5">
          {/* Choix du style */}
          <div className="grid grid-cols-3 gap-1.5">
            {DICE_STYLES.map((st) => {
              const active = value.diceStyle === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onChange({ ...value, mode: 'custom', diceStyle: st.id })}
                  className={`font-hud rounded-xl border py-1.5 text-[10px] font-bold transition ${
                    active
                      ? 'border-[#C8FF00] bg-[#C8FF00]/15 text-[#C8FF00]'
                      : 'border-white/10 bg-[#0B0E14] text-slate-300'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>

          {/* Saisie seed + bouton Aléatoire + 6 visages rapides */}
          <div className="flex gap-1.5">
            <input
              type="text"
              value={value.seed}
              onChange={(e) => onChange({ ...value, mode: 'custom', seed: e.target.value })}
              placeholder="Nom du perso (ex: Naruto)"
              className="flex-1 rounded-xl border border-white/10 bg-[#080A0E] px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#C8FF00]"
            />
            <button
              type="button"
              onClick={randomize}
              className="font-hud flex items-center gap-1 rounded-xl bg-white/10 px-3 py-1.5 text-[10px] font-bold text-[#C8FF00] hover:bg-white/15"
            >
              <Shuffle weight="duotone" className="h-3.5 w-3.5" /> Aléatoire
            </button>
          </div>

          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {FACE_SEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange({ ...value, mode: 'custom', seed: s })}
                className={`shrink-0 rounded-lg border px-2 py-1 text-[10px] font-medium ${
                  value.seed === s
                    ? 'border-[#00E5FF] bg-[#00E5FF]/15 text-[#00E5FF]'
                    : 'border-white/10 bg-[#080A0E] text-slate-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Couleur de fond */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400">Fond :</span>
            <div className="flex gap-1.5">
              {BG_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => onChange({ ...value, mode: 'custom', bgColor: hex })}
                  className={`h-5 w-5 rounded-full border-2 ${
                    value.bgColor === hex ? 'border-[#C8FF00]' : 'border-white/20'
                  }`}
                  style={{ backgroundColor: `#${hex}` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Choix d'Aura néon (valable pour Preset et Personnalisé) */}
      <div className="mt-2.5 flex items-center justify-between border-t border-white/5 pt-2">
        <span className="text-[10px] font-medium text-slate-400">Aura lumineuse :</span>
        <div className="flex gap-2">
          {AURA_COLORS.map((aura) => (
            <button
              key={aura}
              type="button"
              onClick={() => onChange({ ...value, auraColor: aura })}
              className={`h-5 w-5 rounded-full border-2 transition ${
                value.auraColor === aura ? 'scale-110 border-white' : 'border-transparent opacity-65'
              }`}
              style={{ backgroundColor: aura }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
