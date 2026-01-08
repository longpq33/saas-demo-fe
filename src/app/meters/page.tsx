/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
  Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { AppLayout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const METER_TYPES = [
  { label: 'Điện', value: 'Điện' },
  { label: 'Nước', value: 'Nước' },
  { label: 'Gas', value: 'Gas' },
  { label: 'Nhiệt độ', value: 'Nhiệt độ' },
  { label: 'Độ ẩm', value: 'Độ ẩm' },
  { label: 'Áp suất', value: 'Áp suất' },
  { label: 'Khác', value: 'Khác' },
];

const METER_UNITS = [
  { label: 'kWh', value: 'kWh' },
  { label: 'm³', value: 'm³' },
  { label: 'lít', value: 'lít' },
  { label: '°C', value: '°C' },
  { label: '%', value: '%' },
  { label: 'bar', value: 'bar' },
  { label: 'Pa', value: 'Pa' },
  { label: 'W', value: 'W' },
  { label: 'kW', value: 'kW' },
  { label: 'MW', value: 'MW' },
  { label: 'Khác', value: 'Khác' },
];

export default function MetersPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMeter, setEditingMeter] = useState<any>(null);
  const [siteFilter, setSiteFilter] = useState<string | undefined>();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: sites } = useQuery({
    queryKey: ['sites'],
    queryFn: () => api.getSites(),
  });

  const { data: meters, isLoading } = useQuery({
    queryKey: ['meters', siteFilter],
    queryFn: () => api.getMeters(siteFilter),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createMeter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meters'] });
      setModalOpen(false);
      form.resetFields();
      message.success('Tạo meter thành công');
    },
    onError: (error: any) => {
      message.error(error.message || 'Tạo meter thất bại');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.updateMeter(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meters'] });
      setModalOpen(false);
      setEditingMeter(null);
      form.resetFields();
      message.success('Cập nhật meter thành công');
    },
    onError: (error: any) => {
      message.error(error.message || 'Cập nhật meter thất bại');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteMeter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meters'] });
      message.success('Xóa meter thành công');
    },
    onError: (error: any) => {
      message.error(error.message || 'Xóa meter thất bại');
    },
  });

  const handleEdit = (meter: any) => {
    setEditingMeter(meter);
    form.setFieldsValue(meter);
    setModalOpen(true);
  };

  const handleSubmit = (values: any) => {
    if (editingMeter) {
      updateMutation.mutate({ id: editingMeter.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const canEdit = user?.role === 'system_admin' || user?.role === 'customer_admin';

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 80,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Đơn vị',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: 'Site ID',
      dataIndex: 'siteId',
      key: 'siteId',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          {canEdit && (
            <>
              <Button
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
                size="small"
              />
              <Popconfirm
                title="Bạn có chắc muốn xóa meter này?"
                onConfirm={() => deleteMutation.mutate(record.id)}
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <AppLayout>
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <Select
            placeholder="Lọc theo Site"
            allowClear
            style={{ width: 200 }}
            onChange={setSiteFilter}
            value={siteFilter}
          >
            {sites?.map((site: any) => (
              <Select.Option key={site.id} value={site.id}>
                {site.name}
              </Select.Option>
            ))}
          </Select>
          {canEdit && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingMeter(null);
                form.resetFields();
                setModalOpen(true);
              }}
            >
              Tạo Meter
            </Button>
          )}
        </div>

        <Table
          columns={columns}
          dataSource={meters}
          loading={isLoading}
          rowKey="id"
        />

        {canEdit && (
          <Modal
            title={editingMeter ? 'Sửa Meter' : 'Tạo Meter'}
            open={modalOpen}
            onCancel={() => {
              setModalOpen(false);
              setEditingMeter(null);
              form.resetFields();
            }}
            onOk={() => form.submit()}
            confirmLoading={createMutation.isPending || updateMutation.isPending}
          >
            <Form form={form} onFinish={handleSubmit} layout="vertical">
              <Form.Item
                name="name"
                label="Tên"
                rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item name="type" label="Loại">
                <Select
                  placeholder="Chọn loại meter"
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={METER_TYPES}
                />
              </Form.Item>
              <Form.Item name="unit" label="Đơn vị">
                <Select
                  placeholder="Chọn đơn vị"
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={METER_UNITS}
                />
              </Form.Item>
              <Form.Item
                name="siteId"
                label="Site"
                rules={[{ required: true, message: 'Vui lòng chọn site' }]}
              >
                <Select
                  placeholder="Chọn site"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={sites?.map((site: any) => ({
                    label: site.name,
                    value: site.id,
                  }))}
                  loading={!sites}
                />
              </Form.Item>
            </Form>
          </Modal>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}

