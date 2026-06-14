"use client";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App, Form, Input, Modal, Select, Switch } from "antd";
import { type UserInput, userSchema } from "@/lib/schemas/user.schema";
import { useAuthorities, useUpsertUser } from "@/hooks/use-users";
import type { UserRow } from "@/lib/types";

const LOCALES = [
  { value: "zh-TW", label: "繁體中文" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
];

const EMPTY: UserInput = {
  id: null,
  loginName: "",
  firstName: "",
  lastName: "",
  email: "",
  locale: "zh-TW",
  enabled: true,
  authorities: ["USER"],
};

export function UserForm({
  open,
  user,
  onClose,
}: {
  open: boolean;
  user: UserRow | null;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const { data: authorities = [] } = useAuthorities();
  const upsert = useUpsertUser();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserInput>({
    resolver: zodResolver(userSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    reset(
      user
        ? {
            id: user.id,
            loginName: user.loginName,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            locale: user.locale,
            enabled: user.enabled,
            authorities: user.authorities,
          }
        : EMPTY,
    );
  }, [user, open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await upsert.mutateAsync(values);
      message.success(values.id ? "已更新使用者" : "已新增使用者");
      onClose();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "儲存失敗");
    }
  });

  return (
    <Modal
      open={open}
      title={user ? "編輯使用者" : "新增使用者"}
      onCancel={onClose}
      onOk={onSubmit}
      okText="儲存"
      cancelText="取消"
      confirmLoading={upsert.isPending}
      destroyOnHidden
    >
      <Form layout="vertical">
        <Controller
          control={control}
          name="loginName"
          render={({ field }) => (
            <Form.Item
              label="登入名稱"
              required
              validateStatus={errors.loginName ? "error" : ""}
              help={errors.loginName?.message}
            >
              <Input {...field} disabled={Boolean(user)} aria-label="登入名稱" />
            </Form.Item>
          )}
        />
        <Controller
          control={control}
          name="firstName"
          render={({ field }) => (
            <Form.Item
              label="名"
              required
              validateStatus={errors.firstName ? "error" : ""}
              help={errors.firstName?.message}
            >
              <Input {...field} aria-label="名" />
            </Form.Item>
          )}
        />
        <Controller
          control={control}
          name="lastName"
          render={({ field }) => (
            <Form.Item
              label="姓"
              required
              validateStatus={errors.lastName ? "error" : ""}
              help={errors.lastName?.message}
            >
              <Input {...field} aria-label="姓" />
            </Form.Item>
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <Form.Item
              label="Email"
              required
              validateStatus={errors.email ? "error" : ""}
              help={errors.email?.message}
            >
              <Input {...field} aria-label="Email" />
            </Form.Item>
          )}
        />
        <Controller
          control={control}
          name="locale"
          render={({ field }) => (
            <Form.Item label="語系" required>
              <Select {...field} options={LOCALES} aria-label="語系" />
            </Form.Item>
          )}
        />
        <Controller
          control={control}
          name="authorities"
          render={({ field }) => (
            <Form.Item
              label="角色"
              required
              validateStatus={errors.authorities ? "error" : ""}
              help={errors.authorities?.message}
            >
              <Select
                {...field}
                mode="multiple"
                options={authorities.map((a) => ({ value: a, label: a }))}
                aria-label="角色"
              />
            </Form.Item>
          )}
        />
        <Controller
          control={control}
          name="enabled"
          render={({ field }) => (
            <Form.Item label="啟用">
              <Switch checked={field.value} onChange={field.onChange} aria-label="啟用" />
            </Form.Item>
          )}
        />
      </Form>
    </Modal>
  );
}
