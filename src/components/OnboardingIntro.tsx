import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CinematicImage, Button } from './ui/kit';

// Carrousel d'accueil (3 écrans, glisser au pouce), avant la création de compte.
// Photo plein cadre sur ~62 % du haut, texte centré sur fond sombre en bas.

const SLIDES = [
  {
    image: '/images/ph/coach-card.jpg',
    position: '50% 40%',
    line1: 'Rencontre ton coach,',
    line2: 'commence ton aventure',
    text: 'Un test d’initiation sans quota calibre ton niveau pour progresser sans te blesser.',
  },
  {
    image: '/images/ph/friends-card.jpg',
    position: '50% 55%',
    line1: 'Défis IA, terrains,',
    line2: 'une vraie équipe',
    text: 'Missions GPS à 05h00, duels caméra IA, terrains collectifs, raids & pactes entre amis.',
  },
  {
    image: '/images/ph/dunk-card.jpg',
    position: '50% 45%',
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
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-ink">
      {/* Photo (glissable) */}
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
          <CinematicImage src={slide.image} position={slide.position} className="absolute inset-x-0 top-0 h-[62%]" intensity={1.2}>
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-black/25" />
          </CinematicImage>
        </motion.div>
      </AnimatePresence>

      {/* Marque + Passer */}
      <div className="safe-top relative z-10 flex items-center justify-between px-5 pt-4">
        <span className="text-[16px] font-extrabold tracking-tight text-white">DEK FITNESS</span>
        {!isLast && (
          <button onClick={onDone} className="rounded-full bg-black/40 px-3.5 py-1.5 text-[13px] font-semibold text-white/80 transition active:opacity-70">
            Passer
          </button>
        )}
      </div>

      {/* Zone sombre du bas */}
      <div className="pointer-events-none relative z-10 mt-auto flex h-[38%] flex-col items-center px-6 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
            className="flex flex-col items-center"
          >
            <motion.h1
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
              className="text-[26px] font-normal leading-8 text-fg"
            >
              {slide.line1}
            </motion.h1>
            <motion.h1
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
              className="text-[26px] font-extrabold leading-8 text-fg"
            >
              {slide.line2}
            </motion.h1>
            <motion.p
              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
              className="mt-3 max-w-[300px] text-[14px] font-medium leading-5 text-mute"
            >
              {slide.text}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Indicateur + bouton */}
      <div className="safe-bottom relative z-10 flex flex-col items-center gap-5 px-6 pb-8 pt-1">
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Étapes">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Écran ${i + 1}`}
              aria-selected={i === index}
              role="tab"
              className="flex h-4 items-center"
            >
              <motion.span
                className={`block h-1.5 rounded-full ${i === index ? 'bg-lime' : 'bg-rim'}`}
                animate={{ width: i === index ? 28 : 8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            </button>
          ))}
        </div>
        {isLast ? (
          <Button trailingArrow onClick={onDone} className="min-w-[200px]">
            Commencer
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => go(index + 1)} className="min-w-[200px]">
            Suivant
          </Button>
        )}
      </div>
    </div>
  );
}
