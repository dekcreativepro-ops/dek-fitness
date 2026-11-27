import type { ExerciseDef } from '../../data/workoutsData';

/** Démo d'un exercice : vidéo en boucle (sans son) si disponible, sinon le GIF. `still` = simple affiche (vignettes). */
export function ExerciseMedia({
  exercise,
  className = '',
  still = false,
  fill = false,
}: {
  exercise: ExerciseDef;
  className?: string;
  still?: boolean;
  /** true : remplit le cadre (lecteur) ; false : hauteur libre, centré (fiche) */
  fill?: boolean;
}) {
  if (exercise.video) {
    const poster = `/videos/exo/${exercise.video}.jpg`;
    if (still) return <img src={poster} alt="" loading="lazy" className={`h-full w-full object-cover ${className}`} />;
    return (
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
        className={`${fill ? 'h-full w-full' : 'mx-auto h-72'} bg-black object-contain ${className}`}
      />
    );
  }
  return <img src={`/demos/${exercise.demo}.gif`} alt={exercise.name} loading={still ? 'lazy' : undefined} className={`${fill ? 'h-full w-full p-4 mix-blend-multiply' : 'mx-auto h-48'} object-contain ${className}`} />;
}
