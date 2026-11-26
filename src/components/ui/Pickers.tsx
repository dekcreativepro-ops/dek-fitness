import { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { playTick } from '../../utils/soundFx';

// Sélecteurs tactiles basés sur le défilement natif « aimanté » (fluide au pouce, 60 fps).

const WHEEL_ITEM_H = 46;
const WHEEL_VISIBLE = 5;

/** Roue verticale (âge…) : la valeur centrale est sélectionnée. */
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
    <div className="relative mx-auto w-44 select-none" style={{ height: WHEEL_ITEM_H * WHEEL_VISIBLE }}>
      {/* Bandeau de sélection */}
      <div
        className="pointer-events-none absolute inset-x-0 z-10 border-y-2 border-[#C8FF00]"
        style={{ top: pad, height: WHEEL_ITEM_H }}
      />
      <div
        ref={ref}
        onScroll={onScroll}
        className="no-scrollbar snap-y-mandatory h-full overflow-y-auto"
        style={{
          paddingTop: pad,
          paddingBottom: pad,
          maskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)',
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
              className="font-hud flex snap-center items-center justify-center font-bold transition-colors"
              style={{
                height: WHEEL_ITEM_H,
                fontSize: selected ? 34 : Math.max(16, 26 - dist * 5),
                color: selected ? '#FFFFFF' : `rgba(148,163,184,${Math.max(0.25, 0.9 - dist * 0.25)})`,
              }}
            >
              {v}
              {selected && suffix && <span className="ml-1 mt-2 text-xs text-[#C8FF00]">{suffix}</span>}
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
      <div className="mb-3 flex items-end justify-center gap-1.5">
        <motion.span
          key={value}
          initial={{ y: 6, opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          className="font-hud dek-neon-text text-6xl font-bold leading-none text-white"
        >
          {value}
        </motion.span>
        <span className="font-hud mb-1.5 text-sm font-bold text-[#C8FF00]">{unit}</span>
      </div>

      <div className="relative">
        {/* Index central */}
        <div className="pointer-events-none absolute left-1/2 top-0 z-10 h-[64px] w-1 -translate-x-1/2 rounded-full bg-[#C8FF00] shadow-[0_0_12px_#C8FF00]" />
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
          className="no-scrollbar snap-x-mandatory flex h-[86px] overflow-x-auto"
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
            return (
              <div key={v} className="relative flex shrink-0 snap-center flex-col items-center" style={{ width: TICK_W }}>
                <div
                  className="w-[2px] rounded-full"
                  style={{
                    height: major ? 44 : mid ? 32 : 22,
                    backgroundColor: v === value ? '#C8FF00' : major ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)',
                  }}
                />
                {major && (
                  <span className="font-hud absolute top-[50px] text-[10px] font-bold text-slate-400">{v}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
