import { useState, type ReactNode } from 'react';

/**
 * Emplacement d'image 3D : affiche `/images/3d/<name>.jpg` dès que le fichier existe, sinon un visuel provisoire soigné
 * (dégradé aux couleurs de l'app + icône). Pour remplacer un provisoire, il suffit de déposer l'image au bon nom.
 */
export function Slot3D({
  name,
  icon,
  tone = 'dark',
  className = 'h-24 w-24',
  rounded = 'rounded-[20px]',
}: {
  name: string;
  icon: ReactNode;
  tone?: 'dark' | 'lime';
  className?: string;
  rounded?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!failed) {
    return (
      <img
        src={`/images/3d/${name}.jpg`}
        alt=""
        loading="lazy"
        draggable={false}
        onError={() => setFailed(true)}
        className={`${className} ${rounded} shrink-0 select-none object-cover`}
      />
    );
  }
  return (
    <span
      className={`${className} ${rounded} relative flex shrink-0 items-center justify-center overflow-hidden ${
        tone === 'lime' ? 'bg-lime text-on-lime' : 'bg-gradient-to-br from-[#26301A] via-[#1A1B1F] to-[#0E0F12] text-lime'
      }`}
      aria-hidden="true"
    >
      <span className={`absolute -right-3 -top-3 h-14 w-14 rounded-full ${tone === 'lime' ? 'bg-white/25' : 'bg-lime/10'}`} />
      <span className="relative [&>svg]:h-10 [&>svg]:w-10">{icon}</span>
    </span>
  );
}
