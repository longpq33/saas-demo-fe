'use client';

import { Layout as AntLayout, Menu, Button, Dropdown, Avatar } from 'antd';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  DashboardOutlined,
  HomeOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  AlertOutlined,
  BankOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';

const { Header, Content, Sider } = AntLayout;

const StyledLayout = styled(AntLayout)`
  min-height: 100vh;
`;

const StyledHeader = styled(Header)`
  background: #001529;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
`;

const Logo = styled.div`
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  margin-right: 32px;
`;

const UserMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fff;
`;

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    ...(user?.role === 'system_admin'
      ? [
          {
            key: '/tenants',
            icon: <BankOutlined />,
            label: 'Tenants',
          },
        ]
      : []),
    {
      key: '/sites',
      icon: <HomeOutlined />,
      label: 'Sites',
    },
    {
      key: '/meters',
      icon: <ThunderboltOutlined />,
      label: 'Meters',
    },
    {
      key: '/readings',
      icon: <FileTextOutlined />,
      label: 'Readings',
    },
    {
      key: '/alerts',
      icon: <AlertOutlined />,
      label: 'Alerts',
    },
  ];

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: logout,
    },
  ];

  return (
    <StyledLayout>
      <StyledHeader>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Logo>Energy Management</Logo>
        </div>
        <UserMenu>
          <span>{user?.email}</span>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Avatar icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
          </Dropdown>
        </UserMenu>
      </StyledHeader>
      <AntLayout>
        <Sider width={200} theme="light">
          <Menu
            mode="inline"
            selectedKeys={[pathname]}
            items={menuItems}
            style={{ height: '100%', borderRight: 0 }}
            onClick={({ key }) => {
              router.push(key as string);
            }}
          />
        </Sider>
        <AntLayout style={{ padding: '24px' }}>
          <Content style={{ background: '#fff', padding: 24, minHeight: 280 }}>
            {children}
          </Content>
        </AntLayout>
      </AntLayout>
    </StyledLayout>
  );
}

