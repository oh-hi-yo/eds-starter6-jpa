"use client";
import type { ReactNode } from "react";
import { Menu } from "antd";
import { SettingOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";
import type { NavigationNode } from "@/lib/types";

const ICONS: Record<string, ReactNode> = {
  team: <TeamOutlined />,
  user: <UserOutlined />,
  setting: <SettingOutlined />,
};

export function SideMenu({ nav }: { nav: NavigationNode[] }) {
  const router = useRouter();
  const pathname = usePathname();

  const items = nav.map((n) => ({
    key: n.path ?? n.key,
    icon: n.icon ? ICONS[n.icon] : undefined,
    label: n.label,
  }));

  return (
    <Menu
      mode="inline"
      selectedKeys={[pathname]}
      items={items}
      onClick={(e) => router.push(e.key)}
    />
  );
}
