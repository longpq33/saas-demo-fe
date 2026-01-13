// ============================================================================
// Constants
// ============================================================================

export const MAP_CONFIG = {
  DEFAULT_CENTER: [14.0583, 108.2772] as [number, number],
  DEFAULT_ZOOM: 6,
  MIN_ZOOM: 5,
  MAX_ZOOM: 10,
  HEIGHT: '650px',
  BOUNDS_PADDING: [50, 50] as [number, number],
} as const;

export const GEOJSON_PATHS = {
  IMPORT: '@/app/map/vn_geo.json',
  PUBLIC: '/vn_geo.json',
} as const;

export const PROVINCE_STYLE = {
  fillColor: '#0D542B',
  fillOpacity: 0.3,
  color: '#0D542B',
  weight: 1,
  opacity: 0.8,
} as const;

export const LOADING_STYLE = {
  container: {
    height: MAP_CONFIG.HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    backgroundColor: '#fafafa',
  },
  text: {
    textAlign: 'center' as const,
    color: '#999',
  },
} as const;

export const MARKER_CONFIG = {
  iconSize: [25, 41] as [number, number],
  iconAnchor: [12, 41] as [number, number],
  popupAnchor: [0, -41] as [number, number],
  colors: {
    default: '#3388ff',
    withMeters: '#ff6b6b',
    multipleMeters: '#4ecdc4',
  },
} as const;

export const POWER_GRID_CONFIG = {
  nodeColors: {
    SUBSTATION: '#FF4444',
    DISTRIBUTION_POINT: '#4488FF',
    LOAD: '#FFAA00',
    TRANSFORMER: '#8844FF',
  },
  nodeSizes: {
    SUBSTATION: 24,
    DISTRIBUTION_POINT: 20,
    LOAD: 16,
    TRANSFORMER: 22,
  },
  lineColors: {
    ACTIVE: '#00AA00',
    INACTIVE: '#888888',
    FAULT: '#FF0000',
  },
  statusColors: {
    ACTIVE: '#00AA00',
    INACTIVE: '#888888',
    MAINTENANCE: '#FFAA00',
  },
} as const;

// ============================================================================
// Types
// ============================================================================

export type LeafletElement = HTMLElement & { _leaflet_id?: number };

