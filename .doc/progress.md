# Revamping Progress Log

> **專案：** eds-starter6-jpa Revamping
> **Branch：** `feauture/revamping-experiment`
> **執行方式：** Agent Team（Architect / Frontend Dev / Backend Dev / QA）
> **規則：** 每個 Phase 通過驗收閘門 + 使用者確認後，才 commit/push 並進入下個 Phase
>
> 思考過程記錄於 `.thinking-log/`，供 trace。

---

## 狀態總覽

| Phase | 範圍 | 狀態 | 驗收 | 使用者確認 | Commit |
|-------|------|------|------|-----------|--------|
| Phase 1 | Frontend Revamp（React 19 + Next.js 16） | ✅ 完成 | ✅ 通過 | ⏳ 待確認 | ⬜ |
| Phase 2 | Backend Migration（Spring Boot 3 + JDK 17） | 🚧 進行中 | ⬜ | ⬜ | ⬜ |
| Phase 3 | 整合 + E2E 驗收 | ⬜ 未開始 | ⬜ | ⬜ | ⬜ |

圖例：⬜ 未開始 ｜ 🚧 進行中 ｜ ✅ 完成 ｜ ❌ 失敗

---

## 環境檢查（2026-06-13）

| 工具 | 版本 | 狀態 |
|------|------|------|
| Node | v22.22.2 | ✅ |
| pnpm | 透過 corepack 啟用 | ✅ |
| Java | OpenJDK 17.0.18 | ✅（Phase 2 需要） |
| Maven | mvnw wrapper | ✅ |
| Docker | 29.3.1 | ✅ |

**重要決策：** Phase 1 採 Frontend First，後端 REST API（Phase 2）尚未實作，因此前端先對接 **Mock API 層**（Next.js Route Handlers 回傳 mock 資料），確保 `localhost:3000` 可獨立運行並通過 Playwright 驗證。Phase 3 再切換至真實後端。

---

## Phase 1：Frontend Revamp ✅

### 完成內容（client-next/）

| Task | 內容 | 狀態 |
|------|------|------|
| 1.1 | Next.js 16 + React 19 專案初始化、antd 6 / Ag-Grid 35 / TanStack Query v5 / react-hook-form / zod、Vitest + Playwright 設定 | ✅ |
| 1.2 | 認證頁面（Login / 2FA OTP / Reset Password）+ mock auth API | ✅ |
| 1.3 | Admin Layout（antd Layout Sider+Header）+ 動態導覽選單（依角色） | ✅ |
| 1.4 | User Management：Ag-Grid（分頁/搜尋/狀態 Tag）+ antd Modal + react-hook-form 表單 + CRUD | ✅ |
| 1.5 | Profile：Tabs（設定 / 2FA QRCode+OTP / 登入裝置） | ✅ |
| 1.6 | Error Pages（403/404/500 antd Result）+ 前端錯誤回報 | ✅ |

### 技術決策（與原 task.md 的差異）

- **版本升級**：實際安裝為 Next.js **16.2.9** + React **19.2** + antd **6.4** + Ag-Grid **35.3**（比 task.md 規劃的 Next 15 / antd 5 / Ag-Grid 32 更新），API 已對應調整。
- **Mock API 層**：Phase 1 後端未實作，前端對接內部 Route Handlers（`src/app/api/v1/**`）回傳 mock 資料；Phase 3 改 rewrite 至真實 Spring Boot 並移除 mock。
- **認證流程**：採 client fetch + httpOnly cookie（route handler 設定），未用 Server Action（Phase 3 可改）。
- **antd autoInsertSpace**：關閉（避免 CJK 按鈕字間插空格，影響無障礙名稱與測試定位）。

### ✅ Phase 1 驗收閘門結果

| 驗證項目 | 指令 | 結果 |
|---------|------|------|
| TypeScript 編譯 | `next build` | ✅ 0 errors，24 routes |
| 單元測試 | `vitest run` | ✅ 14/14 passed（4 files） |
| E2E 測試 | `playwright test` | ✅ 14/14 passed（auth/users/navigation/profile/error-pages） |
| 視覺驗證 | Playwright 截圖 | ✅ 6 張截圖存於 `.doc/screenshots/` |

### 環境注意

- **Port 3000**：原本被一個 root 權限的 `react.service`（systemd，跑 `firstreactapp` 的 react-scripts）佔用。已 `systemctl stop + disable` 永久停用，3000 釋放。
- **前端網址**：**http://localhost:3000**（E2E 已對 3000 驗證 14/14 通過）。
- **啟動指令**：`cd client-next && node_modules/.bin/next dev -p 3000`
- **測試帳號**：`admin` / `admin`（無 2FA）；`mfauser` / `admin`（2FA，驗證碼 `123456`）；`david3` / `david3`（一般 USER）。

### 已知限制（Known Limitations）

- **i18n 介面翻譯未實作**：語系選擇目前僅「儲存偏好」，UI 字串（選單/按鈕/表單/antd 內建元件）尚未跟著切換。已於使用者確認後決定**暫時擱置**，完整 i18n 留待後續階段（建議 Phase 3 接真實後端時一起做）。
- **測試帳號寫在 mock**：`admin/admin` 等帳號為 Phase 1 mock，Phase 3 接真實後端時移除。

### 產出檔案

- `client-next/`：完整 Next.js 前端（69 個原始檔）
- `.doc/screenshots/`：6 張頁面截圖
- thinking log：`.thinking-log/2026-06-13-phase1-*.md`
