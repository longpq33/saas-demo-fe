'use client';

import {
  Table,
  Button,
  message,
  Tag,
  Space,
  Card,
  Alert as AntAlert,
  Tabs,
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Alert } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { AppLayout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import dayjs from 'dayjs';

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: alerts, isLoading, error } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => api.getAlerts(),
  });

  const {
    data: predictiveAlerts,
    isLoading: isLoadingPredictive,
    error: errorPredictive,
  } = useQuery({
    queryKey: ['predictiveAlerts'],
    queryFn: () => api.getPredictiveAlerts(),
  });

  const recomputeMutation = useMutation({
    mutationFn: () => api.recomputeAlerts(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      message.success(`Đã tạo ${data.created} cảnh báo mới`);
    },
    onError: (error: unknown) => {
      const messageText = error instanceof Error ? error.message : 'Tính toán cảnh báo thất bại';
      message.error(messageText);
    },
  });

  const recomputePredictiveMutation = useMutation({
    mutationFn: () => api.recomputePredictiveAlerts(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['predictiveAlerts'] });
      const stats = [
        `Đã tạo ${data.created} cảnh báo sớm`,
        `Tổng số sites: ${data.totalSites || 0}`,
        `Sites đã xử lý: ${data.processedSites || 0}`,
        `Sites có cảnh báo: ${data.sitesWithAlerts || 0}`,
        data.sitesWithInsufficientData
          ? `Sites thiếu dữ liệu: ${data.sitesWithInsufficientData}`
          : null,
      ]
        .filter(Boolean)
        .join(' | ');
      message.success(stats);
    },
    onError: (error: unknown) => {
      const messageText = error instanceof Error ? error.message : 'Tính toán cảnh báo sớm thất bại';
      message.error(messageText);
    },
  });

  const canRecompute =
    user?.role === 'system_admin' || user?.role === 'customer_admin';

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'red';
      case 'warn':
        return 'orange';
      case 'info':
        return 'blue';
      default:
        return 'default';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'critical':
        return 'Nghiêm trọng';
      case 'warn':
        return 'Cảnh báo';
      case 'info':
        return 'Thông tin';
      default:
        return level;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'red';
      case 'decreasing':
        return 'green';
      case 'stable':
        return 'blue';
      default:
        return 'default';
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'Tăng';
      case 'decreasing':
        return 'Giảm';
      case 'stable':
        return 'Ổn định';
      default:
        return trend;
    }
  };

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 80,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      title: 'Site',
      key: 'siteName',
      render: (_: unknown, record: Alert) => record.site?.name || record.siteId || 'N/A',
    },
    {
      title: 'Mức độ',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => (
        <Tag color={getLevelColor(level)}>{getLevelText(level)}</Tag>
      ),
    },
    {
      title: 'Thông báo',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => dayjs(text).format('DD/MM/YYYY HH:mm'),
    },
  ];

  const predictiveColumns = [
    {
      title: 'STT',
      key: 'stt',
      width: 80,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      title: 'Site',
      key: 'siteName',
      render: (_: unknown, record: Alert) => record.site?.name || record.siteId || 'N/A',
    },
    {
      title: 'Mức độ',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => (
        <Tag color={getLevelColor(level)}>{getLevelText(level)}</Tag>
      ),
    },
    {
      title: 'Ngày dự đoán',
      dataIndex: 'predictedDate',
      key: 'predictedDate',
      render: (text: string) => dayjs(text).format('DD/MM/YYYY'),
    },
    {
      title: 'Giá trị dự đoán',
      dataIndex: 'expectedValue',
      key: 'expectedValue',
      render: (value: number) => value.toLocaleString('vi-VN', { maximumFractionDigits: 2 }),
    },
    {
      title: 'Xu hướng',
      dataIndex: 'trend',
      key: 'trend',
      render: (trend: string) => (
        <Tag color={getTrendColor(trend)}>{getTrendText(trend)}</Tag>
      ),
    },
    {
      title: 'Độ tin cậy',
      dataIndex: 'confidence',
      key: 'confidence',
      render: (confidence: number) => `${confidence.toFixed(1)}%`,
    },
    {
      title: 'Thông báo',
      dataIndex: 'message',
      key: 'message',
      width: 400,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => dayjs(text).format('DD/MM/YYYY HH:mm'),
    },
  ];

  return (
    <ProtectedRoute>
      <AppLayout>
        <Tabs
          defaultActiveKey="current"
          items={[
            {
              key: 'current',
              label: `Cảnh báo hiện tại (${alerts?.length || 0})`,
              children: (
                <>
                  <Card style={{ marginBottom: 16 }}>
                    <Space>
                      {canRecompute && (
                        <Button
                          type="primary"
                          icon={<ReloadOutlined />}
                          onClick={() => recomputeMutation.mutate()}
                          loading={recomputeMutation.isPending}
                        >
                          Tính toán lại cảnh báo
                        </Button>
                      )}
                      <span>
                        Tổng số cảnh báo: <strong>{alerts?.length || 0}</strong>
                      </span>
                    </Space>
                  </Card>

                  {error && (
                    <AntAlert
                      message="Lỗi tải dữ liệu"
                      description={error instanceof Error ? error.message : 'Không thể tải danh sách cảnh báo'}
                      type="error"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                  )}

                  <Table
                    columns={columns}
                    dataSource={alerts || []}
                    loading={isLoading}
                    rowKey="id"
                    locale={{
                      emptyText: 'Chưa có cảnh báo nào',
                    }}
                  />
                </>
              ),
            },
            {
              key: 'predictive',
              label: `Cảnh báo sớm (${predictiveAlerts?.length || 0})`,
              children: (
                <>
                  <Card style={{ marginBottom: 16 }}>
                    <Space>
                      {canRecompute && (
                        <Button
                          type="primary"
                          icon={<ReloadOutlined />}
                          onClick={() => recomputePredictiveMutation.mutate()}
                          loading={recomputePredictiveMutation.isPending}
                        >
                          Tạo cảnh báo sớm
                        </Button>
                      )}
                      <span>
                        Tổng số cảnh báo sớm: <strong>{predictiveAlerts?.length || 0}</strong>
                      </span>
                    </Space>
                  </Card>

                  {errorPredictive && (
                    <AntAlert
                      message="Lỗi tải dữ liệu"
                      description={errorPredictive instanceof Error ? errorPredictive.message : 'Không thể tải danh sách cảnh báo sớm'}
                      type="error"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                  )}

                  <Table
                    columns={predictiveColumns}
                    dataSource={predictiveAlerts || []}
                    loading={isLoadingPredictive}
                    rowKey="id"
                    locale={{
                      emptyText: 'Chưa có cảnh báo sớm nào',
                    }}
                  />
                </>
              ),
            },
          ]}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}

