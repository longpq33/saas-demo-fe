import L from 'leaflet';
import type { LeafletElement } from './constants';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Cleans up Leaflet map instance from a container element
 * This prevents "Map container is already initialized" errors
 */
export function cleanupLeafletMap(container: HTMLElement | null): void {
  if (!container) return;

  // Cleanup Leaflet container element
  const leafletContainer = container.querySelector('.leaflet-container') as LeafletElement | null;
  if (leafletContainer?._leaflet_id != null) {
    leafletContainer._leaflet_id = undefined;
  }

  // Cleanup container itself
  const containerElement = container as LeafletElement;
  if (containerElement._leaflet_id != null) {
    containerElement._leaflet_id = undefined;
  }
}

/**
 * Extracts coordinates from a coordinate array and extends bounds
 */
export function extendBoundsFromCoordinates(
  coordinates: number[][],
  bounds: L.LatLngBounds
): void {
  coordinates.forEach((coord) => {
    if (coord.length >= 2) {
      bounds.extend([coord[1] as number, coord[0] as number]);
    }
  });
}

/**
 * Calculates bounds from GeoJSON features
 */
export function calculateBoundsFromGeoJSON(
  features: GeoJSON.Feature[]
): L.LatLngBounds | null {
  const bounds = L.latLngBounds([]);

  for (const feature of features) {
    if (!feature.geometry?.type) continue;

    const { geometry } = feature;

    if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach((polygon) => {
        polygon.forEach((ring) => {
          extendBoundsFromCoordinates(ring, bounds);
        });
      });
    } else if (geometry.type === 'Polygon') {
      geometry.coordinates.forEach((ring) => {
        extendBoundsFromCoordinates(ring, bounds);
      });
    }
  }

  return bounds.isValid() ? bounds : null;
}

/**
 * Extracts province name from feature properties
 */
export function getProvinceName(properties: Record<string, unknown>): string {
  return (
    (properties?.name as string) ||
    (properties?.NAME_1 as string) ||
    (properties?.oldName as string) ||
    'Unknown Province'
  );
}

