# Revamping Proposal — eds-starter6-jpa

> **版本：** 1.0  
> **日期：** 2026-06-13  
> **作者：** Claude Code (Harness Engineering Practice)  
> **參考：** `product-features.md`、`CLAUDE.md`

---

## 1. Executive Summary

### 現況問題

`eds-starter6-jpa` 是一個建立於 2016–2018 年的 Legacy 企業後台應用，技術棧已嚴重老化：

| 問題 | 說明 |
|------|------|
| **ExtJS 6.5 商業授權** | 高授權成本，生態系萎縮，幾乎無社群支援 |
| **Ext Direct 協議** | 非標準 RPC 協議，難以與現代工具（API Gateway、OpenAPI）整合 |
| **Spring Boot 2.7** | 2023 年底已 EOL，無安全性更新 |
| **Java 8 Legacy API** | `javax.*` 命名空間，不相容 Jakarta EE 9+ |
| **Sencha CMD 建構** | 封閉生態，無法使用現代前端工具鏈（Vite、Turbopack、Tree-shaking） |

### 目標

將此應用改造為現代化全端架構：

```
ExtJS 6.5 + Spring Boot 2.7 + Java legacy
         ↓  Harness Engineering Revamping
React 19 + Next.js 15 + Spring Boot 3.x + JDK 17
```

保留全部既有功能（8 個模組），不新增功能，確保行為一致性。

---

## 2. 建議策略：Frontend First

### 為何先翻前端？

**理由 1：解除 Sencha 依賴最緊迫**
ExtJS 授權費用每年都在產生，且 Sencha CMD 是建構流程的瓶頸。先替換前端可立即解除此依賴。

**理由 2：後端 API 可漸進演進**
Spring Boot 後端目前透過 Ext Direct 提供服務。Revamping 期間可新增 REST endpoints 與舊 Ext Direct 並行，前端新版本切換至 REST，完成後才移除舊端點。這讓後端升級風險降到最低。

**理由 3：前端測試更直觀**
React 元件可用 Playwright + MCP Chrome DevTools 做視覺回歸測試，立即驗證 UI 行為是否與 Legacy 一致。

**理由 4：學習 Harness Engineering 的最佳切入點**
前端有清晰的元件邊界（8 個 ExtJS view → 8 個 React 頁面/元件），非常適合練習「一個 Agent 負責一個模組」的 Agent Team 模式。

### 三階段計劃

```
Phase 1: Frontend Revamp     Phase 2: Backend Migration    Phase 3: E2E Validation
─────────────────────────    ──────────────────────────    ───────────────────────
ExtJS → React 19             Spring Boot 2.7 → 3.x         Playwright + MCP
Next.js 15 App Router        JDK 17                         自動化回歸測試
Tailwind CSS / shadcn/ui     Ext Direct → REST API          Agent 驗收
並行使用後端舊 API             Jakarta EE 遷移
4–6 週                        2–3 週                         1–2 週
```

---

## 3. Phase 1：ExtJS → React 19 + Next.js 15

### 3.1 架構決策

| 決策 | 選擇 | 理由 |
|------|------|------|
| 框架 | Next.js 15 App Router | SSR + CSR 混合，對應 ExtJS 的 SPA 行為 |
| UI 元件庫 | shadcn/ui + Tailwind CSS | 無授權費，現代設計系統 |
| 狀態管理 | React 19 Server Components + `useState` / `useReducer` | 符合 React 19 idiom，避免過度工程 |
| 資料獲取 | SWR（client）/ Next.js fetch cache（server） | 對應 ExtJS Store 的自動重新整理行為 |
| 認證 | NextAuth.js v5 或 Spring Session + Cookie | 與後端 Spring Security 整合 |
| 表單 | React Hook Form + Zod | 對應 ExtJS Form 的 validate 機制 |
| 資料表格 | TanStack Table v8 | 對應 ExtJS Grid 的分頁、排序、過濾 |
| 路由 | App Router（`/app` 目錄） | 對應 ExtJS Navigation 模組的路由 |

