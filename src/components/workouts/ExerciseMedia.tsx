import type { ExerciseDef } from '../../data/workoutsData';

/**
 * Démo d'un exercice : vidéo en boucle (sans son) si disponible, sinon le GIF.
 * Les vidéos sont verticales (9:16) : on les montre en entier dans un cadre qui prend leur couleur
 * (affiche floutée en fond), au lieu de laisser des bandes noires qui ne vont pas avec l'image.
 *  - `still`  : simple affiche, pour les vignettes ;
 *  - `fill`   : remplit tout le cadre du lecteur (le parent doit être `relative`) ;
 *  - sinon    : cadre 4:5 pour les fiches d'exercice.
 */
export function ExerciseMedia({
  exercise,
  className = '',
  still = false,
  fill = false,
}: {
  exercise: ExerciseDef;
  className?: string;
  still?: boolean;
  fill?: boolean;
}) {
  if (exercise.video) {
    const poster = `/videos/exo/${exercise.video}.jpg`;
    if (still) return <img src={poster} alt="" loading="lazy" className={`h-full w-full object-cover object-[50%_58%] ${className}`} />;

    const video = (
      <video
        key={exercise.video}
        src={`/videos/exo/${exercise.video}.mp4`}
        poster={poster}
        aria-label={exercise.name}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className={`absolute inset-0 h-full w-full ${fill ? 'object-cover object-[50%_28%]' : 'object-contain'}`}
      />
    );
    if (fill) return <div className={`absolute inset-0 bg-black ${className}`}>{video}</div>;
    return (
      <div className={`relative aspect-[4/5] w-full overflow-hidden bg-black ${className}`}>
        <img src={poster} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-125 object-cover opacity-70 blur-2xl" />
        {video}
      </div>
    );
  }
  return (
    <img
      src={`/demos/${exercise.demo}.gif`}
      alt={exercise.name}
      loading={still ? 'lazy' : undefined}
      className={`${fill ? 'h-full w-full p-4 mix-blend-multiply' : 'mx-auto h-48'} object-contain ${className}`}
    />
  );
}
