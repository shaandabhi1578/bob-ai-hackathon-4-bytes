// Local configuration: Loaded exclusively from local files / environment
// Protected internal API key — not exposed or editable from client website UI
export const MAPTILER_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MAPTILER_API_KEY) ||
  'HyXVqJnMIuJHHLYHn58T';

export interface TileLayerDefinition {
  id: string;
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
}

export function getTileLayers(): TileLayerDefinition[] {
  const key = MAPTILER_API_KEY;

  return [
    {
      id: 'maptiler-dark',
      name: 'MapTiler SCADA Night Vision (Default)',
      url: `https://api.maptiler.com/maps/dataviz-dark/{z}/{x}/{y}.png?key=${key}`,
      attribution: '© MapTiler © OpenStreetMap contributors',
      maxZoom: 19,
    },
    {
      id: 'maptiler-topo',
      name: 'MapTiler Power Terrain (Topo)',
      url: `https://api.maptiler.com/maps/topo-v2/{z}/{x}/{y}.png?key=${key}`,
      attribution: '© MapTiler © OpenStreetMap contributors',
      maxZoom: 19,
    },
    {
      id: 'maptiler-satellite',
      name: 'MapTiler HD Satellite Aerial',
      url: `https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${key}`,
      attribution: '© MapTiler © OpenStreetMap contributors',
      maxZoom: 19,
    },
    {
      id: 'maptiler-streets',
      name: 'MapTiler City Feeder Grid',
      url: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${key}`,
      attribution: '© MapTiler © OpenStreetMap contributors',
      maxZoom: 19,
    },
    {
      id: 'carto-light',
      name: 'SCADA Control Room (Light)',
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '© OpenStreetMap contributors © CARTO',
      maxZoom: 19,
    },
    {
      id: 'carto-dark',
      name: 'CartoDB Dark Matter',
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '© OpenStreetMap contributors © CARTO',
      maxZoom: 19,
    },
    {
      id: 'osm',
      name: 'OpenStreetMap Standard',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    },
  ];
}
