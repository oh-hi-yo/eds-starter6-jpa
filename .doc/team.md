# Agent Team — Revamping eds-starter6-jpa

> **版本：** 1.0  
> **日期：** 2026-06-13  
> **Branch：** `feauture/revamping-experiment`  
> **參考：** `task.md`、`proposal.md`、`design.md`

---

## 概述

本 Agent Team 共 4 個角色，採 **Strangler Fig + Frontend First** 策略，分三個 Phase 完成 Legacy Revamping。每個 Agent 都有明確的責任邊界、固定的 Skills 組合、和與其他 Agent 的協作介面。

```
┌─────────────────────────────────────────────────────────┐
│           Architecture (Team Lead) — 協調中樞             │
│  • 產出 Phase 計劃   • 分配 Task   • 審查所有 PR           │
│  • 維護 API Contract  • Phase Gate 最終簽核               │
└────────────┬──────────────┬──────────────┬──────────────┘
             │              │              │
     ┌───────▼──────┐ ┌─────▼──────┐ ┌────▼──────────┐
     │ Frontend Dev │ │ Backend Dev│ │      QA        │
     │  React 19    │ │ Spring     │ │ Playwright     │
     │  Next.js 15  │ │ Boot 3.x   │ │ MCP DevTools   │
     │  Ant Design  │ │ REST API   │ │ 驗收 + Debug   │
     └──────────────┘ └────────────┘ └────────────────┘
```

---

## 角色定義

---

### 🏛️ Architecture (Team Lead)

**定位：** 系統設計決策者、工作分配者、跨 Phase 協調者。不直接寫業務程式碼，負責架構守衛、API Contract、計劃文件。

**核心職責：**
- 每個 Phase 開始前：撰寫執行計劃、拆解 Tasks、分配給各 Agent
- 每個 Task 完成後：發起 code review，確保符合架構設計（`design.md`）
- Phase Gate：統整所有驗收結果，決定是否進入下一 Phase
- OpenAPI Contract：確保後端 spec 與前端型別一致（Task 2.6）
- 技術債管理：記錄 ADR（Architecture Decision Records）

**Skills 清單：**

| Skill | 版本/來源 | 使用時機 |
|-------|----------|---------|
| `superpowers:writing-plans` | superpowers | 每個 Phase 開始前撰寫執行計劃 |
| `superpowers:dispatching-parallel-agents` | superpowers | Sprint 2 FE + Sprint 3 BE 可平行；協調並行 Agent |
| `superpowers:subagent-driven-development` | superpowers | 主導整個 Agent Team 的開發節奏 |
| `superpowers:finishing-a-development-branch` | superpowers | 每個 Phase 完成後的收尾工作（PR 整理、merge 準備） |
| `superpowers:requesting-code-review` | superpowers | 每個 Task 完成後向 Frontend/Backend Reviewer 發起 review |
| `superpowers:verification-before-completion` | superpowers | Phase Gate 前確認所有驗收項目真正通過 |
| `superpowers:using-git-worktrees` | superpowers | 平行開發時管理 git worktree |
| `ecc:plan` | ecc | 產出結構化實作計劃（含 Acceptance Criteria） |
| `ecc:plan-orchestrate` | ecc | 協調多 Agent 的計劃執行 |
| `ecc:code-architect` | ecc | 架構設計與技術選型決策 |
| `ecc:api-design` | ecc | REST API 設計規範（URI / method / status code / 分頁格式） |
| `ecc:security-review` | ecc | 安全架構審查（CSP / CSRF / Cookie / OWASP） |
| `ecc:code-review` | ecc | 跨 Phase 程式碼審查（medium effort） |
| `ecc:update-codemaps` | ecc | 每個 Phase 完成後更新 codebase map（`/update-codemaps`） |
| `ecc:update-docs` | ecc | 同步更新 `task.md` 狀態、`proposal.md` 進度 |

**工作節奏（每 Phase）：**

