'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useMap, Marker, Popup, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { MAP_CONFIG, LOADING_STYLE, MARKER_CONFIG, POWER_GRID_CONFIG } from './constants';
import { calculateBoundsFromGeoJSON } from './utils';
import type { Site, PowerNode, PowerLine, PowerGrid } from '@/lib/api-client';
import type { PowerGridState } from './power-grid/power-grid-hooks';

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

// ============================================================================
// Power Grid Components
// ============================================================================

/**
 * Custom icon for power node markers
 */
function createPowerNodeIcon(nodeType: string, status: string) {
  const size = POWER_GRID_CONFIG.nodeSizes[nodeType as keyof typeof POWER_GRID_CONFIG.nodeSizes] || 20;
  const color = POWER_GRID_CONFIG.nodeColors[nodeType as keyof typeof POWER_GRID_CONFIG.nodeColors] || '#3388ff';
  const statusColor = POWER_GRID_CONFIG.statusColors[status as keyof typeof POWER_GRID_CONFIG.statusColors] || '#888888';
  
  return L.divIcon({
    className: 'custom-power-node-marker',
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid ${statusColor};
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: ${size * 0.4}px;
          height: ${size * 0.4}px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

/**
 * Component to render a single power node marker
 */
export function PowerNodeMarker({ node }: { node: PowerNode }) {
  const position: [number, number] = useMemo(() => {
    return [node.latitude, node.longitude];
  }, [node.latitude, node.longitude]);

  const icon = useMemo(() => createPowerNodeIcon(node.type, node.status), [node.type, node.status]);
  const markerRef = useRef<L.Marker | null>(null);

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
      <div style={{ minWidth: '250px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
          {node.name}
        </h3>
        <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: '13px' }}>
          <strong>Mã:</strong> {node.code}
        </p>
        <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: '13px' }}>
          <strong>Loại:</strong> {node.type}
        </p>
        <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: '13px' }}>
          <strong>Trạng thái:</strong> {node.status}
        </p>
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '13px' }}>
            <strong>Điện áp:</strong> {node.voltage} kV
          </p>
          <p style={{ margin: '0 0 4px 0', fontSize: '13px' }}>
            <strong>Công suất:</strong> {node.capacity} MW
          </p>
          {node.currentLoad !== undefined && (
            <p style={{ margin: '0 0 4px 0', fontSize: '13px' }}>
              <strong>Tải hiện tại:</strong> {node.currentLoad.toFixed(2)} MW
            </p>
          )}
          {node.currentVoltage !== undefined && (
            <p style={{ margin: '0 0 4px 0', fontSize: '13px' }}>
              <strong>Điện áp hiện tại:</strong> {(node.currentVoltage / 1000).toFixed(2)} kV
            </p>
          )}
          {node.currentPower !== undefined && (
            <p style={{ margin: '0 0 4px 0', fontSize: '13px' }}>
              <strong>Công suất hiện tại:</strong> {node.currentPower.toFixed(2)} MW
            </p>
          )}
          <p style={{ margin: '0 0 4px 0', fontSize: '13px' }}>
            <strong>Hệ số công suất:</strong> {node.powerFactor}
          </p>
        </div>
      </div>
    );
  }, [node]);

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
 * Component to render power lines connecting nodes
 */
