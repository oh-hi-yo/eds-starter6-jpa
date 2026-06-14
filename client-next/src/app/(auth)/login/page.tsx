"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { App, Button, Card, Checkbox, Form, Input, Typography } from "antd";
import { useLogin } from "@/hooks/use-auth";
import { type LoginInput, loginSchema } from "@/lib/schemas/auth.schema";

const { Title, Text } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const login = useLogin();

  const onFinish = async (values: LoginInput) => {
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      message.error("請檢查輸入欄位");
      return;
    }
    try {
      const res = await login.mutateAsync(parsed.data);
      if (res.mfaRequired) {
        router.push("/login/2fa");
        return;
      }
      message.success("登入成功");
      const dest = res.user?.authorities.includes("ADMIN") ? "/users" : "/profile";
      router.push(dest);
      router.refresh();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "登入失敗");
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f0f2f5",
      }}
    >
      <Card style={{ width: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 4 }}>
            EDS Admin
          </Title>
          <Text type="secondary">Revamped — React 19 + Next.js</Text>
        </div>
        <Form layout="vertical" onFinish={onFinish} requiredMark={false} initialValues={{ rememberMe: false }}>
          <Form.Item
            label="登入名稱"
            name="loginName"
            rules={[{ required: true, message: "請輸入登入名稱" }]}
          >
            <Input placeholder="請輸入登入名稱" autoComplete="username" aria-label="登入名稱" />
          </Form.Item>
          <Form.Item
            label="密碼"
            name="password"
            rules={[{ required: true, message: "請輸入密碼" }]}
          >
            <Input.Password placeholder="請輸入密碼" autoComplete="current-password" aria-label="密碼" />
          </Form.Item>
          <Form.Item name="rememberMe" valuePropName="checked">
            <Checkbox>記住我（31 天）</Checkbox>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={login.isPending}>
              登入
            </Button>
          </Form.Item>
          <div style={{ textAlign: "center" }}>
            <Link href="/reset-password">忘記密碼？</Link>
          </div>
        </Form>
      </Card>
    </main>
  );
}