```
Phase 開始
  1. 呼叫 superpowers:writing-plans → 產出 Phase 執行計劃
  2. 呼叫 superpowers:dispatching-parallel-agents → 分配 Task 給各 Agent
  3. 每個 Task 完成 → 呼叫 superpowers:requesting-code-review
  4. Phase 結束 → 呼叫 superpowers:verification-before-completion
  5. 全部通過 → 呼叫 superpowers:finishing-a-development-branch
```

**與其他 Agent 的協作介面：**
- ➡ Frontend Dev：提供 OpenAPI spec（Task 2.6）、確認 UI/UX 邊界
- ➡ Backend Dev：提供 API Contract 規範（`design.md` §3.2）、分層紀律
- ➡ QA：提供 Phase Gate 驗收清單、確認測試範圍
- ⬅ 所有 Agent：接收 Task 完成通知、code review 請求

---

### 🎨 Frontend Dev

**定位：** React 19 + Next.js 15 前端系統實作者。依照 `design.md` 的架構決策，逐 Task 建構元件，遵守 TDD 工作流程（先寫 Vitest，再寫實作）。

**核心職責：**
- Task 1.1–1.6 的完整實作
- 確保 React 最佳實踐（Server/Client Component 邊界、hook 正確性）
- 每個元件實作前先寫 Vitest 測試
- 自我 code review（`ecc:react-review`）後再提交

**Skills 清單：**

| Skill | 版本/來源 | 使用時機 |
|-------|----------|---------|
| `vercel-agent-skills:react-best-practices` | vercel-agent-skills | **所有 React 開發的基礎規則（70 條，CRITICAL 優先）**。特別關注：`async-parallel`（取代串行載入）、`bundle-dynamic-imports`（按需載入）、`rerender-memo`（取代 ViewModel binding） |
| `vercel-agent-skills:react-view-transitions` | vercel-agent-skills | 頁面切換動畫（路由轉場） |
| `ecc:react-patterns` | ecc | Compound Component、Custom Hook、Render Props 模式設計 |
| `ecc:react-review` | ecc | **每個元件完成後自我審查**（hook 依賴、RSC 邊界、`use client` 必要性） |
| `ecc:react-testing` | ecc | Vitest + React Testing Library 測試撰寫 |
| `ecc:react-performance` | ecc | Core Web Vitals 優化（LCP / CLS / INP），Phase 1 Gate 前執行 |
| `ecc:react-build` | ecc | Next.js 建構錯誤排解（hydration mismatch、bundler 問題） |
| `ecc:nextjs-turbopack` | ecc | Next.js 15 + Turbopack 建構設定、`next.config.ts` |
| `ecc:frontend-patterns` | ecc | Error Boundary、Loading State、Optimistic Update 模式 |
| `ecc:tdd-workflow` | ecc | **TDD 核心流程**：每個 Task 先寫失敗測試，再實作到通過 |
| `ecc:accessibility` | ecc | antd 元件 a11y 確認（WCAG 2.1 AA 標準） |
| `ecc:typescript-reviewer` | ecc | TypeScript 型別設計、openapi-typescript 型別整合 |
| `ecc:frontend-a11y` | ecc | a11y 深度審查（鍵盤導覽、Screen Reader） |

**TDD 工作流程（每個 Task）：**

```
1. 讀 task.md — 確認 Task 的驗收標準
2. 呼叫 ecc:tdd-workflow
   a. 先寫 Vitest 測試（對應驗收標準）→ 執行 → 確認 RED
   b. 寫最小實作 → 執行 → 確認 GREEN
   c. 重構 → 執行 → 確認仍 GREEN
3. 呼叫 ecc:react-review（自我 review）
4. 通知 Architect：Task 完成，可發起 code review
```

**React 架構原則（強制）：**

