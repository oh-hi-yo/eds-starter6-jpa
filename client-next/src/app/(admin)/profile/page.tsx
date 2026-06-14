"use client";
import { useState } from "react";
import {
  App,
  Button,
  Card,
  Form,
  QRCode,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Input,
} from "antd";
import {
  useConfirmTwoFactor,
  useDevices,
  useDisableTwoFactorSelf,
  useEnableTwoFactor,
  useRevokeDevice,
  useSettings,
  useUpdateSettings,
} from "@/hooks/use-profile";
import { useAuthUser } from "@/hooks/use-auth";

const LOCALES = [
  { value: "zh-TW", label: "繁體中文" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
];

function SettingsTab() {
  const { message } = App.useApp();
  const { data: settings } = useSettings();
  const update = useUpdateSettings();
  const [locale, setLocale] = useState<string | undefined>();

  const onSave = async () => {
    await update.mutateAsync({ locale: locale ?? settings?.locale ?? "zh-TW" });
    message.success("設定已儲存");
  };

  return (
    <Card>
      <Form layout="vertical" style={{ maxWidth: 360 }}>
        <Form.Item
          label="介面語系"
          extra="目前僅儲存偏好；介面實際翻譯（i18n）將於後續階段實作。"
        >
          <Select
            value={locale ?? settings?.locale}
            options={LOCALES}
            onChange={setLocale}
            aria-label="介面語系"
          />
        </Form.Item>
        <Button type="primary" onClick={onSave} loading={update.isPending}>
          儲存設定
        </Button>
      </Form>
    </Card>
  );
}

function TwoFactorTab() {
  const { message } = App.useApp();
  const { data: user } = useAuthUser();
  const enable = useEnableTwoFactor();
  const confirm = useConfirmTwoFactor();
  const disable = useDisableTwoFactorSelf();
  const [uri, setUri] = useState<string>();
  const [otp, setOtp] = useState("");

  const onEnable = async () => {
    const res = await enable.mutateAsync();
    setUri(res.otpauthUri);
  };
  const onConfirm = async () => {
    try {
      await confirm.mutateAsync(otp);
      message.success("兩步驟驗證已啟用");
      setUri(undefined);
      setOtp("");
    } catch (e) {
      message.error(e instanceof Error ? e.message : "驗證碼錯誤");
    }
  };
  const onDisable = async () => {
    await disable.mutateAsync();
    message.success("兩步驟驗證已停用");
  };

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          目前狀態：
          {user?.twoFactorAuth ? (
            <Tag color="blue">已啟用</Tag>
          ) : (
            <Tag>未啟用</Tag>
          )}
        </div>

        {user?.twoFactorAuth ? (
          <Button danger onClick={onDisable} loading={disable.isPending}>
            停用兩步驟驗證
          </Button>
        ) : uri ? (
          <Space direction="vertical">
            <QRCode value={uri} aria-label="2FA QRCode" />
            <Input.OTP length={6} value={otp} onChange={setOtp} aria-label="驗證碼" />
            <Button type="primary" onClick={onConfirm} disabled={otp.length !== 6}>
              確認啟用
            </Button>
          </Space>
        ) : (
          <Button type="primary" onClick={onEnable} loading={enable.isPending}>
            啟用兩步驟驗證
          </Button>
        )}
      </Space>
    </Card>
  );
}

function DevicesTab() {
  const { message } = App.useApp();
  const { data: devices = [] } = useDevices();
  const revoke = useRevokeDevice();

  return (
    <Card>
      <Table
        rowKey="series"
        dataSource={devices}
        pagination={false}
        columns={[
          { title: "裝置", dataIndex: "userAgent" },
          { title: "IP", dataIndex: "ip" },
          {
            title: "最後使用",
            dataIndex: "lastUsed",
            render: (v: number) => new Date(v).toLocaleString("zh-TW"),
          },
          {
            title: "操作",
            render: (_, row) => (
              <Button
                size="small"
                danger
                onClick={async () => {
                  await revoke.mutateAsync(row.series);
                  message.success("已撤銷裝置");
                }}
                aria-label={`撤銷 ${row.series}`}
              >
                撤銷
              </Button>
            ),
          },
        ]}
      />
    </Card>
  );
}

export default function ProfilePage() {
  return (
    <section>
      <h2 style={{ margin: "0 0 16px" }}>個人設定</h2>
      <Tabs
        items={[
          { key: "settings", label: "個人設定", children: <SettingsTab /> },
          { key: "2fa", label: "兩步驟驗證", children: <TwoFactorTab /> },
          { key: "devices", label: "登入裝置", children: <DevicesTab /> },
        ]}
      />
    </section>
  );
}
