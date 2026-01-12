import L from 'leaflet';

// ============================================================================
// Leaflet Icon Setup
// ============================================================================

/**
 * Sets up Leaflet default icon configuration for Next.js
 * This fixes the issue where default markers don't display in Next.js
 */
export function setupLeafletIcons(): void {
  if (typeof window === 'undefined') return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

// Initialize on import
setupLeafletIcons();