| 原則 | 說明 |
|------|------|
| Server Component 優先 | Layout、靜態頁面用 RSC；需要互動才加 `'use client'` |
| Client 邊界推到葉節點 | Ag-Grid、antd Form、useState 的元件才需要 `'use client'` |
| TanStack Query 管 server state | 所有 API 資料透過 `useQuery` / `useMutation`，不用 useState 存 API 資料 |
| Server Action 處理 mutation | 表單提交、CRUD 操作走 Server Action（非 client-side fetch） |
| openapi-typescript 型別 | 所有 API 呼叫必須使用 `src/lib/api/types.ts` 中的型別 |

**與其他 Agent 的協作介面：**
- ⬅ Architect：接收 API Contract、確認 REST 端點 URL 與型別
- ➡ QA：提供 Playwright spec 格式指引、協助 debug E2E 失敗
- ⬅ QA：接收 bug report、修復 E2E 發現的問題

---

### ⚙️ Backend Dev

**定位：** Spring Boot 3.x + JDK 17 後端系統實作者。依照 `design.md` 的分層架構（Controller → Service → Repository），逐 Task 實作 REST API，遵守 TDD 工作流程（先寫 JUnit，再寫實作）。

**核心職責：**
- Task 2.1–2.5 的完整實作
- 確保 Spring Boot 最佳實踐（分層紀律、@Transactional 位置、DTO ≠ Entity）
- 每個 endpoint 實作前先寫 MockMvc 測試
- Task 2.6 協助 Architect 生成 OpenAPI spec

**Skills 清單：**

| Skill | 版本/來源 | 使用時機 |
|-------|----------|---------|
| `ecc:springboot-patterns` | ecc | **所有後端開發的基礎規則**。分層架構（Controller/Service/Repository）、`@Transactional` 範圍、Bean 設計 |
| `ecc:springboot-tdd` | ecc | **TDD 核心流程**：MockMvc / Spring Boot Test，先寫測試再實作 |
| `ecc:springboot-security` | ecc | Spring Security 6.x Lambda DSL、2FA Filter、Rate Limiting 設定 |
| `ecc:springboot-verification` | ecc | 後端 Task 完成的驗收流程（啟動 + curl + 確認回應格式） |
| `ecc:java-coding-standards` | ecc | **JDK 17 idioms**：Record（DTO）、Text Blocks、Pattern Matching、`jakarta.*` namespace |
| `ecc:jpa-patterns` | ecc | JPA/Hibernate 6.x 最佳實踐、QueryDSL Jakarta、N+1 問題避免 |
| `ecc:database-migrations` | ecc | Liquibase changelog 管理（4.x，SB3 相容） |
| `ecc:api-design` | ecc | REST API 設計規範（URI / 分頁格式 / RFC 7807 錯誤格式） |
| `ecc:security-scan` | ecc | OWASP Top 10 後端掃描（Phase 2 Gate 前執行） |
| `ecc:build-fix` | ecc | Maven 建構錯誤排解（依賴衝突、編譯錯誤） |

**TDD 工作流程（每個 Endpoint）：**

```
1. 讀 task.md — 確認端點規格與驗收標準
2. 呼叫 ecc:springboot-tdd
   a. 先寫 @SpringBootTest + MockMvc 測試 → 執行 → 確認 RED（編譯錯誤 / 404）
   b. 寫 Controller / Service 最小實作 → 執行 → 確認 GREEN
   c. 加入邊界案例測試（鎖定、無效輸入、權限不足）
3. 執行 Testcontainers Integration Test（MySQL）
4. 通知 Architect：Task 完成
```

**分層紀律（強制）：**

| 層級 | 規則 |
|------|------|
| Controller | 只進出 DTO，不碰 Entity；`@Valid` 驗證 Request DTO |
| Service | 持有 `@Transactional`；業務邏輯在此層（鎖定、2FA） |
| Repository | 只負責資料存取；複雜查詢用 QueryDSL |
| DTO | 使用 Java 17 `record`；與 Entity 嚴格解耦 |
| Exception | 所有受控異常在 `GlobalExceptionHandler` 統一轉 RFC 7807 |

