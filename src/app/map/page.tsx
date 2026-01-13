'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, Tabs } from 'antd';
import { EnvironmentOutlined, ThunderboltOutlined } from '@ant-design/icons';
import SitesMap from '@/components/map/site';
import PowerGridMap from '@/components/map/power-grid';

type MapTab = 'sites' | 'power-grid';

export default function MapPage() {
  const [activeTab, setActiveTab] = useState<MapTab>('sites');

  const tabItems = [
    {
      key: 'sites',
      label: (
        <span>
          <EnvironmentOutlined /> Bản đồ Sites
        </span>
      ),
      children: (
        <div style={{ height: 'calc(100vh - 250px)' }}>
          <SitesMap />
        </div>
      ),
    },
    {
      key: 'power-grid',
      label: (
        <span>
          <ThunderboltOutlined /> Bản đồ lưới điện
        </span>
      ),
      children: (
        <div style={{ height: 'calc(100vh - 250px)' }}>
          <PowerGridMap />
        </div>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <AppLayout>
        <Card title="Bản đồ hệ thống">
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as MapTab)}
            items={tabItems}
            type="card"
            size="large"
          />
        </Card>
      </AppLayout>
    </ProtectedRoute>
  );
}