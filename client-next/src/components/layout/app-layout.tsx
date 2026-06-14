"use client";
import { App, Avatar, Button, Layout, Space, Typography } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useLogout } from "@/hooks/use-auth";
import { SideMenu } from "./side-menu";
import type { AuthUser, NavigationNode } from "@/lib/types";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface Props {
  user: AuthUser;
  nav: NavigationNode[];
  children: React.ReactNode;
}

export function AppLayout({ user, nav, children }: Props) {
  const router = useRouter();
  const { message } = App.useApp();
  const logout = useLogout();

  const onLogout = async () => {
    await logout.mutateAsync();
    message.success("已登出");
    router.push("/login");
    router.refresh();
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider theme="light" breakpoint="lg" collapsedWidth={0} width={220}>
        <div style={{ height: 56, margin: 16, fontWeight: 700, fontSize: 18, color: "#1677ff" }}>
          EDS Admin
        </div>
        <SideMenu nav={nav} />
      </Sider>
      <Layout>
        <Header
          style={{
            background: "#fff",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            paddingInline: 24,
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <Space size="middle">
            <Avatar style={{ backgroundColor: "#1677ff" }}>
              {user.firstName?.[0] ?? user.loginName[0]}
            </Avatar>
            <Text data-testid="current-user">
              {user.firstName} {user.lastName}
            </Text>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={onLogout}
              loading={logout.isPending}
            >
              登出
            </Button>
          </Space>
        </Header>
        <Content style={{ margin: 24 }}>{children}</Content>
      </Layout>
    </Layout>
  );
}