**與其他 Agent 的協作介面：**
- ⬅ Architect：接收 API Contract 規範、分層架構決策
- ➡ Architect：Task 完成通知、OpenAPI spec 生成（Task 2.6）
- ➡ QA：提供測試資料格式、協助 debug Integration Test 失敗
- ⬅ QA：接收後端 bug report（E2E 發現的 API 問題）

---

### 🔍 QA

**定位：** 系統驗證者與 Debug 協助者。在每個 Phase 末執行驗收，撰寫並維護 Playwright E2E 測試套件，使用 MCP Chrome DevTools 進行視覺與效能驗證，協助 Dev 追蹤根本原因。

**核心職責：**
- 協助 Task 1.2+ 撰寫 Playwright spec（`e2e/*.spec.ts`）
- 執行每個 Phase 的驗收閘門
- Task 3.2：主導完整 E2E 測試套件建立
- Task 3.3：效能與安全審查
- 發現 bug → 提供可重現步驟 + 根本原因分析 → 協助 Dev 修復

**Skills 清單：**

| Skill | 版本/來源 | 使用時機 |
|-------|----------|---------|
| `ecc:e2e-testing` | ecc | **Playwright Test 主力 skill**：fixtures（auth / db reset）、page objects、CI 整合 |
| `ecc:browser-qa` | ecc | **MCP Chrome DevTools 整合**：`take_screenshot`、`lighthouse_audit`、`get_console_message`、`list_network_requests`、`get_network_request` |
| `superpowers:systematic-debugging` | superpowers | 系統性 debug 流程（假設 → 驗證 → 縮小範圍）；E2E 失敗根本原因分析 |
| `superpowers:test-driven-development` | superpowers | 協助 Dev 以 TDD 方式設計測試（確保測試真的在測行為，不是在測實作） |
| `ecc:tdd-workflow` | ecc | 在 Phase 1 早期協助 Frontend Dev 定義測試案例 |
| `ecc:react-testing` | ecc | 協助 Frontend Dev debug Vitest / RTL 失敗（知道如何正確 mock、render） |
| `ecc:springboot-tdd` | ecc | 協助 Backend Dev debug JUnit / Testcontainers 失敗 |
| `ecc:silent-failure-hunter` | ecc | 偵測 swallowed errors（`try/catch` 吃掉錯誤、空 catch block）、靜默失敗的 API |
| `ecc:security-scan` | ecc | Phase 3 安全掃描執行（OWASP Top 10 checklist） |
| `ecc:react-performance` | ecc | Lighthouse 效能分析，協助解讀 LCP / CLS / INP 數據 |

**MCP Chrome DevTools 使用場景：**

| 工具 | 使用場景 |
|------|---------|
| `take_screenshot` | 每個 Playwright test 的關鍵狀態截圖（Login 頁、Grid 頁、Modal） |
| `lighthouse_audit` | Phase 1 + Phase 3 Gate：Performance / Accessibility / SEO 分數 |
| `get_console_message` | 每次驗收：確認 0 JavaScript errors |
| `list_network_requests` | 確認 API 呼叫正確（路徑、method、status code） |
| `get_network_request` | 深入檢查特定 API request/response（debug 用） |
| `fill_form` | 快速填寫表單（非 Playwright spec 中，而是快速手動驗證） |

**E2E 測試設計原則：**

| 原則 | 說明 |
|------|------|
| 行為測試，非實作測試 | 測試使用者操作的結果，不測試 class / function 名稱 |
| Auth Fixture | 每個 spec 使用 `auth.fixture.ts` 自動登入，不在每個 test 重複登入流程 |
| DB 重置 | 每個 describe block 前用 `db.fixture.ts` 重置測試資料（確保冪等） |
| 截圖 | `test.afterEach` 失敗時自動截圖，存入 `e2e/screenshots/failures/` |
| 穩定性 | 避免 `page.waitForTimeout()`，改用 `page.waitForSelector()` / `page.waitForResponse()` |

