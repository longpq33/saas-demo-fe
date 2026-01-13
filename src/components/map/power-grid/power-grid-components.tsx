'use client';

import { memo, useState, useRef, useEffect } from 'react';
import { Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import type { PowerGridNode, PowerGridLine, PowerGridState } from './power-grid-hooks';
import {
  NODE_TYPE_COLORS,
  NODE_TYPE_LABELS,
  getMarkerSize,
  getLineColor,
  getLineWidth,
  STATUS_COLORS,
} from './power-grid-constants';

interface NodeMarkerProps {
  node: PowerGridNode;
}

/**
 * Marker component for power grid node
 */
export const NodeMarker = memo(({ node }: NodeMarkerProps) => {
  const color = NODE_TYPE_COLORS[node.type] || NODE_TYPE_COLORS.OTHER;
  const size = getMarkerSize(node.capacity);
  const statusColor = STATUS_COLORS[node.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.ACTIVE;

  const icon = divIcon({
    className: 'custom-power-node-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 2px solid ${statusColor};
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: ${size * 0.6}px;
        font-weight: bold;
      ">
        ⚡
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

  return (
    <Marker position={[node.latitude, node.longitude]} icon={icon}>
      <Popup maxWidth={300}>
        <div className="p-2">
          <h3 className="font-bold text-lg mb-2">{node.name}</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Mã:</span>
              <span className="font-medium">{node.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Loại:</span>
              <span className="font-medium">{NODE_TYPE_LABELS[node.type]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Điện áp:</span>
              <span className="font-medium">{node.voltage} kV</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Công suất:</span>
              <span className="font-medium">{node.capacity} MW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Trạng thái:</span>
              <span 
                className="font-medium px-2 py-0.5 rounded text-xs"
                style={{ 
                  backgroundColor: statusColor + '20',
                  color: statusColor
                }}
              >
                {node.status}
              </span>
            </div>
            
            {node.currentPower !== undefined && (
              <>
                <hr className="my-2" />
                <div className="text-xs text-gray-500 font-semibold mb-1">Real-time Data:</div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Điện áp hiện tại:</span>
                  <span className="font-medium">{(node.currentVoltage! / 1000).toFixed(1)} kV</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Công suất hiện tại:</span>
                  <span className="font-medium">{node.currentPower.toFixed(2)} MW</span>
                </div>
                {node.currentLoad !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tải:</span>
                    <span className="font-medium">{node.currentLoad.toFixed(1)}%</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Hệ số công suất:</span>
                  <span className="font-medium">{node.powerFactor.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
});

NodeMarker.displayName = 'NodeMarker';

interface TransmissionLineProps {
  line: PowerGridLine;
  fromNode: PowerGridNode;
  toNode: PowerGridNode;
}

/**
 * Polyline component for transmission line
 */
export const TransmissionLine = memo(({ line, fromNode, toNode }: TransmissionLineProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const popupRef = useRef<L.Popup | null>(null);
  const map = useMap();

  // Calculate load percentage
  const loadPercentage = line.loadPercentage !== undefined
    ? line.loadPercentage
    : (line.capacity > 0 && line.currentFlow !== undefined)
      ? (line.currentFlow / line.capacity) * 100
      : 0;

  // Determine line color based on load
  let color = getLineColor(line.voltage);
  if (loadPercentage > 100) {
    // Overload - red color
    color = '#ef4444'; // red-500
  } else if (loadPercentage > 80) {
    // High load - orange color
    color = '#f59e0b'; // amber-500
  }

  // Increase weight if overloaded for better visibility
  const baseWeight = getLineWidth(line.voltage);
  const weight = loadPercentage > 100 ? baseWeight + 2 : baseWeight;
  const opacity = line.status === 'ACTIVE' ? 0.7 : 0.3;

  const positions: [number, number][] = [
    [fromNode.latitude, fromNode.longitude],
    [toNode.latitude, toNode.longitude],
  ];

  // Calculate midpoint for popup position
  const midpoint: [number, number] = [
    (fromNode.latitude + toNode.latitude) / 2,
    (fromNode.longitude + toNode.longitude) / 2,
  ];

  const statusColor = STATUS_COLORS[line.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.ACTIVE;

  // Control popup open/close based on hover state
  useEffect(() => {
    const popup = popupRef.current;
    if (!popup) return;

    if (isHovered) {
      popup.openOn(map);
    } else {
      popup.close();
    }
  }, [isHovered, map]);

  return (
    <>
      <Polyline
        positions={positions}
        color={color}
        weight={weight}
        opacity={opacity}
        dashArray={line.status === 'ACTIVE' ? undefined : '10, 10'}
        eventHandlers={{
          mouseover: () => setIsHovered(true),
          mouseout: () => setIsHovered(false),
        }}
      >
        <Tooltip direction="center" permanent={false}>
          <div className="text-xs">
            <div className="font-bold mb-1">{line.name}</div>
            <div>Điện áp: {line.voltage} kV</div>
            <div>Chiều dài: {line.length} km</div>
            <div>Công suất: {line.capacity} MW</div>
            {line.currentFlow !== undefined && (
              <>
                <hr className="my-1" />
                <div className="text-gray-600">Dòng điện: {line.currentFlow.toFixed(2)} A</div>
                <div className="text-gray-600">Tổn thất: {line.powerLoss?.toFixed(2)} MW</div>
                <div className="text-gray-600">Sụt áp: {line.voltageDrop?.toFixed(2)} V</div>
              </>
            )}
          </div>
        </Tooltip>
      </Polyline>

      {/* Marker với Popup invisible ở midpoint để hiển thị popup khi hover */}
      <Marker
        position={midpoint}
        icon={divIcon({
          className: 'invisible-marker',
          html: '',
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        })}
        interactive={false}
      >
        <Popup
          ref={popupRef}
          maxWidth={350}
          closeButton={false}
          autoPan={false}
          className="line-popup"
        >
            <div className="p-3">
              <h3 className="font-bold text-lg mb-2">{line.name}</h3>
              
              {/* Basic Info */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Từ:</span>
                  <span className="font-medium">{fromNode.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Đến:</span>
                  <span className="font-medium">{toNode.name}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between">
                  <span className="text-gray-600">Điện áp:</span>
                  <span className="font-medium">{line.voltage} kV</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Chiều dài:</span>
                  <span className="font-medium">{line.length} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Công suất:</span>
                  <span className="font-medium">{line.capacity} MW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Điện trở:</span>
                  <span className="font-medium">{line.resistance.toFixed(4)} Ω</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Điện kháng:</span>
                  <span className="font-medium">{line.reactance.toFixed(4)} Ω</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trạng thái:</span>
                  <span 
                    className="font-medium px-2 py-0.5 rounded text-xs"
                    style={{ 
                      backgroundColor: statusColor + '20',
                      color: statusColor
                    }}
                  >
                    {line.status}
                  </span>
                </div>
                
                {/* Real-time Data */}
                {line.currentFlow !== undefined && (
                  <>
                    <hr className="my-2" />
                    <div className="text-xs text-gray-500 font-semibold mb-1">Real-time Data:</div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dòng điện:</span>
                      <span className="font-medium">{line.currentFlow.toFixed(2)} A</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tải:</span>
                      <span className={`font-medium ${loadPercentage > 100 ? 'text-red-600 font-bold' : loadPercentage > 80 ? 'text-amber-600' : ''}`}>
                        {loadPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tổn thất:</span>
                      <span className="font-medium">{line.powerLoss?.toFixed(2)} MW</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sụt áp:</span>
                      <span className="font-medium">{line.voltageDrop?.toFixed(2)} V</span>
                    </div>
                    {loadPercentage > 100 && (
                      <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700">
                        ⚠️ <strong>Cảnh báo:</strong> Đường dây đang quá tải! ({loadPercentage.toFixed(1)}%)
                      </div>
                    )}
                    {loadPercentage > 80 && loadPercentage <= 100 && (
                      <div className="mt-2 p-2 bg-amber-100 border border-amber-300 rounded text-xs text-amber-700">
                        ⚠️ Tải cao: {loadPercentage.toFixed(1)}%
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </Popup>
      </Marker>
    </>
  );
});

TransmissionLine.displayName = 'TransmissionLine';

interface PowerGridLegendProps {
  className?: string;
}

/**
 * Legend component for power grid map
 */
export const PowerGridLegend = memo(({ className = '' }: PowerGridLegendProps) => {
  return (
    <div className={`bg-white p-3 rounded-lg shadow-lg ${className}`}>
      <h4 className="font-bold text-sm mb-2">Chú thích</h4>
      
      <div className="space-y-2">
        <div>
          <div className="text-xs font-semibold mb-1 text-gray-600">Loại trạm:</div>
          <div className="space-y-1">
            {Object.entries(NODE_TYPE_LABELS).map(([type, label]) => (
              <div key={type} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: NODE_TYPE_COLORS[type as keyof typeof NODE_TYPE_COLORS] }}
                />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold mb-1 text-gray-600">Điện áp đường dây:</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-1 bg-red-600" />
              <span>220 kV</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-0.5 bg-blue-600" />
              <span>110 kV</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-0.5 bg-amber-500" />
              <span>22 kV</span>
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold mb-1 text-gray-600">Trạng thái:</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full border-2 border-green-500" />
              <span>Hoạt động</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full border-2 border-gray-500" />
              <span>Không hoạt động</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

PowerGridLegend.displayName = 'PowerGridLegend';

interface GridMetricsProps {
  gridState: PowerGridState;
  onTenantChange: (tenantId: string | null) => void;
  className?: string;
}

/**
 * Display current grid metrics with tenant selector
 */
export const GridMetrics = memo(({ 
  gridState, 
  className = '' 
}: GridMetricsProps) => {
  const loadPercentage = (gridState.currentLoad / gridState.totalCapacity) * 100;

  return (
    <div className={`bg-white p-3 rounded-lg shadow-lg ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold text-sm">Lưới điện</h4>
      </div>
      
    
      {/* Grid Info */}
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">Tên:</span>
          <span className="font-medium">{gridState.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Khu vực:</span>
          <span className="font-medium">{gridState.region}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Tần số:</span>
          <span className="font-medium">{gridState.frequency} Hz</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Tổng công suất:</span>
          <span className="font-medium">{gridState.totalCapacity} MW</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Tải hiện tại:</span>
          <span className="font-medium">{gridState.currentLoad.toFixed(2)} MW</span>
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
});

GridMetrics.displayName = 'GridMetrics';

