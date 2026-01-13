'use client';

import { useState } from 'react';
import { Select } from 'antd';
import { useTenants } from '@/hooks/useTenants';
import { useSitesByTenant } from '@/hooks/useSitesByTenant';
import { usePowerGridData } from './power-grid-hooks';
import { MapLoadingState, PowerGridLayer } from '../components';
import VietnamProvincesMap from '../VietnamProvincesMap';
import type { Tenant, Site } from '@/lib/api-client';

export default function PowerGridMap() {
  const [isMounted] = useState(() => typeof window !== 'undefined');
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  
  const { tenants, isLoading: tenantsLoading } = useTenants();
  const { sites, isLoading: sitesLoading } = useSitesByTenant(selectedTenant);
  const { gridState, isLoading: gridLoading, error, refetch } = usePowerGridData({
    siteId: selectedSite,
  });

  // Handle tenant change - reset site when tenant changes
  const handleTenantChange = (tenantId: string | null) => {
    setSelectedTenant(tenantId);
    setSelectedSite(null); // Reset site selection when tenant changes
  };

  // Handle site change
  const handleSiteChange = (siteId: string | null) => {
    setSelectedSite(siteId);
  };

  if (!isMounted) {
    return <MapLoadingState message="Đang tải bản đồ..." />;
  }

  if (gridLoading) {
    return <MapLoadingState message="Đang tải lưới điện..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Không thể tải dữ liệu lưới điện
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!gridState) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center p-6">
          <div className="text-gray-400 text-5xl mb-4">📊</div>
          <p className="text-gray-600">
            {selectedSite 
              ? 'Site này chưa có hệ thống lưới điện'
              : 'Đang tải dữ liệu lưới điện...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter Controls */}
      <div className="flex items-center gap-20 flex-wrap">
        <div className="flex items-center gap-10">
          <span className="text-sm text-gray-700 font-medium">Tenant:</span>
          <Select
            style={{ minWidth: 200 }}
            size="middle"
            value={selectedTenant}
            onChange={handleTenantChange}
            options={tenants.map((t: Tenant) => ({ value: t.id, label: t.name }))}
            loading={tenantsLoading}
            placeholder="Chọn tenant"
            allowClear
          />
        </div>

        <div className="flex items-center gap-10">
          <span className="text-sm text-gray-700 font-medium">Site:</span>
          <Select
            style={{ minWidth: 200 }}
            size="middle"
            value={selectedSite}
            onChange={handleSiteChange}
            options={sites.map((s: Site) => ({ value: s.id, label: s.name }))}
            loading={sitesLoading}
            disabled={!selectedTenant}
            placeholder={selectedTenant ? 'Chọn site' : 'Chọn tenant trước'}
            allowClear
          />
        </div>
      </div>

      {/* Map */}
      <VietnamProvincesMap disableHover={true}>
        <PowerGridLayer grid={gridState} />
      </VietnamProvincesMap>
    </div>
  );
}