export function PowerLinesLayer({ lines, nodes }: { lines: PowerLine[]; nodes: PowerNode[] }) {
  // Create a map of node IDs to coordinates
  const nodeMap = useMemo(() => {
    const map = new Map<string, [number, number]>();
    nodes.forEach((node) => {
      map.set(node.id, [node.latitude, node.longitude]);
    });
    return map;
  }, [nodes]);

  // Create line segments with coordinates
  const lineSegments = useMemo(() => {
    return lines
      .map((line) => {
        const fromCoords = nodeMap.get(line.fromNodeId);
        const toCoords = nodeMap.get(line.toNodeId);
        
        if (!fromCoords || !toCoords) {
          return null;
        }

        return {
          line,
          positions: [fromCoords, toCoords] as [number, number][],
        };
      })
      .filter((segment): segment is { line: PowerLine; positions: [number, number][] } => segment !== null);
  }, [lines, nodeMap]);

  const getLineColor = (line: PowerLine) => {
    // Calculate load percentage
    const loadPercentage = (line as any).loadPercentage !== undefined
      ? (line as any).loadPercentage
      : (line.capacity > 0 && line.currentFlow !== undefined)
        ? (line.currentFlow / line.capacity) * 100
        : 0;

    // Determine color based on load percentage (overload takes priority)
    if (loadPercentage > 100) {
      // Overload - red color
      return '#ef4444'; // red-500
    } else if (loadPercentage > 80) {
      // High load - orange color
      return '#f59e0b'; // amber-500
    } else {
      // Normal - use status-based color
      return POWER_GRID_CONFIG.lineColors[line.status as keyof typeof POWER_GRID_CONFIG.lineColors] || '#888888';
    }
  };

  const getLineWeight = (line: PowerLine) => {
    // Calculate load percentage
    const loadPercentage = (line as any).loadPercentage !== undefined
      ? (line as any).loadPercentage
      : (line.capacity > 0 && line.currentFlow !== undefined)
        ? (line.currentFlow / line.capacity) * 100
        : 0;

    // Base weight on voltage, increase if overloaded
    const baseWeight = line.voltage >= 200 ? 4 : line.voltage >= 100 ? 3 : 2;
    return loadPercentage > 100 ? baseWeight + 2 : baseWeight;
  };

  return (
    <>
      {lineSegments.map((segment) => {
        const loadPercentage = (segment.line as any).loadPercentage !== undefined
          ? (segment.line as any).loadPercentage
          : (segment.line.capacity > 0 && segment.line.currentFlow !== undefined)
            ? (segment.line.currentFlow / segment.line.capacity) * 100
            : 0;

        return (
          <Polyline
            key={segment.line.id}
            positions={segment.positions}
            pathOptions={{
              color: getLineColor(segment.line),
              weight: getLineWeight(segment.line),
              opacity: segment.line.status === 'ACTIVE' ? 0.8 : 0.4,
            }}
          >
          <Tooltip>
            <div style={{ minWidth: '200px' }}>
              <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>{segment.line.name}</p>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}>
                <strong>Trạng thái:</strong> {segment.line.status}
              </p>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}>
                <strong>Điện áp:</strong> {segment.line.voltage} kV
              </p>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}>
                <strong>Công suất:</strong> {segment.line.capacity} MW
              </p>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}>
                <strong>Chiều dài:</strong> {segment.line.length} km
              </p>
              {segment.line.currentFlow !== undefined && (
                <>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}>
                    <strong>Dòng hiện tại:</strong> {segment.line.currentFlow.toFixed(2)} MW
                  </p>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}>
                    <strong>Tải:</strong> <span style={{ 
                      color: loadPercentage > 100 ? '#ef4444' : loadPercentage > 80 ? '#f59e0b' : 'inherit',
                      fontWeight: loadPercentage > 100 ? 'bold' : 'normal'
                    }}>
                      {loadPercentage.toFixed(1)}%
                    </span>
                  </p>
                  {loadPercentage > 100 && (
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#ef4444', fontWeight: 'bold' }}>
                      ⚠️ Cảnh báo: Đường dây đang quá tải!
                    </p>
                  )}
                </>
              )}
            </div>
          </Tooltip>
        </Polyline>
        );
      })}
    </>
  );
}

/**
 * Component to render all power grid elements (lines and nodes)
 */
interface PowerGridLayerProps {
  grid: PowerGrid | PowerGridState | null;
}

export function PowerGridLayer({ grid }: PowerGridLayerProps) {
  const typedGrid = grid as PowerGridState | null;

  if (!typedGrid || !typedGrid.nodes || typedGrid.nodes.length === 0) {
    return null;
  }

  const nodes = typedGrid.nodes as unknown as PowerNode[];
  const lines = typedGrid.lines as unknown as PowerLine[];

  return (
    <>
      {/* Power Grid Nodes and Lines */}
      <PowerLinesLayer lines={lines} nodes={nodes} />
      {nodes.map((node) => (
        <PowerNodeMarker key={node.id} node={node} />
      ))}
      
      {/* Grid Metrics Panel */}
      <div className="leaflet-top leaflet-left" style={{ marginTop: '80px', marginLeft: '10px', zIndex: 1000 }}>
        <div className="leaflet-control">
          <GridMetricsPanel grid={grid as PowerGridState} />
        </div>
      </div>
    </>
  );
}

interface GridMetricsPanelProps {
  grid: PowerGridState;
}

function GridMetricsPanel({ 
  grid,
}: GridMetricsPanelProps) {
  const loadPercentage = ((grid.currentLoad || 0) / (grid.totalCapacity || 1)) * 100;

  return (
    <div className="bg-white p-3 rounded-lg shadow-lg" style={{ minWidth: '250px' }}>
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold text-sm">Lưới điện</h4>
      </div>

      {/* Grid Info */}
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">Tên:</span>
          <span className="font-medium">{grid.name || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Tổng công suất:</span>
          <span className="font-medium">{grid.totalCapacity || 0} MW</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Tải hiện tại:</span>
          <span className="font-medium">{(grid.currentLoad || 0).toFixed(2)} MW</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">% Tải:</span>
          <span className="font-medium">{loadPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(loadPercentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

