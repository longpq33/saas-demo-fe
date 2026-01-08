"use client";

import { Layout, Typography, List, Card, Tag, Space, Divider } from "antd";
import styled from "styled-components";

const { Header, Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const PageWrapper = styled(Layout)`
  min-height: 100vh;
  background: #f5f7fa;
`;

const CardGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
`;

export default function Home() {
  return (
    <PageWrapper>
      <Header
        style={{
          background: "#001529",
          color: "#fff",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Title level={4} style={{ color: "#fff", margin: 0 }}>
          SaaS Energy Management Demo
        </Title>
      </Header>
      <Content style={{ padding: "32px", maxWidth: 1200, margin: "0 auto" }}>
        <Card style={{ marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 8 }}>
            Kiến trúc demo
          </Title>
          <Paragraph>
            Frontend Next.js (app router) + React Query + Ant Design + styled
            components + ECharts. Backend NestJS + Prisma + PostgreSQL, auth
            JWT (httpOnly cookie), multi-tenant shared schema.
          </Paragraph>
          <Space size="small" wrap>
            <Tag color="blue">Multi-tenant</Tag>
            <Tag color="green">React Query</Tag>
            <Tag color="purple">Ant Design</Tag>
            <Tag color="volcano">ECharts-ready</Tag>
          </Space>
        </Card>

        <CardGrid>
          <Card title="Luồng trải nghiệm" bordered>
            <List
              size="small"
              dataSource={[
                "Đăng nhập (system admin hoặc tenant admin).",
                "Tạo tenant mới (system admin) + admin của tenant.",
                "Tenant admin: tạo site, meter, user, nhập readings.",
                "Xem dashboard + cảnh báo (tính rule 120% so với 7 ngày).",
              ]}
              renderItem={(item) => <List.Item>{item}</List.Item>}
            />
          </Card>

          <Card title="API chính (NestJS)" bordered>
            <List
              size="small"
              dataSource={[
                "POST /api/auth/login | /auth/logout | GET /auth/me",
                "CRUD /tenants (system admin)",
                "CRUD /sites, /meters, /readings",
                "GET /dashboard/tenant, GET /dashboard/site/:id",
                "GET /alerts, POST /alerts/recompute",
              ]}
              renderItem={(item) => <List.Item>{item}</List.Item>}
            />
          </Card>

          <Card title="Frontend (Next.js)" bordered>
            <List
              size="small"
              dataSource={[
                "Sử dụng React Query với fetch credentials để gửi JWT cookie.",
                "Ant Design UI + styled-components, dễ tùy theme.",
                "ECharts cho biểu đồ time-series per meter/site.",
                "Cấu hình sẵn provider & registry cho SSR styled-components.",
              ]}
              renderItem={(item) => <List.Item>{item}</List.Item>}
            />
          </Card>

          <Card title="Chạy thử" bordered>
            <List
              size="small"
              dataSource={[
                "docker compose up -d postgres (khởi động DB).",
                "cd backend && npm run db:push && npm run db:seed",
                "npm run start:dev (backend, port 4000).",
                "cd frontend && npm run dev (frontend, port 3000).",
              ]}
              renderItem={(item) => <List.Item>{item}</List.Item>}
            />
            <Divider style={{ margin: "12px 0" }} />
            <Text type="secondary">
              Tài khoản seed: admin@example.com / abc-admin@example.com
              (mật khẩu: Admin123!)
            </Text>
          </Card>
        </CardGrid>
      </Content>
    </PageWrapper>
  );
}
