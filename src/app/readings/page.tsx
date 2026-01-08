'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Select,
  message,
  Space,
  Card,
  Alert,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { AppLayout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/vi';

dayjs.extend(customParseFormat);

export default function ReadingsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[string, string] | undefined>();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: meters } = useQuery({
    queryKey: ['meters'],
    queryFn: () => api.getMeters(),
  });

  // Tự động chọn meter đầu tiên khi danh sách meters được load
  useEffect(() => {
    if (meters && meters.length > 0 && !selectedMeter) {
      setSelectedMeter(meters[0].id);
    }
  }, [meters, selectedMeter]);

  const { data: readings, isLoading, error } = useQuery({
    queryKey: ['readings', selectedMeter, dateRange],
    queryFn: () => {
      if (!selectedMeter) return Promise.resolve([]);
      return api.getReadings(
        selectedMeter,
        dateRange?.[0],
        dateRange?.[1],
      );
    },
    enabled: !!selectedMeter,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createReading(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setFormOpen(false);
      form.resetFields();
      message.success('Tạo reading thành công');
    },
    onError: (error: any) => {
      message.error(error.message || 'Tạo reading thất bại');
    },
  });

  const canCreate =
    user?.role === 'system_admin' ||
    user?.role === 'customer_admin' ||
    user?.role === 'operator';

  const columns = [
    {
      title: 'Meter ID',
      dataIndex: 'meterId',
      key: 'meterId',
    },
    {
      title: 'Thời gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text: string) => dayjs(text).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Giá trị',
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => dayjs(text).format('DD/MM/YYYY HH:mm'),
    },
  ];

  const handleSubmit = (values: any) => {
    createMutation.mutate({
      ...values,
      timestamp: dayjs(values.timestamp).toISOString(),
    });
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <Card style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <strong>Lọc theo Meter:</strong>
              <Select
                placeholder="Chọn meter"
                style={{ width: 300, marginLeft: 8 }}
                onChange={setSelectedMeter}
                value={selectedMeter}
              >
                {meters?.map((meter: any) => (
                  <Select.Option key={meter.id} value={meter.id}>
                    {meter.name} ({meter.siteId})
                  </Select.Option>
                ))}
              </Select>
            </div>
            {canCreate && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setFormOpen(true)}
              >
                Nhập Reading Mới
              </Button>
            )}
          </Space>
        </Card>

        {!selectedMeter && (
          <Alert
            message="Chưa chọn Meter"
            description="Vui lòng chọn một meter từ dropdown phía trên để xem danh sách readings."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {error && (
          <Alert
            message="Lỗi tải dữ liệu"
            description={error instanceof Error ? error.message : 'Không thể tải danh sách readings'}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Table
          columns={columns}
          dataSource={readings || []}
          loading={isLoading}
          rowKey="id"
          locale={{
            emptyText: selectedMeter ? 'Chưa có readings nào' : 'Vui lòng chọn meter để xem readings',
          }}
        />

        {canCreate && (
          <Modal
            title="Nhập Reading Mới"
            open={formOpen}
            onCancel={() => {
              setFormOpen(false);
              form.resetFields();
            }}
            onOk={() => form.submit()}
            confirmLoading={createMutation.isPending}
          >
            <Form form={form} onFinish={handleSubmit} layout="vertical">
              <Form.Item
                name="meterId"
                label="Meter"
                rules={[{ required: true, message: 'Vui lòng chọn meter' }]}
              >
                <Select placeholder="Chọn meter">
                  {meters?.map((meter: any) => (
                    <Select.Option key={meter.id} value={meter.id}>
                      {meter.name} ({meter.siteId})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="timestamp"
                label="Thời gian"
                rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}
              >
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY HH:mm"
                />
              </Form.Item>
              <Form.Item
                name="value"
                label="Giá trị"
                rules={[{ required: true, message: 'Vui lòng nhập giá trị' }]}
              >
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Form>
          </Modal>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}

