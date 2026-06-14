"use client";
import Link from "next/link";
import { App, Button, Card, Form, Input, Typography } from "antd";

const { Title, Text } = Typography;

export default function ResetPasswordPage() {
  const { message } = App.useApp();

  const onFinish = async () => {
    // Phase 1 mock：直接顯示成功提示
    message.success("若帳號存在，密碼重設信件已寄出");
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
          <Title level={4}>重設密碼</Title>
          <Text type="secondary">輸入您的 Email，我們將寄送重設連結</Text>
        </div>
        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "請輸入 Email" },
              { type: "email", message: "Email 格式不正確" },
            ]}
          >
            <Input placeholder="you@example.com" aria-label="Email" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              寄送重設信件
            </Button>
          </Form.Item>
          <div style={{ textAlign: "center" }}>
            <Link href="/login">返回登入</Link>
          </div>
        </Form>
      </Card>
    </main>
  );
}
