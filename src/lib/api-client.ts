const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
  ) {
    super(message);
  }
}

export type UserRole = 'system_admin' | 'customer_admin' | 'operator';

export type TenantStatus = 'ACTIVE' | 'INACTIVE';

export type AlertLevel = 'info' | 'warn' | 'critical';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
  tenantName?: string | null;
};

export type Tenant = {
  id: string;
  name: string;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
  users?: Array<{
    id: string;
    email: string;
    role: UserRole;
    tenantId: string | null;
  }>;
  sites?: Array<{
    id: string;
    name: string;
  }>;
  _count?: {
    sites: number;
    users: number;
  };
};

export type Site = {
  id: string;
  name: string;
  type: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  meters?: Array<{
    id: string;
    name: string;
    type: string | null;
  }>;
};

export type Meter = {
  id: string;
  name: string;
  type: string | null;
  unit: string | null;
  siteId: string;
  createdAt: string;
  updatedAt: string;
  site?: {
    id: string;
    name: string;
  };
};

export type Reading = {
  id: string;
  meterId: string;
  timestamp: string;
  value: number;
  createdAt: string;
};

export type Alert = {
  id: string;
  siteId: string;
  message: string;
  level: AlertLevel;
  createdAt: string;
  site?: {
    id: string;
    name: string;
    tenantId: string;
  };
};

export type PredictiveAlert = {
  id: string;
  siteId: string;
  message: string;
  level: AlertLevel;
  predictedDate: string;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  expectedValue: number;
  createdAt: string;
  expiresAt: string;
  site?: {
    id: string;
    name: string;
    tenantId: string;
    tenant?: {
      id: string;
      name: string;
    };
  };
};

// Power Grid Types
export type NodeType =
  | 'SUBSTATION'
  | 'TRANSFORMER'
  | 'DISTRIBUTION_POINT'
  | 'LOAD';

export type LineStatus = 'ACTIVE' | 'INACTIVE' | 'FAULT';
export type NodeStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type SimulationStatus = 'STOPPED' | 'RUNNING' | 'PAUSED';

export type PowerNode = {
  id: string;
  name: string;
  code: string;
  type: NodeType;
  voltage: number; // kV
  capacity: number; // MW
  latitude: number;
  longitude: number;
  status: NodeStatus;
  currentLoad: number; // MW
  powerFactor: number; // 0.8 - 1.0
  currentVoltage?: number; // V
  currentCurrent?: number; // A
  currentPower?: number; // MW
};

export type PowerLine = {
  id: string;
  name: string;
  fromNodeId: string;
  toNodeId: string;
  length: number; // km
  voltage: number; // kV
  capacity: number; // MW
  resistance: number; // Ohm/km
  reactance: number; // Ohm/km
  status: LineStatus;
  currentFlow?: number; // MW
  powerLoss?: number; // MW
  voltageDrop?: number; // V
};

export type PowerGrid = {
  id: string;
  name: string;
  code: string;
  region: string;
  nodes: PowerNode[];
  lines: PowerLine[];
  totalCapacity: number; // MW
  currentLoad: number; // MW
  frequency: number; // Hz
  systemVoltage: number; // V
};

export type NodeData = {
  nodeId: string;
  voltage: number; // V
  current: number; // A
  power: number; // MW
  powerFactor: number;
};

export type LineData = {
  lineId: string;
  currentFlow: number; // MW
  powerLoss: number; // MW
  voltageDrop: number; // V
};

export type GridMetrics = {
  totalGeneration: number; // MW
  totalLoad: number; // MW
  totalLoss: number; // MW
  frequency: number; // Hz
  systemVoltage: number; // V
};

export type PowerData = {
  timestamp: string; // ISO 8601
  gridId: string;
  nodes: NodeData[];
  lines: LineData[];
  gridMetrics: GridMetrics;
};

export type SeriesPoint = {
  date: string;
  value: number;
};

export type TenantDashboard = {
  totalByDay: SeriesPoint[];
  topSites: Array<{
    siteId: string;
    siteName: string;
    value: number;
  }>;
  siteCount: number;
  meterCount: number;
};

export type SiteDashboard = {
  site: {
    id: string;
    name: string;
  };
  meters: Array<{
    id: string;
    name: string;
    type: string | null;
    unit: string | null;
    series: SeriesPoint[];
  }>;
};

