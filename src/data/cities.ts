// Villes du Cameroun proposées sur la carte Outdoor et à l'inscription (toutes les régions).
// Le bouton GPS permet de se placer n'importe où dans le pays, même hors de cette liste.

export interface City {
  name: string;
  region: string;
  lat: number;
  lng: number;
}

export const CAMEROON_CITIES: City[] = [
  { name: 'Douala', region: 'Littoral', lat: 4.0511, lng: 9.7679 },
  { name: 'Edéa', region: 'Littoral', lat: 3.8, lng: 10.1333 },
  { name: 'Nkongsamba', region: 'Littoral', lat: 4.9547, lng: 9.9404 },
  { name: 'Yaoundé', region: 'Centre', lat: 3.848, lng: 11.5021 },
  { name: 'Mbalmayo', region: 'Centre', lat: 3.5167, lng: 11.5 },
  { name: 'Bafoussam', region: 'Ouest', lat: 5.4737, lng: 10.4179 },
  { name: 'Dschang', region: 'Ouest', lat: 5.4439, lng: 10.0533 },
  { name: 'Foumban', region: 'Ouest', lat: 5.7267, lng: 10.9019 },
  { name: 'Bafang', region: 'Ouest', lat: 5.15, lng: 10.1833 },
  { name: 'Bamenda', region: 'Nord-Ouest', lat: 5.9597, lng: 10.1459 },
  { name: 'Buea', region: 'Sud-Ouest', lat: 4.1527, lng: 9.241 },
  { name: 'Limbé', region: 'Sud-Ouest', lat: 4.0186, lng: 9.2144 },
  { name: 'Kumba', region: 'Sud-Ouest', lat: 4.6363, lng: 9.4469 },
  { name: 'Kribi', region: 'Sud', lat: 2.94, lng: 9.91 },
  { name: 'Ebolowa', region: 'Sud', lat: 2.9, lng: 11.15 },
  { name: 'Bertoua', region: 'Est', lat: 4.5772, lng: 13.6846 },
  { name: 'Batouri', region: 'Est', lat: 4.4333, lng: 14.3667 },
  { name: 'Ngaoundéré', region: 'Adamaoua', lat: 7.3167, lng: 13.5833 },
  { name: 'Meiganga', region: 'Adamaoua', lat: 6.5167, lng: 14.3 },
  { name: 'Garoua', region: 'Nord', lat: 9.3014, lng: 13.3977 },
  { name: 'Maroua', region: 'Extrême-Nord', lat: 10.591, lng: 14.3159 },
  { name: 'Kousséri', region: 'Extrême-Nord', lat: 12.0768, lng: 15.0306 },
  { name: 'Yagoua', region: 'Extrême-Nord', lat: 10.3392, lng: 15.2381 },
];

export const CAMEROON_REGIONS = Array.from(new Set(CAMEROON_CITIES.map((c) => c.region)));
