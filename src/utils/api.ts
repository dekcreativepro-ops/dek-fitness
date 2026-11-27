// Adresse du serveur DEK (comptes, XP, paiements). Sans elle, l'app tourne en mode démo, sans compte.
export const API = (import.meta.env.VITE_PAYMENT_API_URL as string | undefined)?.replace(/\/$/, '');
