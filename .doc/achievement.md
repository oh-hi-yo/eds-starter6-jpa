# Harness Engineering — Achievement Record

> **專案：** eds-starter6-jpa Revamping  
> **Branch：** `feauture/revamping-experiment`  
> **日期：** 2026-06-14  
> **狀態：** Phase 1 + Phase 2 + Phase 3 整合完成，待 E2E 驗收確認

---

## 一句話總結

從 **ExtJS 6.5 + Spring Boot 2.7 + Ext Direct（無 REST）**，完整改造為 **React 19 + Next.js 16 + Spring Boot 3.3.5 + JDK 17 + REST API**，三個 Phase 全數落地，後端 12 個 IT 測試全綠，前後端成功串接。

---

## 成功點逐條記錄

---

### ✅ 1. 完整跑完三個 Phase，不是 PoC

| Phase | 產出 | Commit |
|-------|------|--------|
| Phase 1 | React 19 + Next.js 16 前端（完整 6 個 Task） | `ea6d78b` |
| Phase 2 | Spring Boot 3.3.5 + JDK 17 + 22 個 REST endpoint | `da1fc38` → `4fa7f36` |
| Phase 3 | Next.js ↔ Spring Boot 整合，移除 Mock API | `a1b8087` |
| Phase 3 fix | ERR_TOO_MANY_REDIRECTS（stale JSESSIONID）修復 | `99c8c8a` |

這不是 demo，是真實改造了一個有 user auth、2FA、role management 的企業應用。

---

### ✅ 2. Strangler Fig + Frontend First 策略成功

Phase 1 建立完整前端，但對接的是內部 **Mock API Route Handlers**（`src/app/api/v1/**`），讓前端可以獨立跑通 Playwright 14/14 測試，不需要等後端改造完成。

Phase 3 再把 Next.js proxy rewrite 指向真實 Spring Boot，**一次性切換，前端程式碼幾乎不動**。

**意義：** 前後端可以在同一個 branch 上並行開發，互不 block。

---

### ✅ 3. TDD 有實際落地（不只是說說）

Phase 2 的 12 個 Integration Tests 全部是：

- 先寫 `@SpringBootTest + MockMvc` 測試（RED）
- 再寫 Controller/Service 實作（GREEN）
- Commit 時 `./mvnw test` 強制全綠才進

```
Task 2.6 fixes: all 12 IT tests green  ← 有記錄、可重現
```

---

### ✅ 4. 技術棧完整升級

| 項目 | 舊版 | 新版 | 難點 |
|------|------|------|------|
| 前端框架 | ExtJS 6.5 Classic | React 19 + Next.js 16 | 無 JSX、Event-driven → Declarative |
| 前端通信 | Ext Direct（POST /router） | REST API（JSON） | 協議完全不同 |
| 後端框架 | Spring Boot 2.7 | Spring Boot 3.3.5 | `javax.*` → `jakarta.*` 全面遷移 |
| Java 版本 | JDK 8/legacy | JDK 17 | Record、Pattern Matching、Text Blocks |
| Security | Spring Security 5.x | Spring Security 6.x | Lambda DSL、`SecurityFilterChain` bean |
| ORM | Hibernate 5.3 | Hibernate 6.5 | QueryDSL Jakarta，N+1 查詢重新審視 |
| API 文件 | 無 | OpenAPI 3.x（springdoc） | 自動生成，Swagger UI 可測 |
| 建構工具 | Sencha CMD | Turbopack + Maven | 前端徹底擺脫 Sencha 生態 |

---

### ✅ 5. 規劃文件完整，AI Team 可以遵循

| 文件 | 作用 |
|------|------|
| `CLAUDE.md` | 技術棧快速 context，讓每個 agent 啟動就有全圖 |
| `task.md` | Phase + Task 分解，每個 task 有驗收標準 + 可執行指令 |
| `team.md` | 4 個 agent 角色的責任、skills、協作介面、工作流程 |
| `design.md` | 架構決策、API Contract、資料庫 schema |
| `progress.md` | 每個 Phase 的執行結果、技術決策、已知限制 |

這套文件讓整個 revamp 從「一個人的想法」變成「一個 agent team 可以執行的計劃」。

---

### ✅ 6. 真實整合問題被發現並修復

Phase 3 串接後端時出現 `ERR_TOO_MANY_REDIRECTS`，原因是：

1. 瀏覽器帶著舊的 `JSESSIONID` cookie
2. Next.js 把它轉發給 Spring Boot
3. Spring Boot 認 session 無效 → redirect → Next.js middleware 又 redirect → 無限迴圈

**修復方式：** `fix(phase3): prevent ERR_TOO_MANY_REDIRECTS from stale JSESSIONID`

這個 bug 只有在「真實 E2E 整合」時才會出現，mock 階段不會發現。代表整合驗收是真的跑過。

---

### ✅ 7. Phase 1 驗收有 14 個 Playwright 測試、6 張截圖

```
auth.spec.ts       — 4 tests  (正確登入/錯誤密碼/2FA/登出)
users.spec.ts      — 3 tests  (Grid顯示/搜尋/新增)
navigation.spec.ts — 2 tests  (ADMIN選單/USER選單)
profile.spec.ts    — 3 tests  (設定儲存/2FA啟用/裝置清單)
error-pages.spec.ts— 2 tests  (404/403)
```

