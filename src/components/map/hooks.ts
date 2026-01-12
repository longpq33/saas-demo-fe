import { useState, useEffect, useLayoutEffect, type RefObject } from 'react';
import { GEOJSON_PATHS } from './constants';
import { cleanupLeafletMap } from './utils';
import { api, type Site } from '@/lib/api-client';

// ============================================================================
// Custom Hooks
// ============================================================================

/**
 * Hook to load GeoJSON data with fallback strategies
 */
export function useGeoJSONData(isMounted: boolean) {
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isMounted) return;

    const loadGeoData = async () => {
      try {
        // Fetch from public directory
        const response = await fetch(GEOJSON_PATHS.PUBLIC);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setGeoData(data as GeoJSON.FeatureCollection);
      } catch (fetchError) {
        const error = fetchError instanceof Error 
          ? fetchError 
          : new Error('Failed to load GeoJSON data');
        console.error('Error fetching GeoJSON:', error);
        setError(error);
      }
    };

    loadGeoData();
  }, [isMounted]);

  return { geoData, error };
}

/**
 * Hook to manage map container cleanup
 */
export function useMapContainerCleanup(
  containerRef: RefObject<HTMLDivElement | null>,
  shouldCleanup: boolean
) {
  // Cleanup before initialization
  useLayoutEffect(() => {
    if (shouldCleanup && containerRef.current) {
      cleanupLeafletMap(containerRef.current);
    }
  }, [containerRef, shouldCleanup]);

  // Cleanup on unmount
  useEffect(() => {
    const currentRef = containerRef.current;
    return () => {
      cleanupLeafletMap(currentRef);
    };
  }, [containerRef]);
}

/**
 * Hook to load sites data with meters
 */
export function useSitesData(isMounted: boolean) {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isMounted) return;

    const loadSites = async () => {
      try {
        setLoading(true);
        const data = await api.getSites();
        // Filter sites that have both latitude and longitude
        const sitesWithCoordinates = data.filter(
          (site) => site.latitude !== null && site.longitude !== null,
        );
        setSites(sitesWithCoordinates);
        setError(null);
      } catch (fetchError) {
        const error =
          fetchError instanceof Error
            ? fetchError
            : new Error('Failed to load sites data');
        console.error('Error fetching sites:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    loadSites();
  }, [isMounted]);

  return { sites, loading, error };
}

