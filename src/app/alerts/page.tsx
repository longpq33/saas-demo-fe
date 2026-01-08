'use client';

import {
  Table,
  Button,
  message,
  Tag,
  Space,
  Card,
  Alert,
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
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

  const recomputeMutation = useMutation({
    mutationFn: () => api.recomputeAlerts(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      message.success(`Đã tạo ${data.created} cảnh báo mới`);
    },
    onError: (error: any) => {
      message.error(error.message || 'Tính toán cảnh báo thất bại');
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

  const columns = [
    {
      title: 'Site',
      key: 'siteName',
      render: (_: any, record: any) => record.site?.name || record.siteId || 'N/A',
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

  return (
    <ProtectedRoute>
      <AppLayout>
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
          <Alert
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
      </AppLayout>
    </ProtectedRoute>
  );
}

