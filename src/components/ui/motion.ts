import type { Transition, Variants } from 'framer-motion';

// Langage de mouvement DEK : ressorts nerveux, sorties rapides, cascades courtes.

export const SPRING_SNAPPY: Transition = { type: 'spring', stiffness: 420, damping: 32 };
export const SPRING_SOFT: Transition = { type: 'spring', stiffness: 260, damping: 28 };
export const SPRING_BOUNCY: Transition = { type: 'spring', stiffness: 520, damping: 18 };

/** Conteneur qui fait apparaître ses enfants en cascade. */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.04 } },
};

/** Élément qui monte en fondu (à utiliser dans un staggerContainer). */
export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: SPRING_SOFT },
};

/** Écran poussé depuis la droite (pages détail). */
export const pushScreen: Variants = {
  initial: { x: '100%' },
  animate: { x: 0, transition: { type: 'spring', stiffness: 380, damping: 38 } },
  exit: { x: '100%', transition: { duration: 0.22, ease: 'easeIn' } },
};

/** Écran qui monte du bas (lecteur, modales plein écran). */
export const riseScreen: Variants = {
  initial: { y: '100%', opacity: 0.6 },
  animate: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 320, damping: 34 } },
  exit: { y: '100%', opacity: 0.6, transition: { duration: 0.22, ease: 'easeIn' } },
};
