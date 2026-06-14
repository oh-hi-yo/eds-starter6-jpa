import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { getNavigation } from "@/lib/mock/data";
import { AppLayout } from "@/components/layout/app-layout";

// RSC 殼層：取 authUser + navigation（Phase 1 從 mock 解析，Phase 3 改 fetch 真實後端）。
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerSession();
  if (!user) redirect("/login");
  const nav = getNavigation(user.authorities);
  return (
    <AppLayout user={user} nav={nav}>
      {children}
    </AppLayout>
  );
}