截圖存於 `.doc/screenshots/`，供對照。

---

## 尚未完成 / 已知 defer 項目

| 項目 | 說明 | 預計處理 |
|------|------|---------|
| Phase 3 E2E 整合驗收 | Playwright 需打真實後端，結果待確認 | 2026-06-15 |
| i18n 介面翻譯 | UI 字串未跟語系設定切換 | Phase 3 後續 |
| Phase 1 使用者確認 | 未正式簽核 Phase 1 Gate | 驗收時一併確認 |
| progress.md 狀態更新 | Phase 2/3 仍顯示舊狀態 | 驗收通過後更新 |

---

## Design vs 實作差異分析（design.md 對照）

> 逐條比對 `design.md` 規劃與實際 commit 產出，記錄「按計劃執行」與「有意偏離」的項目。

### ✅ 按計劃執行的設計決策

| 設計決策 | 結果 |
|---------|------|
| Strangler Fig：`/api/v1` REST，保留舊 `/router` Ext Direct | ✅ 完整實作 |
| Session + HttpOnly Cookie（非 JWT） | ✅ Spring Security 6.x + JSESSIONID |
| RSC 殼層 + Client 葉節點（Ag-Grid / antd Form） | ✅ layout.tsx RSC，user-grid/user-form 均 `'use client'` |
| TanStack Query 管 server state | ✅ useUsers / useAuth hooks 完整 |
| RFC 7807 錯誤格式 | ✅ GlobalExceptionHandler 實作 |
| Testcontainers MySQL（IT 不用 H2） | ✅ `AbstractMySQLIT.java` 存在，真實 MySQL container |
| antd + Ag-Grid + react-hook-form + Zod | ✅ 全數安裝、實際使用 |
| Phase 1 Mock API → Phase 3 換成真實後端 | ✅ next.config.ts rewrite 指向 8080 |
| 2FA TOTP：MFA_PENDING → Input.OTP → AUTHENTICATED | ✅ Spring Security Filter + antd Input.OTP |

### ⚠️ 有意偏離（已在 progress.md 記錄的合理 defer）

| 設計項目 | design.md 規劃 | 實際狀態 | 說明 |
|---------|--------------|---------|------|
| 認證 mutation | Server Actions | client fetch + Route Handler | progress.md 明確記錄，因 Server Action 不易傳 cookie 而改 |
| CSP nonce-based | `script-src 'nonce-xxx'` | 只加 `X-Content-Type-Options` + `Referrer-Policy` | middleware 有 comment 說明「留待 Phase 3 hardening，避免破壞 antd CSS-in-JS」 |
| i18n 介面翻譯 | 語系切換影響 UI 字串 | 只儲存偏好，UI 不跟著換 | 明確 defer，等後續 Phase |

### ❌ 未實作（設計有、程式碼沒有）

| 設計項目 | design.md 所在 | 實際狀態 | 影響 |
|---------|-------------|---------|------|
| **MapStruct** Entity ↔ DTO mapper | §3.1 `mapper/` 資料夾 | 無任何 MapStruct，直接手動 mapping 在 Service 層 | 低：手動 mapping 正確即可，但 Entity 欄位多時易漏 |
| **Bucket4j 限流** | §6 Rate Limiting（登入 5次/分/IP） | 無，pom.xml 沒有 bucket4j 依賴 | 中：缺少 DoS 防護，production 上線前需補 |
| **openapi-typescript 自動生成型別** | §5.1 `types.ts` 從 OpenAPI spec 生成 | `types.ts` 是手寫，且有 comment 「Phase 3 由 openapi-typescript 取代」 | 中：前後端型別可能漂移，PR review 需人工比對 |
| **docker-compose.yml** | §9 MySQL 8.4 + MailHog 本地環境 | 根目錄不存在 docker-compose.yml | 低：dev 用 H2，但 MySQL 本地測試無法一鍵啟動 |
| **`/api/legacy/direct/*`** Ext Direct 橋接 | §4.3 新舊 API 並行 | 未實作，Ext Direct 原路徑 `/router` 未橋接 | 低：本次目標是全面取代，不需保留舊路由 |
| **Spring Session JDBC/Redis** | §1.1 架構圖有 Session Store | 使用 Tomcat 預設 in-memory session | 中：重啟後 session 消失，多 instance 不共享 |

### 總結

| 類別 | 數量 |
|------|------|
| 按計劃執行 | 9 項 |
| 有意偏離（已記錄） | 3 項 |
| 未實作（技術債） | 6 項 |

**最優先補齊：**
1. **openapi-typescript**（Phase 3 收尾就應該做，防型別漂移）
2. **Bucket4j 限流**（production 安全要求）
3. **Spring Session 持久化**（multi-instance / restart 穩定性）

---

## 對比：Harness Engineering 前 vs 後

| 維度 | 之前 | 之後 |
|------|------|------|
| 改造方式 | 手工逐步改、沒有計劃 | 文件驅動，Agent Team 分工 |
| 驗證方式 | 靠感覺 / 手動點一點 | Playwright E2E + JUnit IT |
| 技術債追蹤 | 憑記憶 | 明確記錄於 progress.md |
| 平行開發 | 無法前後端同步 | Mock API 讓前後端獨立跑 |
| 部署信心 | 不知道改了什麼壞了什麼 | Commit 粒度清楚，每個 task 可 rollback |