### 3.2 ExtJS → React 元件對照

| ExtJS 模組 | 檔案 | React 對應 |
|-----------|------|-----------|
| `view/main/Main.js` | 主框架 + 導覽 | `app/layout.tsx` + `components/Sidebar.tsx` |
| `view/auth/Dialog.js` | 登入對話框 | `app/(auth)/login/page.tsx` |
| `view/user/Grid.js` | 使用者列表 | `app/users/page.tsx` + `components/UsersTable.tsx` |
| `view/user/Form.js` | 使用者表單 | `components/UserForm.tsx` (React Hook Form) |
| `view/userconfig/Panel.js` | 個人設定 | `app/profile/page.tsx` |
| `view/main/Error403.js` | 403 頁面 | `app/forbidden.tsx` |
| `view/main/Error404.js` | 404 頁面 | `app/not-found.tsx` |
| `view/main/Error500.js` | 500 頁面 | `app/error.tsx` |

### 3.3 引用的 Skills（Phase 1）

#### `vercel-agent-skills:react-best-practices`
70 條 React + Next.js 效能規則，依優先級分 8 類。Phase 1 最關鍵的規則：

| 優先級 | 分類 | 相關規則 |
|--------|------|---------|
| CRITICAL | Eliminating Waterfalls | `async-parallel`（替換 ExtJS Store 的串行載入）、`async-suspense-boundaries`（替換 ExtJS loadMask） |
| CRITICAL | Bundle Size Optimization | `bundle-dynamic-imports`（替換 ExtJS 的按需載入）、`bundle-barrel-imports`（避免整包 import） |
| HIGH | Server-Side Performance | `server-cache-react`（替換 ExtJS Store cache）、`server-parallel-fetching`（並行 API 呼叫） |
| MEDIUM | Re-render Optimization | `rerender-memo`（替換 ExtJS ViewModel binding）、`rerender-no-inline-components` |
| MEDIUM | Rendering Performance | `rendering-conditional-render`（替換 ExtJS `hidden` binding）、`rendering-usetransition-loading` |

#### `ecc:react-patterns`
React 元件設計模式，用於：
- Compound Component 模式（替換 ExtJS `items` 配置）
- Render Props / Slot 模式（替換 ExtJS `xtype` 擴展機制）
- Custom Hook 模式（替換 ExtJS Controller 邏輯）

#### `ecc:react-review`
每個 React 元件完成後執行 code review，確保：
- Hook 使用正確（無 stale closure、dependency array 完整）
- Server / Client Component 邊界正確
- 無不必要的 `use client` directive

#### `ecc:react-testing`
- Unit test：React Testing Library（元件行為測試）
- 對應 ExtJS 的 Controller spec 測試

#### `ecc:react-performance`
- 用於最終效能審查
- 確保 Core Web Vitals（LCP、CLS、INP）優於 Legacy ExtJS

#### `ecc:nextjs-turbopack`
- 設定 Next.js 15 + Turbopack 建構流程
- 替換 Sencha CMD 建構

#### `ecc:frontend-patterns`
- 通用前端模式（Error Boundary、Loading State、Optimistic Update）
- 確保與 Legacy UX 行為一致

#### `ecc:tdd-workflow`
- 先寫測試定義元件行為，再實作
- 每個 ExtJS view 對應一個 React 元件測試檔

---

## 4. Phase 2：Spring Boot 2.7 → 3.x + JDK 17

### 4.1 主要遷移工作

| 工作項目 | 說明 |
|---------|------|
| `javax.*` → `jakarta.*` | 所有 Entity、Validation、Servlet 相關 import |
| Spring Boot 3.x 升級 | `pom.xml` parent 版本更新 |
| Ext Direct → REST API | 新增 `@RestController`，逐步取代 `@ExtDirectMethod` |
| QueryDSL Jakarta 版本 | 升級至相容 JPA 3.x 的版本 |
| Spring Security 6.x | SecurityFilterChain 設定方式變更（棄用 WebSecurityConfigurerAdapter） |
| Hibernate 6.x | 部分 HQL 語法調整 |

