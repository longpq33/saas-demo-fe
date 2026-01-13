/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { POWER_GRID_API, POLLING_INTERVAL } from './power-grid-constants';

// API base URL - use port 4000 for backend
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Tenant type is imported from @/lib/api-client

export interface PowerGridNode {
  id: string;
  name: string;
  code: string;
  type: 'SUBSTATION' | 'DISTRIBUTION_POINT' | 'LOAD' | 'OTHER';
  voltage: number;
  capacity: number;
  latitude: number;
  longitude: number;
  status: string;
  powerFactor: number;
  currentLoad?: number;
  currentVoltage?: number;
  currentCurrent?: number;
  currentPower?: number;
}

export interface PowerGridLine {
  id: string;
  name: string;
  fromNodeId: string;
  toNodeId: string;
  length: number;
  voltage: number;
  capacity: number;
  resistance: number;
  reactance: number;
  status: string;
  currentFlow?: number;
  powerLoss?: number;
  voltageDrop?: number;
  loadPercentage?: number; // % of capacity (can be > 100 for overload)
}

export interface PowerGridState {
  id: string;
  name: string;
  code: string;
  region: string;
  frequency: number;
  systemVoltage: number;
  nodes: PowerGridNode[];
  lines: PowerGridLine[];
  totalCapacity: number;
  currentLoad: number;
}

export interface PowerGridData {
  timestamp: string;
  gridId: string;
  nodes: Array<{
    nodeId: string;
    voltage: number;
    current: number;
    power: number;
    powerFactor: number;
  }>;
  lines: Array<{
    lineId: string;
    currentFlow: number;
    powerLoss: number;
    voltageDrop: number;
    loadPercentage?: number; // % of capacity (can be > 100 for overload)
  }>;
  gridMetrics: {
    totalGeneration: number;
    totalLoad: number;
    totalLoss: number;
    frequency: number;
    systemVoltage: number;
  };
}

/**
 * Hook to fetch and manage power grid state and real-time data
 * Grid state: shows all by default, filtered by siteId if provided
 * Real-time data: requires siteId
 */
export const usePowerGridData = (params?: { siteId?: string | null }) => {
  const { siteId } = params || {};
  const [gridState, setGridState] = useState<PowerGridState | null>(null);
  const [currentData, setCurrentData] = useState<PowerGridData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch grid state (structure) - uses siteId if provided, otherwise shows all
  const fetchGridState = useCallback(async () => {
    try {
      // Build URL - nếu có siteId thì thêm query param, không có thì gọi mặc định
      const url = siteId 
        ? `${API_BASE}${POWER_GRID_API.STATE}?siteId=${siteId}`
        : `${API_BASE}${POWER_GRID_API.STATE}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch grid state');
      }
      const data = await response.json();
      setGridState(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load grid state');
      console.error('Error fetching grid state:', err);
    }
  }, [siteId]);

  // Fetch current data (real-time values) - uses siteId if provided, otherwise shows all
  const fetchCurrentData = useCallback(async () => {
    try {
      // Build URL - nếu có siteId thì thêm query param, không có thì gọi mặc định
      const url = siteId 
        ? `${API_BASE}${POWER_GRID_API.DATA}?siteId=${siteId}`
        : `${API_BASE}${POWER_GRID_API.DATA}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch current data');
      }
      const data = await response.json();
      setCurrentData(data);
    } catch (err: any) {
      console.error('Error fetching current data:', err);
      // Don't set error state for polling failures - allow retry on next interval
    }
  }, [siteId]); // Depend on siteId để function re-create khi siteId thay đổi

  // Merge grid state with current data
  const mergedData = useCallback((): PowerGridState | null => {
    if (!gridState) return null;

    if (!currentData) return gridState;

    // Merge node data
    const mergedNodes = gridState.nodes.map((node) => {
      const currentNode = currentData.nodes.find((n) => n.nodeId === node.id);
      if (currentNode) {
        return {
          ...node,
          currentVoltage: currentNode.voltage,
          currentCurrent: currentNode.current,
          currentPower: currentNode.power,
          currentLoad: (currentNode.power / node.capacity) * 100,
        };
      }
      return node;
    });

    // Merge line data
    const mergedLines = gridState.lines.map((line) => {
      const currentLine = currentData.lines.find((l) => l.lineId === line.id);
      if (currentLine) {
        // Calculate load percentage if not provided
        const loadPercentage = currentLine.loadPercentage !== undefined
          ? currentLine.loadPercentage
          : (line.capacity > 0 && currentLine.currentFlow !== undefined)
            ? (currentLine.currentFlow / line.capacity) * 100
            : 0;
        
        return {
          ...line,
          currentFlow: currentLine.currentFlow,
          powerLoss: currentLine.powerLoss,
          voltageDrop: currentLine.voltageDrop,
          loadPercentage,
        };
      }
      return line;
    });

    return {
      ...gridState,
      nodes: mergedNodes,
      lines: mergedLines,
      currentLoad: currentData.gridMetrics.totalLoad,
    };
  }, [gridState, currentData]);

  // Initial load and reload when siteId changes
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setGridState(null); // Clear previous data
      setCurrentData(null);
      
      // Luôn fetch grid state (mặc định hoặc theo siteId)
      await fetchGridState();
      
      // Luôn fetch current data (mặc định hoặc theo siteId)
      await fetchCurrentData();
      
      setIsLoading(false);
    };

    loadData();
  }, [siteId, fetchGridState, fetchCurrentData]);

  // Polling for real-time data - always runs, uses siteId if provided
  useEffect(() => {
    // Setup polling interval - luôn chạy, không cần check siteId
    const intervalId = setInterval(() => {
      fetchCurrentData();
    }, POLLING_INTERVAL);

    return () => clearInterval(intervalId);
  }, [siteId, fetchCurrentData]); // Depend on cả siteId và fetchCurrentData

  return {
    gridState: mergedData(),
    isLoading,
    error,
    refetch: fetchGridState,
  };
};

/**
 * Hook to get node by ID from grid state
 */
export const useNodeById = (gridState: PowerGridState | null, nodeId: string) => {
  return gridState?.nodes.find((node) => node.id === nodeId);
};

// useTenants hook has been moved to @/lib/hooks for reuse across the application

