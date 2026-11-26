import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from './DekIcons';
import { CinematicImage } from './ui/kit';

// Carrousel d'accueil (3 écrans plein cadre, glisser au pouce), avant la création de compte.

const SLIDES = [
  {
    image: '/images/banner-home.jpg',
    position: '72% 30%',
    tint: '#C8FF00',
    kicker: 'BIENVENUE SUR DEK',
    line1: 'Ton coach t’attend,',
    line2: 'lance ton aventure',
    text: 'Un test d’initiation sans quota calibre ton niveau pour progresser sans te blesser.',
  },
  {
    image: '/images/banner-sante.jpg',
    position: '55% 45%',
    tint: '#00E5FF',
    kicker: '5 UNIVERS SPORTIFS',
    line1: 'Défis IA, terrains,',
    line2: 'une vraie équipe',
    text: 'Missions GPS à 05h00, duels caméra IA, Terrain du Jeudi, raids & pactes entre amis.',
  },
  {
    image: '/images/banner-coach.jpg',
    position: '40% 50%',
    tint: '#FF8A00',
    kicker: 'DISCIPLINE & PROGRESSION',
    line1: 'L’action est la',
    line2: 'clé du succès',
    text: 'Séances guidées, rangs de saison et classement : chaque effort compte.',
  },
];

export function OnboardingIntro({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  const go = (next: number) => {
    if (next < 0 || next >= SLIDES.length) return;
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#080A0E]">
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={index}
          custom={direction}
          initial={{ x: `${direction * 100}%`, opacity: 0.4 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: `${-direction * 35}%`, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 34 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.25}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60 || info.velocity.x < -400) go(index + 1);
            else if (info.offset.x > 60 || info.velocity.x > 400) go(index - 1);
          }}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
        >
          <CinematicImage src={slide.image} position={slide.position} tint={slide.tint} className="h-full w-full" intensity={1.4}>
            <div className="absolute inset-0 bg-gradient-to-t from-[#080A0E] via-[#080A0E]/55 to-black/10" />
          </CinematicImage>
        </motion.div>
      </AnimatePresence>

      {/* Logo + Passer */}
      <div className="safe-top relative z-10 flex items-center justify-between px-5 pt-4">
        <div className="font-hud flex h-10 w-10 items-center justify-center rounded-2xl bg-[#C8FF00] text-sm font-black tracking-tighter text-black">
          DEK
        </div>
        {!isLast && (
          <button onClick={onDone} className="rounded-full bg-black/40 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur">
            Passer
          </button>
        )}
      </div>

      {/* Texte */}
      <div className="pointer-events-none relative z-10 mt-auto px-6 pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          >
            <motion.span
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
              className="font-hud text-[10px] font-bold tracking-[0.3em]"
              style={{ color: slide.tint }}
            >
              {slide.kicker}
            </motion.span>
            <motion.h1
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              className="mt-2 text-[28px] font-light leading-tight text-white"
            >
              {slide.line1}
            </motion.h1>
            <motion.h1
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              className="font-hud text-[30px] font-bold leading-tight text-white"
            >
              {slide.line2}
            </motion.h1>
            <motion.p
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
              className="mt-2 max-w-[300px] text-[13px] leading-relaxed text-slate-300"
            >
              {slide.text}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Indicateurs + bouton */}
      <div className="safe-bottom relative z-10 flex items-center justify-between px-6 pb-8 pt-2">
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Étapes">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Écran ${i + 1}`}
              aria-selected={i === index}
              role="tab"
              className="h-2 rounded-full bg-white/25"
            >
              <motion.span
                className="block h-2 rounded-full"
                animate={{ width: i === index ? 28 : 8, backgroundColor: i === index ? '#C8FF00' : 'rgba(255,255,255,0.35)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            </button>
          ))}
        </div>
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => (isLast ? onDone() : go(index + 1))}
          className="font-hud flex items-center gap-2 rounded-full bg-[#C8FF00] px-5 py-3 text-xs font-bold text-black shadow-[0_10px_30px_-10px_#C8FF00]"
        >
          {isLast ? 'Commencer' : 'Suivant'}
          <ArrowRight weight="bold" className="h-4 w-4" />
        </motion.button>
      </div>
    </div>
  );
}
