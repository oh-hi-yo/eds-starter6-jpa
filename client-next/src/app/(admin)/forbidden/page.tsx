import Link from "next/link";
import { Button, Result } from "antd";

export default function ForbiddenPage() {
  return (
    <Result
      status="403"
      title="403"
      subTitle="您沒有權限存取此頁面。"
      extra={
        <Link href="/">
          <Button type="primary">返回首頁</Button>
        </Link>
      }
    />
  );
}