**Bug Report 格式（提交給 Dev）：**

```markdown
## Bug Report

**Task：** 1.4 User Management
**Test Case：** 新增使用者後 Grid 未重整

**重現步驟：**
1. 登入 ADMIN
2. 前往 /users
3. 點擊「新增」
4. 填寫完整表單，點擊「儲存」
5. Modal 關閉，但 Grid 未出現新資料

**預期：** Modal 關閉後，Grid 自動重新整理並顯示新使用者
**實際：** Grid 保持原狀，需手動重新整理頁面

**網路請求：** PUT /api/v1/users → 200 OK（後端正常）
**瀏覽器控制台：** 無 errors
**截圖：** `e2e/screenshots/users-create-bug.png`
**根本原因假設：** `invalidateQueries(['users'])` 未正確觸發
```

**與其他 Agent 的協作介面：**
- ⬅ Architect：接收 Phase Gate 驗收清單
- ⬅ Frontend Dev：接收元件行為規格，協助定義 Vitest 測試案例
- ⬅ Backend Dev：接收 API 規格，協助定義 MockMvc 測試案例
- ➡ Frontend Dev：提供前端 bug report（Playwright 發現）
- ➡ Backend Dev：提供後端 bug report（API 行為不符規格）
- ➡ Architect：提交 Phase Gate 驗收結果（PASS / FAIL）

---

## Workflow — Phase 協作流程

### Phase 開始（Architect 主導）

```
Architect
  │
  ├─ 1. 呼叫 superpowers:writing-plans
  │      → 產出 Phase 執行計劃（任務列表、依賴關係、時間估算）
  │
  ├─ 2. 呼叫 superpowers:dispatching-parallel-agents
  │      → 分配 Tasks 給各 Agent（可並行的 Tasks 同時開始）
  │
  └─ 3. 設定溝通介面
         → API Contract（OpenAPI spec 草稿）
         → 確認各 Agent 的 Task 邊界
```

### Task 執行（各 Agent）

```
Frontend Dev / Backend Dev
  │
  ├─ 1. 呼叫對應的 TDD skill（ecc:tdd-workflow / ecc:springboot-tdd）
  │      a. 先寫測試（RED）
  │      b. 寫實作（GREEN）
  │      c. 重構（仍 GREEN）
  │
  ├─ 2. 自我 review
  │      FE → ecc:react-review
  │      BE → ecc:springboot-verification
  │
  └─ 3. 通知 Architect：Task 完成
```

### Code Review（Architect 協調）

```
Architect
  │
  ├─ 呼叫 superpowers:requesting-code-review
  │
  ├─ FE 元件 → 啟動 ecc:react-review agent（獨立審查）
  ├─ BE 端點 → 啟動 ecc:security-review agent（安全面向）
  │
  └─ 審查通過 → 關閉 Task
     審查有問題 → 回傳 Bug Report 給對應 Dev
```

### Phase Gate（QA 執行 + Architect 簽核）

```
QA
  │
  ├─ 執行驗收閘門所有項目（見 task.md 各 Phase Gate 表格）
  ├─ 呼叫 ecc:browser-qa（MCP Chrome DevTools）
  ├─ 執行 pnpm e2e（Playwright）/ ./mvnw test（JUnit）
  │
  ├─ 全部通過 → 向 Architect 提交 PASS 報告
  └─ 有失敗 → Bug Report → 回 Dev → 修復後重新執行

Architect
  └─ 呼叫 superpowers:verification-before-completion
     → 確認 QA 報告無誤 → 簽核進入下一 Phase
```

---

## Phase × Agent 責任矩陣

