'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Row, Col, Statistic, Typography, Button, Alert, Empty, Select, Space } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { AppLayout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import * as echarts from 'echarts';

const { Title } = Typography;

type DashboardDataPoint = {
  date: string;
  value: number;
};

type TopSite = {
  siteId: string;
  siteName: string;
  value: number;
};

type DashboardData = {
  totalByDay: DashboardDataPoint[];
  topSites: TopSite[];
  siteCount: number;
  meterCount: number;
};

type EChartsTooltipParams = {
  name: string;
  value: number;
  seriesName: string;
}[];

const SELECTED_TENANT_KEY = 'selected_tenant_id';

export default function DashboardPage() {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  // For system_admin: allow selecting tenant from localStorage or use user's tenantId
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && user?.role === 'system_admin') {
      return localStorage.getItem(SELECTED_TENANT_KEY);
    }
    return null;
  });

  // Get list of tenants for system_admin
  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => api.getTenants(),
    enabled: user?.role === 'system_admin' && !user.tenantId,
  });

  // Determine which tenantId to use
  const effectiveTenantId =
    user?.role === 'system_admin' && !user.tenantId
      ? selectedTenantId || undefined
      : user?.tenantId || undefined;

  // Fetch dashboard data
  const { data: dashboard, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard', 'tenant', effectiveTenantId],
    queryFn: () => api.getTenantDashboard(effectiveTenantId || undefined) as Promise<DashboardData>,
    enabled: !!user && (!!user.tenantId || (user?.role === 'system_admin' && !!selectedTenantId)),
    retry: false,
  });

  // Save selected tenant to localStorage
  const handleTenantChange = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SELECTED_TENANT_KEY, tenantId);
    }
  };

  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // Cleanup function
    const chart = chartInstance.current;
    const handleResize = () => {
      chart.resize();
    };
    window.addEventListener('resize', handleResize);

    // Update chart when data changes
    if (dashboard?.totalByDay && dashboard.totalByDay.length > 0) {
      const option = {
        title: {
          text: 'Tổng tiêu thụ theo ngày',
          left: 'center',
        },
        tooltip: {
          trigger: 'axis',
          formatter: (params: unknown) => {
            const param = (params as EChartsTooltipParams)[0];
            if (!param) return '';
            return `${param.name}<br/>${param.seriesName}: ${param.value.toLocaleString()}`;
          },
        },
        xAxis: {
          type: 'category',
          data: dashboard.totalByDay.map((p: DashboardDataPoint) => {
            // Format date to DD/MM/YYYY
            const date = new Date(p.date);
            return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
          }),
        },
        yAxis: {
          type: 'value',
          name: 'Giá trị',
        },
        series: [
          {
            name: 'Tiêu thụ',
            type: 'line',
            data: dashboard.totalByDay.map((p: DashboardDataPoint) => p.value),
            smooth: true,
            areaStyle: {
              opacity: 0.3,
            },
            itemStyle: {
              color: '#1890ff',
            },
            lineStyle: {
              color: '#1890ff',
            },
          },
        ],
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true,
        },
      };

      chart.setOption(option, true);
    } else {
      // Show empty state
      chart.setOption({
        title: {
          text: 'Chưa có dữ liệu',
          left: 'center',
          top: 'middle',
          textStyle: {
            color: '#999',
            fontSize: 16,
          },
        },
      });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      // Cleanup chart on unmount
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, [dashboard]);

  // Show tenant selector for system admin without tenantId
  const showTenantSelector = user?.role === 'system_admin' && !user.tenantId;

  // Show error message if API call failed
  if (error) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <Title level={2}>Dashboard Tenant</Title>
          <Alert
            message="Lỗi tải dữ liệu"
            description={
              error instanceof Error
                ? error.message
                : 'Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.'
            }
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
          />
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={2} style={{ margin: 0 }}>Dashboard Tenant</Title>
            {showTenantSelector && (
              <Space>
                <span>Chọn Tenant:</span>
                <Select
                  placeholder="Chọn tenant để xem dashboard"
                  style={{ width: 300 }}
                  value={selectedTenantId || undefined}
                  onChange={handleTenantChange}
                  loading={!tenants}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={tenants?.map((tenant: { id: string; name: string }) => ({
                    label: tenant.name,
                    value: tenant.id,
                  }))}
                />
                <Button onClick={() => router.push('/tenants')}>
                  Quản lý Tenants
                </Button>
              </Space>
            )}
          </div>

          {showTenantSelector && !selectedTenantId && (
            <Alert
              message="Chưa chọn Tenant"
              description="Vui lòng chọn một tenant từ dropdown phía trên để xem dashboard."
              type="info"
              showIcon
            />
          )}

          {!dashboard && !isLoading && !error && selectedTenantId && (
            <Empty
              description="Chưa có dữ liệu dashboard"
              style={{ margin: '48px 0' }}
            />
          )}

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng số Sites"
                value={dashboard?.siteCount || 0}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng số Meters"
                value={dashboard?.meterCount || 0}
              />
            </Card>
          </Col>
        </Row>

        <Card 
          title="Biểu đồ tiêu thụ" 
          style={{ marginBottom: 24 }}
          loading={isLoading}
        >
          <div
            ref={chartRef}
            style={{ width: '100%', height: '400px', minHeight: '400px' }}
          />
        </Card>

        {dashboard?.topSites && dashboard.topSites.length > 0 && (
          <Card title="Top 5 Sites tiêu thụ cao nhất">
            <Row gutter={16}>
              {dashboard.topSites.map((site: TopSite, index: number) => (
                <Col span={8} key={site.siteId} style={{ marginBottom: 16 }}>
                  <Card
                    size="small"
                    actions={[
                      <Button
                        type="link"
                        key="view"
                        onClick={() => router.push(`/dashboard/site/${site.siteId}`)}
                      >
                        Xem chi tiết
                      </Button>,
                    ]}
                  >
                    <Statistic
                      title={`${index + 1}. ${site.siteName}`}
                      value={site.value}
                      precision={2}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        )}
        </Space>
      </AppLayout>
    </ProtectedRoute>
  );
}

