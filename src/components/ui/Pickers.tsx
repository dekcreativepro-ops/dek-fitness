import { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { playTick } from '../../utils/soundFx';
import { CaretLeft, CaretRight } from '../DekIcons';

// Sélecteurs tactiles basés sur le défilement natif « aimanté » (fluide au pouce, 60 fps).

const WHEEL_ITEM_H = 52;
const WHEEL_VISIBLE = 7;

/** Pied d'écran « une question par écran » : cercle retour `tile` + pilule lime « Suivant ›». */
export function StepFooter({
  showBack = true,
  onBack,
  onNext,
  nextLabel = 'Suivant',
  nextDisabled = false,
  backLabel = 'Étape précédente',
}: {
  showBack?: boolean;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  backLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onBack}
        disabled={!showBack}
        aria-label={backLabel}
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tile text-fg transition active:scale-90 ${
          showBack ? '' : 'pointer-events-none opacity-0'
        }`}
      >
        <CaretLeft weight="bold" className="h-5 w-5" />
      </button>
      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        onClick={onNext}
        disabled={nextDisabled}
        className={`flex min-h-[52px] flex-1 items-center justify-center gap-1.5 rounded-full px-6 py-2 text-center text-[15px] font-bold leading-5 transition-colors ${
          nextDisabled ? 'bg-tile text-faint' : 'bg-lime text-on-lime'
        } ${showBack ? 'max-w-[240px]' : ''}`}
      >
        <span>{nextLabel}</span>
        <CaretRight weight="bold" className="h-4 w-4 shrink-0" />
      </motion.button>
    </div>
  );
}

/** Roue verticale (âge…) : la valeur centrale est sélectionnée, entre deux traits lime. */
export function WheelPicker({
  min,
  max,
  value,
  onChange,
  suffix,
}: {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState((value - min) * WHEEL_ITEM_H);
  const lastValueRef = useRef(value);
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = (value - min) * WHEEL_ITEM_H;
    // Position initiale uniquement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    setScrollTop(el.scrollTop);
    const idx = Math.max(0, Math.min(values.length - 1, Math.round(el.scrollTop / WHEEL_ITEM_H)));
    const v = values[idx];
    if (v !== lastValueRef.current) {
      lastValueRef.current = v;
      playTick();
      onChange(v);
    }
  };

  const pad = ((WHEEL_VISIBLE - 1) / 2) * WHEEL_ITEM_H;

  return (
    <div className="relative mx-auto w-52 select-none" style={{ height: WHEEL_ITEM_H * WHEEL_VISIBLE }}>
      {/* Deux traits lime autour de la valeur centrale */}
      <div
        className="pointer-events-none absolute inset-x-0 z-10 border-y-2 border-lime"
        style={{ top: pad, height: WHEEL_ITEM_H }}
      />
      <div
        ref={ref}
        onScroll={onScroll}
        className="no-scrollbar snap-y-mandatory h-full overflow-y-auto"
        style={{
          paddingTop: pad,
          paddingBottom: pad,
          maskImage: 'linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)',
        }}
        role="listbox"
        aria-label="Sélecteur"
        tabIndex={0}
        onKeyDown={(e) => {
          if (!ref.current) return;
          if (e.key === 'ArrowDown') ref.current.scrollBy({ top: WHEEL_ITEM_H, behavior: 'smooth' });
          if (e.key === 'ArrowUp') ref.current.scrollBy({ top: -WHEEL_ITEM_H, behavior: 'smooth' });
        }}
      >
        {values.map((v, i) => {
          const dist = Math.abs(i * WHEEL_ITEM_H - scrollTop) / WHEEL_ITEM_H;
          const selected = dist < 0.5;
          return (
            <div
              key={v}
              role="option"
              aria-selected={selected}
              onClick={() => ref.current?.scrollTo({ top: i * WHEEL_ITEM_H, behavior: 'smooth' })}
              className={`num flex snap-center items-center justify-center transition-colors ${
                selected ? 'font-extrabold text-fg' : 'font-semibold text-faint'
              }`}
              style={{
                height: WHEEL_ITEM_H,
                fontSize: selected ? 48 : Math.max(18, 28 - dist * 4),
                opacity: selected ? 1 : Math.max(0.35, 1 - dist * 0.22),
              }}
            >
              {v}
              {selected && suffix && <span className="ml-1.5 mt-3 text-[14px] font-semibold text-mute">{suffix}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const TICK_W = 12;

/** Règle horizontale (poids, taille) : le trait central lime indique la valeur. */
export function RulerPicker({
  min,
  max,
  value,
  onChange,
  unit,
  majorEvery = 10,
}: {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  unit: string;
  majorEvery?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const lastValueRef = useRef(value);
  const count = max - min + 1;

  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollLeft = (value - min) * TICK_W;
    // Position initiale uniquement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const v = Math.max(min, Math.min(max, min + Math.round(el.scrollLeft / TICK_W)));
    if (v !== lastValueRef.current) {
      lastValueRef.current = v;
      playTick();
      onChange(v);
    }
  };

  const nudge = (delta: number) => ref.current?.scrollBy({ left: delta * TICK_W, behavior: 'smooth' });

  return (
    <div className="select-none">
      <div className="mb-6 flex items-end justify-center gap-2">
        <motion.span
          key={value}
          initial={{ y: 6, opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          className="num text-[88px] font-extrabold leading-none text-fg"
        >
          {value}
        </motion.span>
        <span className="mb-3 text-[16px] font-semibold text-mute">{unit}</span>
      </div>

      <div className="relative">
        {/* Index central */}
        <div className="pointer-events-none absolute left-1/2 top-0 z-10 h-[64px] w-[3px] -translate-x-1/2 rounded-full bg-lime" />
        <div
          ref={ref}
          onScroll={onScroll}
          tabIndex={0}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-label={unit}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') nudge(1);
            if (e.key === 'ArrowLeft') nudge(-1);
          }}
          className="no-scrollbar snap-x-mandatory flex h-[90px] overflow-x-auto"
          style={{
            // Marges en CSS (et non mesurées en JS) : la graduation de départ est centrée
            // dès la première image, sinon l'accroche décalait la valeur initiale.
            paddingLeft: `calc(50% - ${TICK_W / 2}px)`,
            paddingRight: `calc(50% - ${TICK_W / 2}px)`,
            maskImage: 'linear-gradient(to right, transparent, black 25%, black 75%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 25%, black 75%, transparent)',
          }}
        >
          {Array.from({ length: count }, (_, i) => {
            const v = min + i;
            const major = v % majorEvery === 0;
            const mid = !major && v % (majorEvery / 2) === 0;
            const tone = v === value ? 'bg-lime' : major ? 'bg-mute' : 'bg-rim';
            return (
              <div key={v} className="relative flex shrink-0 snap-center flex-col items-center" style={{ width: TICK_W }}>
                <div
                  className={`w-[2px] rounded-full ${tone}`}
                  style={{ height: major ? 44 : mid ? 32 : 22 }}
                />
                {major && (
                  <span className="num absolute top-[50px] text-[11px] font-semibold text-faint">{v}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