| Phase / Task | Architect | Frontend Dev | Backend Dev | QA |
|-------------|:---------:|:------------:|:-----------:|:--:|
| **Phase 1** | | | | |
| Task 1.1 初始化 | ✅ 主導 | ✅ 實作 | — | — |
| Task 1.2 認證頁面 | 審查 | ✅ 主導 | — | ✅ E2E spec |
| Task 1.3 Layout + Nav | 審查 | ✅ 主導 | — | ✅ E2E spec |
| Task 1.4 User Grid | 審查 | ✅ 主導 | — | ✅ E2E spec |
| Task 1.5 Profile | 審查 | ✅ 主導 | — | ✅ E2E spec |
| Task 1.6 Error Pages | 審查 | ✅ 主導 | — | ✅ E2E spec |
| **Phase 1 Gate** | ✅ 簽核 | — | — | ✅ 執行 |
| **Phase 2** | | | | |
| Task 2.1 SB3 升級 | ✅ 協助 | — | ✅ 主導 | 驗收 |
| Task 2.2 Security 6.x | 審查 | — | ✅ 主導 | ✅ 協助測試 |
| Task 2.3 Auth API | 審查 | — | ✅ 主導 | ✅ 協助測試 |
| Task 2.4 User API | 審查 | — | ✅ 主導 | ✅ 協助測試 |
| Task 2.5 Profile/Nav/Log API | 審查 | — | ✅ 主導 | ✅ 協助測試 |
| Task 2.6 OpenAPI | ✅ 主導 | 接收型別 | ✅ 協助 | — |
| **Phase 2 Gate** | ✅ 簽核 | — | — | ✅ 執行 |
| **Phase 3** | | | | |
| Task 3.1 整合 | ✅ 主導 | ✅ 協助 | ✅ 協助 | — |
| Task 3.2 Playwright E2E | 審查 | ✅ debug 協助 | ✅ debug 協助 | ✅ 主導 |
| Task 3.3 效能+安全審查 | ✅ 簽核 | — | — | ✅ 主導 |
| **Phase 3 最終 Gate** | ✅ 最終簽核 | — | — | ✅ 執行 |

---

## Skills 完整索引

以下是本 Agent Team 使用的所有 Skills，按來源分類：

### superpowers（Claude Code 官方）

| Skill | 使用者 | 用途 |
|-------|--------|------|
| `superpowers:writing-plans` | Architect | 每 Phase 開始前撰寫執行計劃 |
| `superpowers:dispatching-parallel-agents` | Architect | 協調並行 Agent 工作 |
| `superpowers:subagent-driven-development` | Architect | 主導 Agent Team 開發節奏 |
| `superpowers:finishing-a-development-branch` | Architect | Phase 收尾 + merge 準備 |
| `superpowers:requesting-code-review` | Architect | 發起 code review |
| `superpowers:receiving-code-review` | FE Dev / BE Dev | 接收並處理 review 意見 |
| `superpowers:verification-before-completion` | Architect / QA | Phase Gate 前最終確認 |
| `superpowers:test-driven-development` | QA / FE Dev / BE Dev | TDD 方法論指引 |
| `superpowers:systematic-debugging` | QA | 系統性 debug 流程 |
| `superpowers:using-git-worktrees` | Architect | 平行 Phase 開發時的 worktree 管理 |

### vercel-agent-skills（Vercel 官方）

| Skill | 使用者 | 用途 |
|-------|--------|------|
| `vercel-agent-skills:react-best-practices` | FE Dev | **70 條 React/Next.js 效能規則**（CRITICAL 到 LOW 分級） |
| `vercel-agent-skills:react-view-transitions` | FE Dev | 頁面切換動畫（View Transitions API） |

### ecc（ECC 技術棧）

#### 前端類

