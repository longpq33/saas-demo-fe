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
  tenantId?: string;
};

export type UpdateSiteDto = {
  name?: string;
  type?: string;
  address?: string;
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
};