export type CreateTenantDto = {
  name: string;
  adminEmail: string;
  adminPassword: string;
  status?: TenantStatus;
};

export type UpdateTenantDto = {
  name?: string;
  status?: TenantStatus;
};

export type CreateSiteDto = {
  name: string;
  type?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  tenantId?: string;
};

export type UpdateSiteDto = {
  name?: string;
  type?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

export type CreateMeterDto = {
  name: string;
  type?: string;
  unit?: string;
  siteId: string;
};

export type UpdateMeterDto = {
  name?: string;
  type?: string;
  unit?: string;
};

export type CreateReadingDto = {
  meterId: string;
  timestamp: string;
  value: number;
};

export type UpdateReadingDto = {
  timestamp?: string;
  value?: number;
};

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(response.status, error.message || response.statusText);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiRequest<{ token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    apiRequest<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
    }),

  getMe: () => apiRequest<AuthUser>('/api/auth/me'),

  // Tenants
  getTenants: () => apiRequest<Tenant[]>('/api/tenants'),
  getTenant: (id: string) => apiRequest<Tenant>(`/api/tenants/${id}`),
  createTenant: (data: CreateTenantDto) =>
    apiRequest<Tenant>('/api/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTenant: (id: string, data: UpdateTenantDto) =>
    apiRequest<Tenant>(`/api/tenants/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Sites
  getSites: (tenantId?: string) =>
    apiRequest<Site[]>(`/api/sites${tenantId ? `?tenantId=${tenantId}` : ''}`),
  createSite: (data: CreateSiteDto) =>
    apiRequest<Site>('/api/sites', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSite: (id: string, data: UpdateSiteDto) =>
    apiRequest<Site>(`/api/sites/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteSite: (id: string) =>
    apiRequest<Site>(`/api/sites/${id}`, {
      method: 'DELETE',
    }),

  // Meters
  getMeters: (siteId?: string) =>
    apiRequest<Meter[]>(`/api/meters${siteId ? `?siteId=${siteId}` : ''}`),
  createMeter: (data: CreateMeterDto) =>
    apiRequest<Meter>('/api/meters', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateMeter: (id: string, data: UpdateMeterDto) =>
    apiRequest<Meter>(`/api/meters/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteMeter: (id: string) =>
    apiRequest<Meter>(`/api/meters/${id}`, {
      method: 'DELETE',
    }),

  // Readings
  getReadings: (meterId: string, from?: string, to?: string) => {
    const params = new URLSearchParams({ meterId });
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return apiRequest<Reading[]>(`/api/readings?${params.toString()}`);
  },
  createReading: (data: CreateReadingDto) =>
    apiRequest<Reading>('/api/readings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateReading: (id: string, data: UpdateReadingDto) =>
    apiRequest<Reading>(`/api/readings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteReading: (id: string) =>
    apiRequest<Reading>(`/api/readings/${id}`, {
      method: 'DELETE',
    }),

  // Dashboard
  getTenantDashboard: (tenantId?: string) => {
    const url = tenantId
      ? `/api/dashboard/tenant?tenantId=${tenantId}`
      : '/api/dashboard/tenant';
    return apiRequest<TenantDashboard>(url);
  },
  getSiteDashboard: (siteId: string) =>
    apiRequest<SiteDashboard>(`/api/dashboard/site/${siteId}`),

  // Alerts
  getAlerts: () => apiRequest<Alert[]>('/api/alerts'),
  recomputeAlerts: () =>
    apiRequest<{ created: number }>('/api/alerts/recompute', {
      method: 'POST',
    }),

  // Predictive Alerts
  getPredictiveAlerts: () =>
    apiRequest<PredictiveAlert[]>('/api/alerts/predictive'),
  recomputePredictiveAlerts: () =>
    apiRequest<{
      created: number;
      totalSites: number;
      processedSites: number;
      sitesWithInsufficientData: number;
      sitesWithAlerts: number;
    }>('/api/alerts/predictive/recompute', {
      method: 'POST',
    }),

  // Power Grid
  getPowerGridState: () => apiRequest<PowerGrid>('/api/power-grid/state'),
  getPowerGridData: () => apiRequest<PowerData>('/api/power-grid/data'),
  getPowerGridStatus: () => apiRequest<SimulationStatus>('/api/power-grid/status'),
};