### 4.2 REST API 設計（Ext Direct → REST 對照）

| Ext Direct Method | REST Endpoint | HTTP Method |
|-------------------|---------------|-------------|
| `securityService.getAuthUser` | `/api/auth/me` | GET |
| `securityService.resetRequest` | `/api/auth/password-reset-request` | POST |
| `securityService.reset` | `/api/auth/password-reset` | POST |
| `securityService.signin2fa` | `/api/auth/2fa/verify` | POST |
| `securityService.switchUser` | `/api/auth/switch-user/{id}` | POST |
| `userService.read` | `/api/users` | GET（含分頁/篩選） |
| `userService.update` | `/api/users/{id}` | PUT / POST |
| `userService.destroy` | `/api/users/{id}` | DELETE |
| `userService.readAuthorities` | `/api/authorities` | GET |
| `userService.unlock` | `/api/users/{id}/unlock` | POST |
| `userService.disableTwoFactorAuth` | `/api/users/{id}/2fa/disable` | DELETE |
| `userService.sendPassordResetEmail` | `/api/users/{id}/password-reset-email` | POST |
| `userConfigService.readSettings` | `/api/profile/settings` | GET |
| `userConfigService.updateSettings` | `/api/profile/settings` | PUT |
| `userConfigService.enable2f` | `/api/profile/2fa/enable` | POST |
| `userConfigService.disable2f` | `/api/profile/2fa/disable` | DELETE |
| `userConfigService.readPersistentLogins` | `/api/profile/sessions` | GET |
| `userConfigService.destroyPersistentLogin` | `/api/profile/sessions/{series}` | DELETE |
| `navigationService.getNavigation` | `/api/navigation` | GET |
| `logService.logClientCrash` | `/api/logs/client-error` | POST |

### 4.3 引用的 Skills（Phase 2）

#### `ecc:springboot-patterns`
- Spring Boot 3.x 最佳實踐
- `@RestController` + `@Service` + `@Repository` 分層架構
- 錯誤處理：`@ControllerAdvice` + `ProblemDetail`（RFC 7807）

#### `ecc:springboot-tdd`
- 後端 TDD：先寫 `@SpringBootTest` integration test，再實作
- MockMvc / RestAssured 測試 REST endpoints

#### `ecc:java-coding-standards`
- JDK 17 idioms：Record、Text Blocks、Pattern Matching、Sealed Classes
- `javax.*` → `jakarta.*` 全面替換

#### `ecc:api-design`
- RESTful API 設計規範
- OpenAPI 3.x / Swagger UI 文件生成
- 統一 response 格式（PageResult、ApiResponse wrapper）

#### `ecc:database-migrations`
- Liquibase changelog 管理（保留現有 `db/changelog.xml`）
- JDK 17 + Hibernate 6.x 相容的 migration 策略

#### `ecc:security-scan`
- Spring Security 6.x 設定審查
- OWASP Top 10 掃描
- JWT / Session Token 安全性檢查

---

## 5. Phase 3：E2E 測試驗收（Playwright + MCP）

### 5.1 測試策略

每個功能模組對應一個 Playwright test suite，驗證 Revamped 應用行為與 Legacy 一致：

| 測試場景 | 驗收標準 |
|---------|---------|
| 登入 / 登出 | 正確重導向、Session 建立 |
| 2FA 設定 | QRCode 顯示、TOTP 驗證通過 |
| 帳號鎖定 | 10 次失敗後鎖定 30 分鐘 |
| 使用者 CRUD | 新增/編輯/刪除後列表更新 |
| 分頁/排序/搜尋 | 與 Legacy Grid 行為一致 |
| Remember-Me | Cookie 31 天後自動登入 |
| 權限控制 | ADMIN / USER 看到不同選單 |
| 錯誤頁面 | 403 / 404 / 500 正確顯示 |

### 5.2 引用的 Skills（Phase 3）

#### `ecc:e2e-testing`
- Playwright Test 設定（page fixtures、authentication helpers）
- 測試資料準備（H2 測試資料庫初始化）
- CI 整合（headless mode）

