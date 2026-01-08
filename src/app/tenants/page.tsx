'use client';

import { useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Space,
  Popconfirm,
  Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { AppLayout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function TenantsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => api.getTenants(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createTenant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setModalOpen(false);
      form.resetFields();
      message.success('Tạo tenant thành công');
    },
    onError: (error: any) => {
      message.error(error.message || 'Tạo tenant thất bại');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.updateTenant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setModalOpen(false);
      setEditingTenant(null);
      form.resetFields();
      message.success('Cập nhật tenant thành công');
    },
    onError: (error: any) => {
      message.error(error.message || 'Cập nhật tenant thất bại');
    },
  });

  const handleEdit = (tenant: any) => {
    setEditingTenant(tenant);
    form.setFieldsValue(tenant);
    setModalOpen(true);
  };

  const handleSubmit = (values: any) => {
    if (editingTenant) {
      updateMutation.mutate({ id: editingTenant.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 200,
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email Admin',
      dataIndex: 'adminEmail',
      key: 'adminEmail',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>{status}</Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Sửa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <ProtectedRoute allowedRoles={['system_admin']}>
      <AppLayout>
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingTenant(null);
              form.resetFields();
              setModalOpen(true);
            }}
          >
            Tạo Tenant
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={tenants}
          loading={isLoading}
          rowKey="id"
        />

        <Modal
          title={editingTenant ? 'Sửa Tenant' : 'Tạo Tenant'}
          open={modalOpen}
          onCancel={() => {
            setModalOpen(false);
            setEditingTenant(null);
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
            {!editingTenant && (
              <>
                <Form.Item
                  name="adminEmail"
                  label="Email Admin"
                  rules={[
                    { required: true, message: 'Vui lòng nhập email' },
                    { type: 'email', message: 'Email không hợp lệ' },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="adminPassword"
                  label="Mật khẩu Admin"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu' },
                    { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
                  ]}
                >
                  <Input.Password />
                </Form.Item>
              </>
            )}
            <Form.Item name="status" label="Trạng thái">
              <Input placeholder="ACTIVE hoặc INACTIVE" />
            </Form.Item>
          </Form>
        </Modal>
      </AppLayout>
    </ProtectedRoute>
  );
}

