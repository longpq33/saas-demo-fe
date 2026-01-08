'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  DatePicker,
  InputNumber,
  Select,
  message,
  Space,
  Card,
  Alert,
  Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type CreateReadingDto, type UpdateReadingDto, type Reading, type Meter } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { AppLayout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/vi';

dayjs.extend(customParseFormat);

export default function ReadingsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingReading, setEditingReading] = useState<Reading | null>(null);
  const [selectedMeter, setSelectedMeter] = useState<string | undefined>();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: meters } = useQuery<Meter[]>({
    queryKey: ['meters'],
    queryFn: () => api.getMeters(),
  });

  // Tự động chọn meter đầu tiên khi danh sách meters được load
  useEffect(() => {
    if (meters && meters.length > 0 && !selectedMeter) {
      setSelectedMeter(meters[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meters]);

  const { data: readings, isLoading, error } = useQuery<Reading[]>({
    queryKey: ['readings', selectedMeter],
    queryFn: () => {
      if (!selectedMeter) return Promise.resolve([]);
      return api.getReadings(selectedMeter);
    },
    enabled: !!selectedMeter,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateReadingDto) => api.createReading(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setFormOpen(false);
      form.resetFields();
      setEditingReading(null);
      message.success('Tạo reading thành công');
    },
    onError: (error: unknown) => {
      const messageText = error instanceof Error ? error.message : 'Tạo reading thất bại';
      message.error(messageText);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReadingDto }) =>
      api.updateReading(id, data),
    onSuccess: () => {
      // Invalidate all readings queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['readings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setFormOpen(false);
      setEditingReading(null);
      form.resetFields();
      message.success('Cập nhật reading thành công');
    },
    onError: (error: unknown) => {
      const messageText = error instanceof Error ? error.message : 'Cập nhật reading thất bại';
      message.error(messageText);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteReading(id),
    onSuccess: () => {
      // Invalidate all readings queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['readings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      message.success('Xóa reading thành công');
    },
    onError: (error: unknown) => {
      const messageText = error instanceof Error ? error.message : 'Xóa reading thất bại';
      message.error(messageText);
    },
  });

  const canCreate =
    user?.role === 'system_admin' ||
    user?.role === 'customer_admin' ||
    user?.role === 'operator';

  const handleEdit = (reading: Reading) => {
    setEditingReading(reading);
    form.setFieldsValue({
      meterId: reading.meterId,
      timestamp: dayjs(reading.timestamp),
      value: reading.value,
    });
    setFormOpen(true);
  };

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 80,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      title: 'Tên Meter',
      key: 'meterName',
      render: (_: unknown, record: Reading) => {
        const meter = meters?.find((m: Meter) => m.id === record.meterId);
        if (meter) {
          return meter.name;
        }
        return record.meterId || 'N/A';
      },
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
    {
      title: 'Hành động',
      key: 'action',
      render: (_: unknown, record: Reading) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Bạn có chắc muốn xóa reading này?"
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleSubmit = (values: { meterId: string; timestamp: dayjs.Dayjs; value: number }) => {
    const submitData = {
      ...values,
      timestamp: dayjs(values.timestamp).toISOString(),
    };
    if (editingReading) {
      updateMutation.mutate({ id: editingReading.id, data: submitData as UpdateReadingDto });
    } else {
      createMutation.mutate(submitData as CreateReadingDto);
    }
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
                {meters?.map((meter: Meter) => (
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
                onClick={() => {
                  setEditingReading(null);
                  form.resetFields();
                  setFormOpen(true);
                }}
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
            title={editingReading ? 'Sửa Reading' : 'Nhập Reading Mới'}
            open={formOpen}
            onCancel={() => {
              setFormOpen(false);
              setEditingReading(null);
              form.resetFields();
            }}
            onOk={() => form.submit()}
            confirmLoading={createMutation.isPending || updateMutation.isPending}
          >
            <Form form={form} onFinish={handleSubmit} layout="vertical">
              <Form.Item
                name="meterId"
                label="Meter"
                rules={[{ required: true, message: 'Vui lòng chọn meter' }]}
              >
                <Select
                  placeholder="Chọn meter"
                  disabled={!!editingReading}
                >
                  {meters?.map((meter: Meter) => (
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

