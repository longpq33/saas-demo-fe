import type { LatLngBoundsExpression } from 'leaflet';

// Node type colors
export const NODE_TYPE_COLORS = {
  SUBSTATION: '#dc2626', // red-600
  DISTRIBUTION_POINT: '#2563eb', // blue-600
  LOAD: '#f59e0b', // amber-500
  OTHER: '#6b7280', // gray-500
} as const;

// Node type labels
export const NODE_TYPE_LABELS = {
  SUBSTATION: 'Trạm biến áp',
  DISTRIBUTION_POINT: 'Điểm phân phối',
  LOAD: 'Trung tâm tải',
  OTHER: 'Khác',
} as const;

// Voltage level colors for transmission lines
export const VOLTAGE_COLORS = {
  220: '#dc2626', // red-600 - High voltage
  110: '#2563eb', // blue-600 - Medium voltage
  22: '#f59e0b', // amber-500 - Low voltage
  DEFAULT: '#6b7280', // gray-500
} as const;

// Line width by voltage level
export const VOLTAGE_LINE_WIDTHS = {
  220: 4,
  110: 3,
  22: 2,
  DEFAULT: 2,
} as const;

// Map configuration
export const POWER_GRID_MAP_CONFIG = {
  center: [16.0, 106.0] as [number, number],
  zoom: 6,
  minZoom: 5,
  maxZoom: 18,
} as const;

// Vietnam bounds for map
export const VIETNAM_BOUNDS: LatLngBoundsExpression = [
  [8.0, 102.0], // Southwest
  [24.0, 110.0], // Northeast
];

// Marker size by capacity (MW)
export const getMarkerSize = (capacity: number): number => {
  if (capacity >= 1500) return 16;
  if (capacity >= 1000) return 14;
  if (capacity >= 500) return 12;
  return 10;
};

// Get line color by voltage
export const getLineColor = (voltage: number): string => {
  if (voltage >= 200) return VOLTAGE_COLORS[220];
  if (voltage >= 100) return VOLTAGE_COLORS[110];
  if (voltage >= 20) return VOLTAGE_COLORS[22];
  return VOLTAGE_COLORS.DEFAULT;
};

// Get line width by voltage
export const getLineWidth = (voltage: number): number => {
  if (voltage >= 200) return VOLTAGE_LINE_WIDTHS[220];
  if (voltage >= 100) return VOLTAGE_LINE_WIDTHS[110];
  if (voltage >= 20) return VOLTAGE_LINE_WIDTHS[22];
  return VOLTAGE_LINE_WIDTHS.DEFAULT;
};

// Status colors
export const STATUS_COLORS = {
  ACTIVE: '#10b981', // green-500
  INACTIVE: '#6b7280', // gray-500
  ERROR: '#ef4444', // red-500
  MAINTENANCE: '#f59e0b', // amber-500
} as const;

// Polling interval for real-time data (ms)
export const POLLING_INTERVAL = 5000; // 5 seconds

// API endpoints
export const POWER_GRID_API = {
  STATE: '/api/power-grid/state',
  DATA: '/api/power-grid/data',
  STATUS: '/api/power-grid/status',
} as const;

