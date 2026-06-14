"use client";
import { useMemo, useState } from "react";
import { App, Button, Input, Space, Tag } from "antd";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { BaseGrid } from "@/components/grid/base-grid";
import { UserForm } from "./user-form";
import {
  useDeleteUser,
  useDisableUserTwoFactor,
  useSendResetEmail,
  useUnlockUser,
  useUsers,
} from "@/hooks/use-users";
import type { UserRow } from "@/lib/types";

interface GridContext {
  onEdit: (u: UserRow) => void;
  onDelete: (u: UserRow) => void;
  onUnlock: (u: UserRow) => void;
  onSendReset: (u: UserRow) => void;
}

function ActionsRenderer(params: ICellRendererParams<UserRow>) {
  const ctx = params.context as GridContext;
  const u = params.data;
  if (!u) return null;
  const locked = u.lockedUntil != null && u.lockedUntil > Date.now();
  return (
    <Space size="small">
      <Button size="small" onClick={() => ctx.onEdit(u)} aria-label={`編輯 ${u.loginName}`}>
        編輯
      </Button>
      <Button size="small" danger onClick={() => ctx.onDelete(u)} aria-label={`刪除 ${u.loginName}`}>
        刪除
      </Button>
      {locked && (
        <Button
          size="small"
          color="gold"
          variant="solid"
          onClick={() => ctx.onUnlock(u)}
          aria-label={`解鎖 ${u.loginName}`}
        >
          解鎖
        </Button>
      )}
    </Space>
  );
}

export function UserGrid() {
  const { message, modal } = App.useApp();
  const [q, setQ] = useState("");
  const { data, isLoading } = useUsers({ page: 0, size: 1000, q });
  const del = useDeleteUser();
  const unlock = useUnlockUser();
  const disable2fa = useDisableUserTwoFactor();
  const sendReset = useSendResetEmail();

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);

  const columnDefs = useMemo<ColDef<UserRow>[]>(
    () => [
      { field: "loginName", headerName: "登入名稱", sortable: true, filter: true, minWidth: 130 },
      { field: "firstName", headerName: "名", sortable: true, minWidth: 100 },
      { field: "lastName", headerName: "姓", sortable: true, minWidth: 100 },
      { field: "email", headerName: "Email", sortable: true, filter: true, minWidth: 200, flex: 1 },
      {
        field: "enabled",
        headerName: "狀態",
        minWidth: 110,
        cellRenderer: (p: ICellRendererParams<UserRow>) => {
          const u = p.data;
          const locked = u?.lockedUntil != null && u.lockedUntil > Date.now();
          if (locked) return <Tag color="red">鎖定</Tag>;
          return p.value ? <Tag color="green">啟用</Tag> : <Tag>停用</Tag>;
        },
      },
      {
        field: "twoFactorAuth",
        headerName: "2FA",
        minWidth: 90,
        cellRenderer: (p: ICellRendererParams<UserRow>) =>
          p.value ? <Tag color="blue">已啟用</Tag> : <Tag>未啟用</Tag>,
      },
      {
        field: "lastAccess",
        headerName: "最後存取",
        minWidth: 170,
        valueFormatter: (p) => (p.value ? new Date(p.value).toLocaleString("zh-TW") : "—"),
      },
      {
        headerName: "操作",
        minWidth: 240,
        pinned: "right",
        sortable: false,
        filter: false,
        cellRenderer: ActionsRenderer,
      },
    ],
    [],
  );

  const context: GridContext = {
    onEdit: (u) => {
      setEditingUser(u);
      setFormOpen(true);
    },
    onDelete: (u) => {
      modal.confirm({
        title: `確定刪除 ${u.loginName}？`,
        okText: "刪除",
        okButtonProps: { danger: true },
        cancelText: "取消",
        onOk: async () => {
          await del.mutateAsync(u.id);
          message.success("已刪除使用者");
        },
      });
    },
    onUnlock: async (u) => {
      await unlock.mutateAsync(u.id);
      message.success("帳號已解鎖");
    },
    onSendReset: async (u) => {
      await sendReset.mutateAsync(u.id);
      message.success("密碼重設信件已寄出");
    },
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="搜尋登入名稱 / Email / 姓名"
          allowClear
          onSearch={setQ}
          style={{ width: 320 }}
          aria-label="搜尋使用者"
        />
        <Button
          type="primary"
          onClick={() => {
            setEditingUser(null);
            setFormOpen(true);
          }}
        >
          新增使用者
        </Button>
      </Space>

      <BaseGrid<UserRow>
        rowData={data?.content ?? []}
        columnDefs={columnDefs}
        loading={isLoading}
        context={context}
      />

      <UserForm open={formOpen} user={editingUser} onClose={() => setFormOpen(false)} />
    </div>
  );
}
