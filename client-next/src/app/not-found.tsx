import Link from "next/link";
import { Button, Result } from "antd";

export default function NotFound() {
  return (
    <Result
      status="404"
      title="404"
      subTitle="找不到此頁面。"
      extra={
        <Link href="/">
          <Button type="primary">返回首頁</Button>
        </Link>
      }
    />
  );
}
