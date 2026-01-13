/* eslint-disable react-hooks/preserve-manual-memoization */
'use client';

import { useState, useMemo, useRef } from 'react';
import { MapContainer, GeoJSON } from 'react-leaflet';
import type { Feature } from 'geojson';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './map.css';
import { MAP_CONFIG, PROVINCE_STYLE } from './constants';
import { useGeoJSONData, useMapContainerCleanup } from './hooks';
import { MapLoadingState, MapBounds } from './components';
import { getProvinceName } from './utils';
import './leaflet-setup';
export default function VietnamProvincesMap({
  children,
  disableHover = false,
}: {
  children: React.ReactNode;
  disableHover?: boolean;
}) {
  const [isMounted] = useState(() => typeof window !== 'undefined');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  const { geoData } = useGeoJSONData(isMounted);
  
  // Derive render state from data availability - no need for separate state
  const shouldRenderMap = useMemo(() => {
    return isMounted && geoData !== null;
  }, [isMounted, geoData]);
  
  useMapContainerCleanup(mapContainerRef, shouldRenderMap);

  // Style function - stable reference
  const getStyle = useMemo(() => {
    return () => PROVINCE_STYLE;
  }, []);

  // Hover style - highlight province on hover
  const hoverStyle = useMemo(() => {
    return {
      ...PROVINCE_STYLE,
      fillOpacity: 0.5,
      weight: 1,
      color: '#0D542B',
    };
  }, []);

  // Event handlers - stable reference
  // Nếu disableHover=true, return empty function để không bind tooltip/hover
  const onEachFeature = useMemo(() => {
    if (disableHover) {
      // Return empty function - không làm gì cả
      return () => {};
    }

    return (feature: Feature, layer: L.Layer) => {
      const provinceName = getProvinceName(feature.properties || {});
      
      // Bind tooltip to show province name on hover
      layer.bindTooltip(provinceName, {
        permanent: false,
        direction: 'center',
        className: 'province-tooltip',
      });

      // Add hover effects
      layer.on({
        mouseover: (e) => {
          const layer = e.target;
          layer.setStyle(hoverStyle);
          layer.bringToFront();
        },
        mouseout: (e) => {
          const layer = e.target;
          layer.setStyle(PROVINCE_STYLE);
        },
      });
    };
  }, [hoverStyle, disableHover]);

  if (!isMounted) {
    return <MapLoadingState message="Đang tải bản đồ..." />;
  }

  if (!shouldRenderMap) {
    return (
      <MapLoadingState 
        message='<p style="font-size: 16px; margin-bottom: 8px;">Đang tải dữ liệu bản đồ...</p>'
      />
    );
  }

  return (
      <MapContainer
        key="vietnam-provinces-map-singleton"
        center={MAP_CONFIG.DEFAULT_CENTER}
        zoom={MAP_CONFIG.DEFAULT_ZOOM}
        style={{ 
          height: 650, 
          width: '100%', 
          background: "#fff", 
        }}
        dragging={true}
        touchZoom={true}
        doubleClickZoom={true}
        boxZoom={true}
        keyboard={true}
        minZoom={MAP_CONFIG.MIN_ZOOM}
        maxZoom={MAP_CONFIG.MAX_ZOOM}
        scrollWheelZoom={true}
        preferCanvas={true}
        attributionControl={false}
      >
        <MapBounds geoData={geoData} />
        {geoData && (
          <GeoJSON
            data={geoData}
            style={getStyle}
            onEachFeature={onEachFeature}
            interactive={!disableHover}
          />
        )}
        {children}
      </MapContainer>
  );
}

