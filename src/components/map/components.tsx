'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useMap, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MAP_CONFIG, LOADING_STYLE, MARKER_CONFIG } from './constants';
import { calculateBoundsFromGeoJSON } from './utils';
import type { Site } from '@/lib/api-client';

// ============================================================================
// View Components
// ============================================================================

/**
 * Loading state component
 */
export function MapLoadingState({ message }: { message: string }) {
  return (
    <div style={LOADING_STYLE.container}>
      <div style={LOADING_STYLE.text}>
        {message.includes('</p>') ? (
          <div dangerouslySetInnerHTML={{ __html: message }} />
        ) : (
          <p>{message}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Component to fit map bounds to GeoJSON data
 */
export function MapBounds({ geoData }: { geoData: GeoJSON.FeatureCollection | null }) {
  const map = useMap();
  const hasFittedBounds = useRef(false);
  
  useEffect(() => {
    // Only fit bounds once when geoData is first loaded
    if (geoData?.features?.length && !hasFittedBounds.current) {
      const bounds = calculateBoundsFromGeoJSON(geoData.features);
      
      if (bounds) {
        map.fitBounds(bounds, { padding: MAP_CONFIG.BOUNDS_PADDING });
        hasFittedBounds.current = true;
      } else {
        map.setView(MAP_CONFIG.DEFAULT_CENTER, MAP_CONFIG.DEFAULT_ZOOM);
        hasFittedBounds.current = true;
      }
    } else if (!geoData && !hasFittedBounds.current) {
      map.setView(MAP_CONFIG.DEFAULT_CENTER, MAP_CONFIG.DEFAULT_ZOOM);
      hasFittedBounds.current = true;
    }
  }, [map, geoData]);
  
  return null;
}

/**
 * Custom icon for site markers
 */
function createSiteIcon(color: string = MARKER_CONFIG.colors.default) {
  return L.divIcon({
    className: 'custom-site-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        <div style="
          transform: rotate(45deg);
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          font-weight: bold;
        "></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
    popupAnchor: [0, -10],
  });
}

/**
 * Component to render a single site marker with hover popup
 */
export function SiteMarker({ site }: { site: Site }) {
  const position: [number, number] = useMemo(() => {
    return [site.latitude!, site.longitude!];
  }, [site.latitude, site.longitude]);

  const markerColor = useMemo(() => {
    const meterCount = site.meters?.length || 0;
    if (meterCount === 0) return MARKER_CONFIG.colors.default;
    if (meterCount === 1) return MARKER_CONFIG.colors.withMeters;
    return MARKER_CONFIG.colors.multipleMeters;
  }, [site.meters]);

  const icon = useMemo(() => createSiteIcon(markerColor), [markerColor]);
  const markerRef = useRef<L.Marker | null>(null);

  // Event handlers for hover
  const eventHandlers = useMemo(() => {
    return {
      mouseover: () => {
        if (markerRef.current) {
          markerRef.current.openPopup();
        }
      },
      mouseout: () => {
        if (markerRef.current) {
          markerRef.current.closePopup();
        }
      },
    };
  }, []);

  const popupContent = useMemo(() => {
    return (
      <div style={{ minWidth: '200px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
          {site.name}
        </h3>
        {site.type && (
          <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: '14px' }}>
            <strong>Loại:</strong> {site.type}
          </p>
        )}
        {site.address && (
          <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>
            <strong>Địa chỉ:</strong> {site.address}
          </p>
        )}
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold' }}>
            Đồng hồ ({site.meters?.length || 0}):
          </p>
          {site.meters && site.meters.length > 0 ? (
            <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '13px' }}>
              {site.meters.map((meter) => (
                <li key={meter.id} style={{ marginBottom: '4px' }}>
                  {meter.name}
                  {meter.type && <span style={{ color: '#999' }}> ({meter.type})</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: '0', color: '#999', fontSize: '13px' }}>
              Chưa có đồng hồ
            </p>
          )}
        </div>
      </div>
    );
  }, [site]);

  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={eventHandlers}
      ref={(ref) => {
        markerRef.current = ref;
      }}
    >
      <Popup closeOnClick={false} autoClose={false} closeOnEscapeKey={false}>
        {popupContent}
      </Popup>
    </Marker>
  );
}

/**
 * Component to render all site markers
 */
export function MetersMarkerGroup({ sites }: { sites: Site[] }) {
  return (
    <>
      {sites.map((site) => (
        <SiteMarker key={site.id} site={site} />
      ))}
    </>
  );
}

