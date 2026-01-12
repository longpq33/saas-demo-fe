'use client';

import { AppLayout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card } from 'antd';
import dynamic from 'next/dynamic';

export default function MapPage() {

const VietnamProvincesMap = dynamic(() => import('@/components/map/VietnamProvincesMap'), {
  ssr: false,
  loading: () => <p>Loading map...</p>,
})

  return (
    <ProtectedRoute>
      <AppLayout>
        <Card title="Bản đồ hệ thống site">
          <VietnamProvincesMap />
        </Card>
      </AppLayout>
    </ProtectedRoute>
  );
}