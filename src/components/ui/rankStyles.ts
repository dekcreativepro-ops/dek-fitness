// Couleurs des insignes de rang de saison (sobres : `glow` est conservé pour compatibilité).

export const RANK_STYLES: Record<string, { color: string; glow: string; level: number }> = {
  Recrue: { color: '#A1A1AA', glow: '#A1A1AA', level: 1 },
  Challenger: { color: '#5BD6FF', glow: '#5BD6FF', level: 2 },
  Pro: { color: '#C8FF00', glow: '#C8FF00', level: 3 },
  Élite: { color: '#FF9F45', glow: '#FF9F45', level: 4 },
  'Légende DEK': { color: '#FF4D5E', glow: '#F5C542', level: 5 },
};
