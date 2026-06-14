"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { App, Button, Card, Form, Input, Typography } from "antd";
import { useVerify2fa } from "@/hooks/use-auth";

const { Title, Text } = Typography;

export default function TwoFactorPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const verify = useVerify2fa();
  const [otp, setOtp] = useState("");

  const onSubmit = async () => {
    try {
      const res = await verify.mutateAsync(otp);
      message.success("驗證成功");
      const dest = res.user.authorities.includes("ADMIN") ? "/users" : "/profile";
      router.push(dest);
      router.refresh();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "驗證碼錯誤");
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
          <Title level={4}>兩步驟驗證</Title>
          <Text type="secondary">請輸入驗證 App 顯示的 6 位數驗證碼</Text>
        </div>
        <Form layout="vertical" onFinish={onSubmit}>
          <Form.Item label="驗證碼">
            <Input.OTP length={6} value={otp} onChange={setOtp} aria-label="驗證碼" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={verify.isPending}
              disabled={otp.length !== 6}
            >
              驗證
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </main>
  );
}
