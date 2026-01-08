'use client';

import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Card, Typography, Row, Col } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { AppLayout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import * as echarts from 'echarts';

const { Title } = Typography;

export default function SiteDashboardPage() {
  const params = useParams();
  const siteId = params.id as string;
  const chartRefs = useRef<Record<string, HTMLDivElement>>({});
  const chartInstances = useRef<Record<string, echarts.ECharts>>({});

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard', 'site', siteId],
    queryFn: () => api.getSiteDashboard(siteId),
  });

  useEffect(() => {
    if (!dashboard?.meters) return;

    dashboard.meters.forEach((meter: any) => {
      const chartId = `chart-${meter.id}`;
      const chartElement = chartRefs.current[chartId];
      if (!chartElement) return;

      if (!chartInstances.current[chartId]) {
        chartInstances.current[chartId] = echarts.init(chartElement);
      }

      const option = {
        title: {
          text: `${meter.name} (${meter.unit || ''})`,
          left: 'center',
        },
        tooltip: {
          trigger: 'axis',
        },
        xAxis: {
          type: 'category',
          data: meter.series?.map((p: any) => p.date) || [],
        },
        yAxis: {
          type: 'value',
          name: meter.unit || '',
        },
        series: [
          {
            name: meter.name,
            type: 'line',
            data: meter.series?.map((p: any) => p.value) || [],
            smooth: true,
            areaStyle: {},
          },
        ],
      };

      chartInstances.current[chartId].setOption(option);
    });

    const handleResize = () => {
      Object.values(chartInstances.current).forEach((chart) => {
        chart.resize();
      });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [dashboard]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div>Loading...</div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <Title level={2}>
          Dashboard Site: {dashboard?.site?.name || siteId}
        </Title>

        {dashboard?.meters && dashboard.meters.length > 0 ? (
          <Row gutter={[16, 16]}>
            {dashboard.meters.map((meter: any) => (
              <Col span={24} key={meter.id}>
                <Card>
                  <div
                    ref={(el) => {
                      if (el) {
                        chartRefs.current[`chart-${meter.id}`] = el;
                      }
                    }}
                    style={{ width: '100%', height: '400px' }}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Card>
            <div>Không có dữ liệu meter cho site này</div>
          </Card>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}