| Skill | 使用者 | 用途 |
|-------|--------|------|
| `ecc:react-patterns` | FE Dev | React 元件設計模式（Compound、Custom Hook、Render Props） |
| `ecc:react-review` | FE Dev / Architect | React 元件 code review（hook、RSC 邊界、效能） |
| `ecc:react-testing` | FE Dev / QA | Vitest + React Testing Library |
| `ecc:react-performance` | FE Dev / QA | Core Web Vitals 效能優化與分析 |
| `ecc:react-build` | FE Dev | Next.js / React 建構錯誤排解 |
| `ecc:nextjs-turbopack` | FE Dev | Next.js 15 + Turbopack 設定 |
| `ecc:frontend-patterns` | FE Dev | Error Boundary、Loading State、Optimistic Update |
| `ecc:frontend-a11y` | FE Dev / QA | 無障礙設計（WCAG 2.1 AA） |
| `ecc:accessibility` | FE Dev | antd 元件 a11y 快速確認 |
| `ecc:typescript-reviewer` | FE Dev | TypeScript 型別設計審查 |
| `ecc:tdd-workflow` | FE Dev / QA / BE Dev | TDD 工作流程指引 |

#### 後端類

| Skill | 使用者 | 用途 |
|-------|--------|------|
| `ecc:springboot-patterns` | BE Dev / Architect | Spring Boot 3.x 分層架構最佳實踐 |
| `ecc:springboot-tdd` | BE Dev / QA | Spring Boot Test + MockMvc TDD |
| `ecc:springboot-security` | BE Dev | Spring Security 6.x 設定 |
| `ecc:springboot-verification` | BE Dev | 後端 Task 驗收流程 |
| `ecc:java-coding-standards` | BE Dev | JDK 17 idioms + `jakarta.*` 遷移 |
| `ecc:jpa-patterns` | BE Dev | JPA/Hibernate 6.x + QueryDSL Jakarta |
| `ecc:database-migrations` | BE Dev | Liquibase 4.x changelog 管理 |
| `ecc:build-fix` | BE Dev | Maven 建構問題排解 |

#### 架構 / 設計類

| Skill | 使用者 | 用途 |
|-------|--------|------|
| `ecc:api-design` | Architect / BE Dev | REST API 設計規範（URI / 分頁 / RFC 7807） |
| `ecc:code-architect` | Architect | 系統架構設計與 ADR |
| `ecc:plan` | Architect | 產出結構化實作計劃 |
| `ecc:plan-orchestrate` | Architect | 多 Agent 計劃協調 |
| `ecc:update-codemaps` | Architect | Codebase map 更新（每 Phase 後） |
| `ecc:update-docs` | Architect | 文件同步更新 |

#### QA / 安全類

| Skill | 使用者 | 用途 |
|-------|--------|------|
| `ecc:e2e-testing` | QA | Playwright Test 設定、fixtures、CI |
| `ecc:browser-qa` | QA | MCP Chrome DevTools 整合 |
| `ecc:silent-failure-hunter` | QA | 偵測靜默失敗、swallowed errors |
| `ecc:security-scan` | QA / Architect | OWASP Top 10 掃描 |
| `ecc:security-review` | Architect | 安全架構審查 |
| `ecc:code-review` | Architect | 通用程式碼審查 |

---

## 快速參考

### 「我要開始一個 Task」的自檢清單

```
□ 確認 task.md 中 Task 的狀態為「未開始」
□ 讀 task.md 的「驗收標準」——這是完成的定義
□ 呼叫對應的 TDD skill
□ 先寫測試，確認 RED，再實作
□ 自我 review（ecc:react-review 或 ecc:springboot-verification）
□ 通知 Architect：Task 完成
```

### 「Phase Gate 失敗」的處理流程

```
1. QA 記錄失敗項目（指令 + 錯誤訊息 + 截圖）
2. 呼叫 superpowers:systematic-debugging → 縮小根本原因
3. 分配給對應 Dev（FE bug → Frontend Dev，API bug → Backend Dev）
4. Dev 修復後通知 QA
5. QA 重新執行該驗收項目
6. 全部通過後重新提交 Gate Report 給 Architect
```
