"use client";
import { Card, Descriptions } from "antd";

export default function SystemPage() {
  return (
    <section>
      <h2 style={{ margin: "0 0 16px" }}>系統管理</h2>
      <Card>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="應用名稱">EDS Admin (Revamped)</Descriptions.Item>
          <Descriptions.Item label="前端">React 19 + Next.js 16</Descriptions.Item>
          <Descriptions.Item label="UI">Ant Design 6 + Ag-Grid</Descriptions.Item>
          <Descriptions.Item label="資料層">Phase 1 Mock API（Phase 3 切換真實後端）</Descriptions.Item>
          <Descriptions.Item label="建構時間">{new Date().toISOString()}</Descriptions.Item>
        </Descriptions>
      </Card>
    </section>
  );
}
