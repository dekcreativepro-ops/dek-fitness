// Portraits 3D des coachs (public/images/3d). Sans portrait, l'app garde l'avatar du profil.
const PORTRAITS: Record<string, string> = {
  c1: '/images/3d/coach-ibrahim.jpg',
  c2: '/images/3d/coach-melissa.jpg',
  c3: '/images/3d/coach-yannick.jpg',
};

export const coachPortrait = (id: string): string | undefined => PORTRAITS[id];