#### `ecc:browser-qa`
- 搭配 **MCP Chrome DevTools** 做視覺驗證
- `mcp__plugin_ecc_chrome-devtools__take_screenshot` 截圖對比
- `mcp__plugin_ecc_chrome-devtools__lighthouse_audit` 效能審查
- `mcp__plugin_ecc_chrome-devtools__get_console_message` 錯誤偵測
- `mcp__plugin_ecc_chrome-devtools__list_network_requests` API 呼叫驗證

---

## 6. Agent Team Skills 索引

完整的 Agent Team 結構與各角色引用的 Skills：

| Agent 角色 | 負責範圍 | 引用 Skills |
|-----------|---------|------------|
| **Architect** | 架構決策、API 設計審查 | `ecc:api-design`、`ecc:react-patterns`、`ecc:springboot-patterns` |
| **Frontend Dev** | React 元件實作 | `vercel-agent-skills:react-best-practices`、`ecc:react-patterns`、`ecc:nextjs-turbopack`、`ecc:frontend-patterns` |
| **Frontend Reviewer** | 前端 Code Review | `ecc:react-review`、`ecc:react-performance` |
| **Backend Dev** | REST API 實作、Spring Boot 升級 | `ecc:springboot-patterns`、`ecc:java-coding-standards`、`ecc:database-migrations` |
| **Backend Reviewer** | 後端 Code Review | `ecc:springboot-tdd`、`ecc:security-scan` |
| **QA Agent** | E2E 測試撰寫與執行 | `ecc:e2e-testing`、`ecc:browser-qa`、`ecc:tdd-workflow` |
| **Orchestrator** | Agent 協作編排、進度追蹤 | `superpowers:dispatching-parallel-agents`、`superpowers:subagent-driven-development`、`ecc:plan-orchestrate`、`ecc:team-builder` |

---

## 7. Sprint 規劃建議

### Sprint 0（準備，1 週）
- [x] `CLAUDE.md` — 專案上下文
- [x] `product-features.md` — 功能說明
- [x] `proposal.md` — 本提案
- [ ] `task.md` — 工作項目拆解
- [ ] `team.md` — Agent 角色定義

### Sprint 1（前端基礎，1 週）
- [ ] Next.js 15 專案初始化（`client-new/`）
- [ ] 認證流程（Login / 2FA / Logout）
- [ ] 主框架 + 動態導覽選單

### Sprint 2（前端核心，1–2 週）
- [ ] 使用者管理頁面（列表 + 表單）
- [ ] 使用者設定頁面
- [ ] 錯誤頁面（403 / 404 / 500）

### Sprint 3（後端升級，1–2 週）
- [ ] Spring Boot 3.x + JDK 17 升級
- [ ] REST API 實作（全部 20 個 endpoints）
- [ ] Spring Security 6.x 重設定

### Sprint 4（整合 + 驗收，1 週）
- [ ] 前後端完整整合
- [ ] Playwright E2E 測試（8 個模組）
- [ ] MCP Chrome DevTools 視覺驗證
- [ ] 效能審查（Lighthouse）

---

## 8. 風險與緩解

| 風險 | 可能性 | 緩解策略 |
|------|--------|---------|
| ExtJS Grid 複雜行為難以 1:1 複製 | 中 | 先用 TanStack Table 實作基本功能，複雜互動用 Playwright 錄製後比對 |
| Spring Boot 3.x 升級後 Ext Direct 不相容 | 高 | Phase 1 期間後端保持 2.7，Phase 2 才升級；前後端完全分離後再升 |
| 2FA TOTP 邏輯複雜 | 低 | 直接保留 `secret` + ZXing 邏輯，僅換 HTTP 端點 |
| H2 → MySQL 行為差異 | 低 | 保留現有 Liquibase changelog，不更換資料庫 |
| Agent Harness 學習曲線 | 中 | 從最簡單的模組（Navigation、Error Pages）開始，建立成功模式後再擴大 |
