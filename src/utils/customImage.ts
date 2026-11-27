// Images choisies par l'utilisateur (photo de l'accueil, image d'un match créé) : redimensionnées sur l'appareil,
// gardées en local (aucun envoi sur Internet).

/** Lit une image, la réduit (largeur max) et la renvoie en JPEG (data URL). */
export async function fileToDataUrl(file: File, maxWidth = 1000, quality = 0.82): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Choisis un fichier image.');
  if (file.size > 12 * 1024 * 1024) throw new Error('Image trop lourde (12 Mo maximum).');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Image illisible.'));
      el.src = url;
    });
    const ratio = Math.min(1, maxWidth / img.naturalWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * ratio);
    canvas.height = Math.round(img.naturalHeight * ratio);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Traitement de l’image indisponible.');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ---- photo de l'écran d'accueil (rang de saison)
const HERO_KEY = 'dek_custom_hero_v1';
let heroCache: string | null | undefined;
const heroListeners = new Set<() => void>();

export function getHeroImage(): string | null {
  if (heroCache === undefined) {
    try {
      heroCache = window.localStorage.getItem(HERO_KEY);
    } catch {
      heroCache = null;
    }
  }
  return heroCache;
}

export function setHeroImage(dataUrl: string | null): void {
  heroCache = dataUrl;
  try {
    if (dataUrl) window.localStorage.setItem(HERO_KEY, dataUrl);
    else window.localStorage.removeItem(HERO_KEY);
  } catch {
    // stockage plein : la photo reste active jusqu'au rechargement
  }
  heroListeners.forEach((l) => l());
}

export function subscribeHeroImage(listener: () => void): () => void {
  heroListeners.add(listener);
  return () => {
    heroListeners.delete(listener);
  };
}
