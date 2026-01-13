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
import { PlusOutlined, EditOutlined, DeleteOutlined, DashboardOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { AppLayout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const SITE_TYPES = [
  { label: 'Nhà máy', value: 'Nhà máy' },
  { label: 'Văn phòng', value: 'Văn phòng' },
  { label: 'Kho bãi', value: 'Kho bãi' },
  { label: 'Trung tâm dữ liệu', value: 'Trung tâm dữ liệu' },
  { label: 'Cửa hàng', value: 'Cửa hàng' },
  { label: 'Khách sạn', value: 'Khách sạn' },
  { label: 'Bệnh viện', value: 'Bệnh viện' },
  { label: 'Trường học', value: 'Trường học' },
  { label: 'Khác', value: 'Khác' },
];

export default function SitesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<any>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const router = useRouter();

  const { data: sites, isLoading } = useQuery({
    queryKey: ['sites', user?.tenantId],
    queryFn: () => api.getSites(user?.role === 'system_admin' ? undefined : undefined),
  });

  // Fetch tenants for system_admin to show in dropdown
  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => api.getTenants(),
    enabled: user?.role === 'system_admin',
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createSite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setModalOpen(false);
      form.resetFields();
      message.success('Tạo site thành công');
    },
    onError: (error: any) => {
      message.error(error.message || 'Tạo site thất bại');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.updateSite(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setModalOpen(false);
      setEditingSite(null);
      form.resetFields();
      message.success('Cập nhật site thành công');
    },
    onError: (error: any) => {
      message.error(error.message || 'Cập nhật site thất bại');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteSite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      message.success('Xóa site thành công');
    },
    onError: (error: any) => {
      message.error(error.message || 'Xóa site thất bại');
    },
  });

  const handleEdit = (site: any) => {
    setEditingSite(site);
    form.setFieldsValue(site);
    setModalOpen(true);
  };

  const handleSubmit = (values: any) => {
    // Convert latitude and longitude to numbers if they exist
    const processedValues = {
      ...values,
      latitude: values.latitude ? Number(values.latitude) : undefined,
      longitude: values.longitude ? Number(values.longitude) : undefined,
    };
    
    if (editingSite) {
      updateMutation.mutate({ id: editingSite.id, data: processedValues });
    } else {
      createMutation.mutate(processedValues);
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
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button
            icon={<DashboardOutlined />}
            onClick={() => router.push(`/dashboard/site/${record.id}`)}
            size="small"
         />
          {canEdit && (
            <>
              <Button
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
                size="small"
             />
              <Popconfirm
                title="Bạn có chắc muốn xóa site này?"
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
        {canEdit && (
          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingSite(null);
                form.resetFields();
                setModalOpen(true);
              }}
            >
              Tạo Site
            </Button>
          </div>
        )}

        <Table
          columns={columns}
          dataSource={sites}
          loading={isLoading}
          rowKey="id"
        />

        {canEdit && (
          <Modal
            title={editingSite ? 'Sửa Site' : 'Tạo Site'}
            open={modalOpen}
            onCancel={() => {
              setModalOpen(false);
              setEditingSite(null);
              form.resetFields();
            }}
            onOk={() => form.submit()}
            confirmLoading={createMutation.isPending || updateMutation.isPending}
          >
            <Form form={form} onFinish={handleSubmit} layout="vertical">
              {user?.role === 'system_admin' && (
                <Form.Item name="tenantId" label="Tenant">
                  <Select
                    placeholder="Chọn tenant"
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={tenants?.map((tenant) => ({
                      label: tenant.name,
                      value: tenant.id,
                    }))}
                    loading={!tenants}
                  />
                </Form.Item>
              )}
              <Form.Item
                name="name"
                label="Tên"
                rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item name="type" label="Loại">
                <Select
                  placeholder="Chọn loại site"
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={SITE_TYPES}
                />
              </Form.Item>
              <Form.Item name="address" label="Địa chỉ">
                <Input.TextArea />
              </Form.Item>
              <Form.Item
                label="Tọa độ"
                style={{ marginBottom: 8 }}
              >
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item
                    name="latitude"
                    noStyle
                    rules={[
                      {
                        validator: (_, value) => {
                          if (!value) return Promise.resolve();
                          const num = Number(value);
                          if (isNaN(num) || num < -90 || num > 90) {
                            return Promise.reject(new Error('Latitude phải từ -90 đến 90'));
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input
                      type="number"
                      step="any"
                      placeholder="Latitude (-90 đến 90)"
                      style={{ width: '50%' }}
                    />
                  </Form.Item>
                  <Form.Item
                    name="longitude"
                    noStyle
                    rules={[
                      {
                        validator: (_, value) => {
                          if (!value) return Promise.resolve();
                          const num = Number(value);
                          if (isNaN(num) || num < -180 || num > 180) {
                            return Promise.reject(new Error('Longitude phải từ -180 đến 180'));
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input
                      type="number"
                      step="any"
                      placeholder="Longitude (-180 đến 180)"
                      style={{ width: '50%' }}
                    />
                  </Form.Item>
                </Space.Compact>
              </Form.Item>
              <Form.Item
                style={{ marginBottom: 0, fontSize: '12px', color: '#999' }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: '12px' }}>
                    💡 Tọa độ là tùy chọn. Bạn có thể tìm tọa độ tại{' '}
                    <a
                      href="https://www.google.com/maps"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Google Maps
                    </a>
                    {' '}hoặc{' '}
                    <a
                      href="https://www.openstreetmap.org"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      OpenStreetMap
                    </a>
                  </p>
                </div>
              </Form.Item>
              
            </Form>
          </Modal>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}

