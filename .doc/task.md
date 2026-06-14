# Tasks — Revamping eds-starter6-jpa

> **版本：** 1.0  
> **日期：** 2026-06-13  
> **Branch：** `feauture/revamping-experiment`  
> **參考：** `proposal.md`、`design.md`、`product-features.md`、`team.md`

---

## 如何使用本文件

1. **每個 Phase 有獨立的驗收閘門**——所有閘門項目全部通過，才能進入下一個 Phase。
2. **每個 Task 有指定 Assignee**——負責的 Agent 須依照指定 Skills 執行。
3. **TDD 為預設工作模式**——先寫測試（Vitest / JUnit），再寫實作。
4. **驗收指令可直接執行**——每個 Task 的驗收標準都附有可執行的指令或可觀察的條件。

---

## Phase 0：文件準備（✅ 已完成）

| 文件 | 狀態 |
|------|------|
| `CLAUDE.md` | ✅ |
| `product-features.md` | ✅ |
| `.doc/proposal.md` | ✅ |
| `.doc/design.md` | ✅ |
| `.doc/task.md`（本文件） | ✅ |
| `.doc/team.md` | ✅ |

---

## Phase 1：Frontend Revamp（ExtJS → React 19 + Next.js 15）

> **目標：** 在 `client-next/` 建立全新 React 前端，使用 Next.js 15 App Router + Ant Design 5 + Ag-Grid + TanStack Query v5 + react-hook-form，前端呼叫既有後端（Spring Boot 2.7 Ext Direct 透過 Next.js proxy 轉發，或直接 mock）。
>
> **Assignee 總覽：**  
> - Architect：Task 1.1（初始化）  
> - Frontend Dev：Task 1.1–1.6（主力實作）  
> - QA：協助撰寫 Playwright spec、驗收各 Task

---

### Sprint 1：基礎建設（Week 1–2）

---

#### Task 1.1 — Next.js 15 專案初始化

**Assignee：** Architecture (Team Lead) + Frontend Dev  
**Skills：** `ecc:nextjs-turbopack`、`vercel-agent-skills:react-best-practices`、`ecc:project-init`、`superpowers:writing-plans`

**目標：** 建立 Next.js 15 專案骨架，安裝所有依賴，設定工具鏈。

**實作步驟：**

1. 在專案根目錄建立前端：
   ```bash
   pnpm create next-app@latest client-next --typescript --app --src-dir --no-tailwind
   cd client-next
   ```

2. 安裝核心依賴：
   ```bash
   pnpm add antd @ant-design/nextjs-registry
   pnpm add ag-grid-react ag-grid-community
   pnpm add @tanstack/react-query @tanstack/react-query-devtools
   pnpm add react-hook-form @hookform/resolvers zod
   pnpm add -D openapi-typescript vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event jsdom
   pnpm add -D @playwright/test
   ```

3. 建立 `docker-compose.yml`（MySQL 8.4 + MailHog）：
   ```yaml
   services:
     mysql:
       image: mysql:8.4
       ports: ["3306:3306"]
       environment:
         MYSQL_DATABASE: eds
         MYSQL_ROOT_PASSWORD: dev
     mailhog:
       image: mailhog/mailhog
       ports: ["1025:1025", "8025:8025"]
   ```

4. 設定 `next.config.ts`（rewrite /api/* → Spring Boot）：
   ```typescript
   rewrites: async () => [
     { source: '/api/:path*', destination: 'http://localhost:8080/api/:path*' }
   ]
   ```

5. 建立 `src/app/layout.tsx`（AntdRegistry + ConfigProvider + QueryClientProvider）

6. 建立 `src/middleware.ts`：
   - 未認證訪問 `/` 下路由 → redirect `/login`
   - CSP nonce-based header

7. 建立工具層：
   - `src/lib/api/client.ts`（fetch wrapper + RFC7807 error 解析）
   - `src/lib/api/server.ts`（RSC / Server Action 用的 server fetch）
   - `src/lib/query/query-client.ts`（TanStack Query 設定）

8. 建立測試設定：
   - `vitest.config.ts`（jsdom environment + path aliases）
   - `src/test/setup.ts`（RTL 設定）
   - `playwright.config.ts`（baseURL: http://localhost:3000）
   - `src/test/smoke.test.ts`（1 個 smoke test）

**驗收標準：**

| 驗證 | 通過條件 |
|------|---------|
| `pnpm build` | 0 TypeScript errors |
| `pnpm test` | smoke test 通過 |
| `pnpm dev` | 啟動在 :3000，`/` 跳轉 `/login` |

---

#### Task 1.2 — 認證頁面（Login + 2FA + Password Reset）

**Assignee：** Frontend Dev  
**Skills：** `vercel-agent-skills:react-best-practices`、`ecc:react-patterns`、`ecc:tdd-workflow`、`ecc:security-review`、`ecc:react-testing`

**目標：** 實作完整認證流程：帳號密碼登入、2FA 驗證、密碼重設請求。

**TDD 優先——先寫這些測試：**

```
src/test/
  auth/
    login-schema.test.ts      # Zod schema 驗證（必填、格式）
    auth-action.test.ts       # Server Action 回傳值測試（mock fetch）
  components/
    login-form.test.tsx       # RTL render + 錯誤訊息顯示
```

**實作步驟：**

1. `src/lib/schemas/auth.schema.ts`（Zod：loginName + password + 2FA OTP）

2. `src/lib/actions/auth.ts`：
   - `loginAction(formData)` → POST `/api/v1/auth/login`
   - `verify2faAction(otp)` → POST `/api/v1/auth/2fa`
   - `logoutAction()` → POST `/api/v1/auth/logout`
   - `resetPasswordRequestAction(email)` → POST `/api/v1/auth/password-reset:request`

3. `src/lib/auth/session.ts`：從 cookie 讀取 session 工具函式

4. `src/hooks/use-auth.ts`：
   - `useAuthUser()` → TanStack Query，GET `/api/v1/auth/me`

5. `src/app/(auth)/login/page.tsx`：
   - antd Form（loginName + password + rememberMe Checkbox）
   - Server Action 綁定
   - 登入失敗：antd message.error 顯示

6. `src/app/(auth)/login/2fa/page.tsx`：
   - antd Input.OTP（length=6）
   - Server Action verify2faAction

7. `src/app/(auth)/reset-password/page.tsx`：
   - antd Form（email）

**驗收標準：**

| 驗證 | 指令 / 條件 |
|------|------------|
| Vitest schema tests | `pnpm test` — login-schema.test.ts 全通過 |
| Playwright `e2e/auth.spec.ts` | 正確帳密 → 跳轉 `/users` |
| Playwright `e2e/auth.spec.ts` | 錯誤密碼 → antd 錯誤訊息出現 |
| Playwright `e2e/auth.spec.ts` | 2FA 用戶 → 跳轉 2FA 頁面 |
| Playwright `e2e/auth.spec.ts` | 登出後 → 跳轉 `/login` |

---

#### Task 1.3 — App Layout + 動態導覽選單

**Assignee：** Frontend Dev  
**Skills：** `vercel-agent-skills:react-best-practices`、`ecc:react-patterns`、`ecc:frontend-patterns`、`ecc:accessibility`

**目標：** 實作 Admin 殼層（antd Layout）+ 依使用者角色動態渲染的 Side Menu。

**TDD 優先——先寫：**

```
src/test/components/
  side-menu.test.tsx     # ADMIN 見所有選單項，USER 見子集
```

**實作步驟：**

1. `src/app/(admin)/layout.tsx`（RSC）：
   - `await fetch('/api/v1/auth/me')` 取得 authUser
   - `await fetch('/api/v1/navigation')` 取得選單樹
   - 傳給 AppLayout

2. `src/components/layout/app-layout.tsx`：
   - antd Layout（Sider + Header + Content）
   - Header：使用者名稱 + 登出按鈕

3. `src/components/layout/side-menu.tsx`（`'use client'`）：
   - antd Menu，`mode="inline"`
   - 依 navigation API 回傳的 NavigationNode 樹渲染
   - active item 依 `usePathname()` 追蹤

4. `src/app/api/log/route.ts`（Route Handler，前端錯誤 proxy → 後端 `/api/v1/logs/client`）

**驗收標準：**

| 驗證 | 條件 |
|------|------|
| Vitest | side-menu.test.tsx：ADMIN 選單 3 項，USER 選單 2 項 |
| Playwright | 登入後 sidebar 出現，點擊項目路由切換 |
| 瀏覽器 | antd Layout Sider 折疊/展開正常 |

---

### Sprint 2：核心功能（Week 3–4）

---

#### Task 1.4 — User Management（Ag-Grid + Modal Form）

**Assignee：** Frontend Dev  
**Skills：** `vercel-agent-skills:react-best-practices`、`ecc:react-patterns`、`ecc:tdd-workflow`、`ecc:react-performance`、`ecc:react-testing`、`ecc:react-review`

**目標：** 最核心功能模組——Ag-Grid 顯示使用者清單，antd Modal + react-hook-form 處理 CRUD。

**TDD 優先——先寫：**

```
src/test/
  hooks/
    use-users.test.ts        # TanStack Query mock — useUsers、useUpdateUser
  schemas/
    user.schema.test.ts      # Zod user schema 驗證規則
  components/
    user-form.test.tsx       # RTL render UserForm — 顯示 required 錯誤、submit
```

**實作步驟：**

1. `src/lib/schemas/user.schema.ts`（Zod）：
   ```typescript
   z.object({
     loginName: z.string().min(1),
     firstName: z.string().min(1),
     lastName:  z.string().min(1),
     email:     z.string().email(),
     locale:    z.string(),
     enabled:   z.boolean(),
     authorities: z.array(z.string()),
   })
   ```

2. `src/hooks/use-users.ts`：
   - `useUsers({ page, size, q })` → GET `/api/v1/users`
   - `useUpdateUser()` → PUT `/api/v1/users/{id}`（invalidateQueries）
   - `useDeleteUser()` → DELETE `/api/v1/users/{id}`
   - `useUnlockUser()` → POST `/api/v1/users/{id}/unlock`
   - `useDisable2fa()` → POST `/api/v1/users/{id}/two-factor:disable`
   - `useSendResetEmail()` → POST `/api/v1/users/{id}/password-reset-email`

3. `src/lib/actions/users.ts`（Server Actions）：
   - `updateUserAction`、`deleteUserAction`（軟刪除）

4. `src/app/(admin)/users/page.tsx`（RSC 殼層）：初始資料 prefetch

5. `src/app/(admin)/users/_components/user-grid.tsx`（`'use client'`）：
   - `BaseGrid` wrapper（見 design.md 2.3 節程式碼）
   - ColumnDefs：loginName, firstName, lastName, email, enabled（antd Tag）, twoFactorAuth, lastAccess, 操作欄（Edit / Delete / Unlock / ...）
   - 搜尋：antd Input debounce → 更新 queryKey
   - 分頁：Ag-Grid pagination + TanStack Query `placeholderData`

6. `src/app/(admin)/users/_components/user-form.tsx`（`'use client'`）：
   - antd Modal + react-hook-form + zodResolver
   - 欄位：loginName（新增時顯示）、firstName、lastName、email、locale Select、enabled Switch、authorities Select（多選）
   - 錯誤訊息：Form.Item + `errors` 物件

7. `src/components/grid/base-grid.tsx`（共用 Ag-Grid 封裝，見 design.md 2.3）

**驗收標準：**

| 驗證 | 指令 / 條件 |
|------|------------|
| Vitest | `pnpm test` — use-users、user.schema、user-form 全通過 |
| Playwright `e2e/users.spec.ts` | Grid 顯示第 1 頁 20 筆資料 |
| Playwright | 搜尋關鍵字 → Grid 過濾 |
| Playwright | 新增使用者 → Modal 關閉 → Grid 自動重整含新資料 |
| Playwright | 編輯使用者 → 更新後 Grid 反映 |
| Playwright | 刪除使用者 → 消失於 Grid |
| Playwright | 解鎖帳號按鈕 → 成功 toast |

---

#### Task 1.5 — User Profile + 2FA 自我管理

**Assignee：** Frontend Dev  
**Skills：** `vercel-agent-skills:react-best-practices`、`ecc:react-patterns`、`ecc:react-testing`

**目標：** 個人設定頁（語系、密碼）+ 自我管理 2FA + 查看/撤銷記住我裝置。

**TDD 優先——先寫：**

```
src/test/
  schemas/
    profile.schema.test.ts   # settings Zod schema
  hooks/
    use-profile.test.ts      # useSettings、useDevices hook mock
```

**實作步驟：**

1. `src/lib/schemas/profile.schema.ts`（Zod：locale、currentPassword、newPassword）

2. `src/hooks/use-profile.ts`：
   - `useSettings()` → GET `/api/v1/me/settings`
   - `useDevices()` → GET `/api/v1/me/devices`
   - `useEnable2fa()` → POST `/api/v1/me/two-factor:enable`（回傳 otpauth URI）
   - `useDisable2fa()` → POST `/api/v1/me/two-factor:disable`
   - `useRevokeDevice()` → DELETE `/api/v1/me/devices/{series}`

3. `src/lib/actions/profile.ts`（Server Actions）：
   - `updateSettingsAction`

4. `src/app/(admin)/profile/page.tsx`（`'use client'`）：
   - antd Tabs：「個人設定」/ 「兩步驟驗證」/ 「登入裝置」
   - 設定 Tab：antd Form（locale Select）
   - 2FA Tab：antd QRCode（掃描）→ antd Input.OTP（驗證）→ 成功顯示已啟用
   - 裝置 Tab：antd Table（series、lastUsed、撤銷按鈕）

**驗收標準：**

| 驗證 | 條件 |
|------|------|
| Vitest | profile.schema、use-profile hook 全通過 |
| Playwright `e2e/profile.spec.ts` | 更新語系設定 → 儲存成功 toast |
| Playwright | Enable 2FA → QRCode 顯示 → OTP 驗證成功 |
| Playwright | 裝置清單顯示 → 撤銷裝置 → 清單更新 |

---

#### Task 1.6 — 錯誤頁面 + i18n + 前端日誌

**Assignee：** Frontend Dev  
**Skills：** `vercel-agent-skills:react-best-practices`、`ecc:frontend-patterns`

**目標：** 403 / 404 / 500 錯誤頁面 + 基礎 i18n + 前端 crash log。

**實作步驟：**

1. `src/app/error.tsx`：antd Result（500）+ Reset button
2. `src/app/not-found.tsx`：antd Result（404）+ 返回首頁
3. `src/app/forbidden.tsx`：antd Result（403）

4. `src/app/layout.tsx` i18n 設定：
   - antd `ConfigProvider locale={zhTW}` 基礎語系
   - locale 依 `/api/v1/auth/me` 的 `locale` 欄位動態切換

5. antd `ConfigProvider onError`：
   - catch antd 元件內部錯誤 → POST `/api/v1/logs/client`（透過 `src/app/api/log/route.ts`）

**驗收標準：**

| 驗證 | 條件 |
|------|------|
| Playwright `e2e/error-pages.spec.ts` | 訪問不存在路由 → 顯示 antd Result 404 |
| Playwright | 無權限路由 → 顯示 antd Result 403 |
| Playwright | 模擬 500 → 顯示 antd Result 500 |

---

### ✅ Phase 1 驗收閘門

> **全部通過才可進入 Phase 2。**

| # | 驗證項目 | 執行方式 | 通過條件 |
|---|---------|---------|---------|
| 1 | TypeScript 型別 | `pnpm build` | 0 errors, 0 warnings |
| 2 | Vitest 單元測試 | `pnpm test` | 全綠，覆蓋率 ≥ 70% |
| 3 | Playwright E2E | `pnpm e2e` | `auth` + `users` + `profile` + `error-pages` 全通過 |
| 4 | Lighthouse 效能 | MCP `lighthouse_audit` | Performance ≥ 80、A11y ≥ 80 |
| 5 | 瀏覽器控制台 | MCP `get_console_message` | 0 errors |
| 6 | Network 呼叫 | MCP `list_network_requests` | 無多餘重複 API 呼叫 |

**負責人：QA**

---

## Phase 2：Backend Migration（Spring Boot 2.7 → 3.x + JDK 17）

> **目標：** 升級後端至 Spring Boot 3.x + JDK 17，並新增 20 個 REST API endpoints（`/api/v1/*`），使用 Strangler Fig 策略保留舊 Ext Direct `/router` 端點並行。
>
> **Assignee 總覽：**  
> - Architect：Task 2.1（升級規劃）+ Task 2.6（OpenAPI）  
> - Backend Dev：Task 2.1–2.6（主力實作）  
> - QA：JUnit 測試協助、驗收

---

### Sprint 3：Spring Boot 升級（Week 5–6）

---

#### Task 2.1 — Spring Boot 3.x + JDK 17 升級

**Assignee：** Backend Dev + Architecture (Team Lead)  
**Skills：** `ecc:springboot-patterns`、`ecc:java-coding-standards`、`ecc:database-migrations`、`ecc:build-fix`

**目標：** 升級框架版本，全部 `javax.*` 改為 `jakarta.*`，確保現有功能不中斷。

**實作步驟：**

1. `pom.xml` 修改：
   ```xml
   <parent>
     <groupId>org.springframework.boot</groupId>
     <artifactId>spring-boot-starter-parent</artifactId>
     <version>3.3.x</version>
   </parent>
   <properties>
     <java.version>17</java.version>
   </properties>
   ```

2. 全域 import 替換（`src/main/java` 下所有 `.java` 檔）：
   - `javax.persistence.*` → `jakarta.persistence.*`
   - `javax.validation.*` → `jakarta.validation.*`
   - `javax.servlet.*` → `jakarta.servlet.*`
   - `javax.annotation.*` → `jakarta.annotation.*`

3. QueryDSL 升級至 Jakarta 相容版本：
   ```xml
   <dependency>
     <groupId>com.querydsl</groupId>
     <artifactId>querydsl-jpa</artifactId>
     <classifier>jakarta</classifier>
   </dependency>
   ```

4. Liquibase 升級至 4.x（SB3 相容）

5. Hibernate 6.x 相容：
   - 審查所有 `@Query` JPQL 語法
   - 移除已棄用的 `spring.jpa.properties.hibernate.dialect`（SB3 自動偵測）

6. 保留 `extdirectspring` 依賴（`/router` 端點暫時並存）

**驗收標準：**

| 驗證 | 指令 | 通過條件 |
|------|------|---------|
| 編譯 | `./mvnw clean compile` | 0 errors |
| 現有測試 | `./mvnw test` | 全部通過（無退化） |
| 啟動 | `./mvnw spring-boot:run -Dspring.profiles.active=development` | `:8080` 正常啟動 |
| 舊端點 | `POST http://localhost:8080/router` | Ext Direct heartbeat 正常回應 |

---

#### Task 2.2 — Spring Security 6.x 重設定

**Assignee：** Backend Dev  
**Skills：** `ecc:springboot-security`、`ecc:security-scan`、`ecc:springboot-tdd`、`ecc:springboot-patterns`

**目標：** 移除已棄用的 `WebSecurityConfigurerAdapter`，改用 `SecurityFilterChain`，完整設定認證、2FA、速率限制。

**TDD 優先——先寫：**

```
src/test/java/.../security/
  SecurityConfigTest.java        # 各路由的授權規則（permitAll / authenticated）
  LockoutTest.java               # 10 次失敗 → 423 Locked
  CsrfTest.java                  # 無 CSRF token → 403
  RateLimitTest.java             # 5+1 次/分 → 429
```

**實作步驟：**

1. 新建 `SecurityConfig.java`（`@Configuration @EnableWebSecurity`）：
   ```java
   @Bean
   SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
     http
       .csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()))
       .sessionManagement(session -> session
         .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
         .maximumSessions(5))
       .authorizeHttpRequests(auth -> auth
         .requestMatchers("/api/v1/auth/**", "/actuator/health").permitAll()
         .requestMatchers("/actuator/**").hasRole("ADMIN")
         .anyRequest().authenticated())
       .exceptionHandling(ex -> ex
         .authenticationEntryPoint(jsonAuthEntryPoint())
         .accessDeniedHandler(jsonAccessDeniedHandler()))
       .rememberMe(rm -> rm.tokenRepository(persistentTokenRepository()))
       .addFilterAfter(twoFactorFilter(), UsernamePasswordAuthenticationFilter.class);
     return http.build();
   }
   ```

2. 2FA Filter (`TwoFactorFilter.java`)：
   - session attribute `MFA_PENDING` → 攔截非 `/api/v1/auth/2fa` 請求 → 回 403 JSON

3. Rate Limiting（Bucket4j）：
   - `LoginRateLimitFilter`：5次/分/IP 登入嘗試 → `429 Too Many Requests`

4. `GlobalExceptionHandler.java`（`@ControllerAdvice`）：
   - RFC 7807 `ProblemDetail` 格式
   - 帳號鎖定 → `423 Locked`（含 `lockedUntil`）
   - 帳號停用 → `403 Forbidden`

5. `SwitchUserFilter`（僅 `ROLE_ADMIN`）

**驗收標準：**

| 驗證 | 條件 |
|------|------|
| JUnit `SecurityConfigTest` | `/api/v1/users` 未認證 → 401 JSON |
| JUnit `LockoutTest` | 10 次失敗 → 423，含 `lockedUntil` 欄位 |
| JUnit `CsrfTest` | POST 無 XSRF-TOKEN → 403 |
| JUnit `RateLimitTest` | 6 次登入/分 → 429 |

---

### Sprint 4：REST API 實作（Week 6–7）

---

#### Task 2.3 — REST API：Auth Endpoints（7 個）

**Assignee：** Backend Dev  
**Skills：** `ecc:springboot-tdd`、`ecc:api-design`、`ecc:springboot-patterns`、`ecc:springboot-verification`

**目標：** 實作認證相關的所有 REST endpoint。

**TDD 優先——先寫 MockMvc 測試，再寫 Controller。**

**端點清單：**

| HTTP | Path | 說明 |
|------|------|------|
| POST | `/api/v1/auth/login` | 帳密登入，回 `{ mfaRequired: boolean }` |
| POST | `/api/v1/auth/2fa` | TOTP 驗證，回 `UserResponse` |
| POST | `/api/v1/auth/logout` | 登出，清除 session |
| GET | `/api/v1/auth/me` | 取得目前登入使用者 |
| POST | `/api/v1/auth/impersonate` | 切換為其他使用者（ADMIN only） |
| POST | `/api/v1/auth/password-reset:request` | 發送重設信件 |
| POST | `/api/v1/auth/password-reset` | 執行密碼重設 |

**實作步驟：**

1. DTO records（`src/main/java/.../web/dto/`）：
   ```java
   record LoginRequest(String loginName, String password, boolean rememberMe) {}
   record LoginResponse(boolean mfaRequired, UserResponse user) {}
   record TwoFactorRequest(String otp) {}
   record UserResponse(Long id, String loginName, String firstName, String lastName,
                       String email, boolean enabled, boolean twoFactorAuth,
                       Set<String> authorities, String locale, ZonedDateTime lastAccess) {}
   ```

2. `AuthController.java`（`@RestController @RequestMapping("/api/v1/auth")`）

3. `AuthService.java`：從既有 `SecurityService` 提取業務邏輯（保留原 service，新 service 委派）

4. MapStruct mapper：`User` Entity → `UserResponse`

**驗收標準：**

| 驗證 | 條件 |
|------|------|
| JUnit `AuthControllerTest`（MockMvc） | 7 個端點各自 happy path 通過 |
| JUnit `AuthControllerTest` | 錯誤密碼 → 401；帳號鎖定 → 423；2FA pending → 403 |
| Integration Test（Testcontainers） | login → 2fa → me → logout 完整流程 |

---

#### Task 2.4 — REST API：User Management Endpoints（7 個）

**Assignee：** Backend Dev  
**Skills：** `ecc:springboot-tdd`、`ecc:api-design`、`ecc:springboot-patterns`、`ecc:jpa-patterns`

**目標：** 使用者管理的完整 CRUD + 操作型端點。

**端點清單：**

| HTTP | Path | 說明 |
|------|------|------|
| GET | `/api/v1/users?page=&size=&q=` | 分頁列表，含搜尋 |
| PUT | `/api/v1/users/{id}` | 新增（id=null）或更新 |
| DELETE | `/api/v1/users/{id}` | 軟刪除（`is_deleted=true`） |
| GET | `/api/v1/authorities` | 取得可用角色清單 |
| POST | `/api/v1/users/{id}/unlock` | 解鎖帳號 |
| POST | `/api/v1/users/{id}/two-factor:disable` | 管理員停用指定用戶 2FA |
| POST | `/api/v1/users/{id}/password-reset-email` | 發送密碼重設信件 |

**實作步驟：**

1. `UserController.java`（`@RestController @RequestMapping("/api/v1/users")`）

2. 分頁 Response 格式（Ag-Grid 相容）：
   ```java
   record PageResult<T>(List<T> content, PageMeta page) {}
   record PageMeta(int number, int size, long totalElements, int totalPages) {}
   ```

3. 搜尋：`q` 參數 → JPQL `LOWER(loginName) LIKE LOWER(:q) OR LOWER(email) LIKE LOWER(:q)`

4. `UserService`：從既有 service 擴充，保留軟刪除邏輯

**驗收標準：**

| 驗證 | 條件 |
|------|------|
| JUnit `UserControllerTest`（MockMvc） | 7 端點 happy path + error path |
| JUnit | 軟刪除後 GET 不返回已刪資料 |
| Integration Test | 新增 → GET → 編輯 → GET → 軟刪除 → GET 消失 |
| JUnit | 分頁：size=5，第 2 頁回正確資料 |

---

#### Task 2.5 — REST API：Profile / Navigation / Log（7 個）

**Assignee：** Backend Dev  
**Skills：** `ecc:springboot-tdd`、`ecc:api-design`、`ecc:springboot-patterns`

**端點清單：**

| HTTP | Path | 說明 |
|------|------|------|
| GET | `/api/v1/me/settings` | 取得個人設定 |
| PUT | `/api/v1/me/settings` | 更新個人設定 |
| POST | `/api/v1/me/two-factor:enable` | 啟用自己的 2FA，回 otpauth URI |
| POST | `/api/v1/me/two-factor:disable` | 停用自己的 2FA（需 OTP 驗證） |
| GET | `/api/v1/me/devices` | 記住我裝置清單 |
| DELETE | `/api/v1/me/devices/{series}` | 撤銷裝置 |
| GET | `/api/v1/navigation` | 依角色動態選單樹 |
| POST | `/api/v1/logs/client` | 記錄前端 JS 錯誤 |

**實作步驟：**

1. `UserConfigController.java`（`@RequestMapping("/api/v1/me")`）
2. `NavigationController.java`（`@RequestMapping("/api/v1/navigation")`）
3. `LogController.java`（`@RequestMapping("/api/v1/logs")`）
4. 2FA enable 流程：生成 Base32 secret → 加密存 `AppUser.secret` → 回 `otpauth://totp/...` URI

**驗收標準：**

| 驗證 | 條件 |
|------|------|
| JUnit MockMvc | 8 個端點 happy path |
| JUnit | 2FA enable → 回 `otpauth://` URI；OTP 驗證通過後 `twoFactorAuth=true` |
| JUnit | 撤銷裝置後 GET devices 不再返回 |

---

#### Task 2.6 — OpenAPI 3.x + TypeScript 型別自動生成

**Assignee：** Architecture (Team Lead) + Backend Dev  
**Skills：** `ecc:api-design`、`ecc:springboot-patterns`、`superpowers:verification-before-completion`

**目標：** 後端生成 OpenAPI spec，前端自動生成 TypeScript 型別，建立前後端型別安全橋接。

**實作步驟：**

1. `pom.xml` 加入：
   ```xml
   <dependency>
     <groupId>org.springdoc</groupId>
     <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
     <version>2.x.x</version>
   </dependency>
   ```

2. `OpenApiConfig.java`：
   ```java
   @Bean
   OpenAPI openAPI() {
     return new OpenAPI()
       .info(new Info().title("EDS Revamp API").version("1.0"))
       .addSecurityItem(new SecurityRequirement().addList("cookieAuth"))
       .components(new Components()
         .addSecuritySchemes("cookieAuth",
           new SecurityScheme().type(SecurityScheme.Type.APIKEY)
             .in(SecurityScheme.In.COOKIE).name("JSESSIONID")));
   }
   ```

3. 所有 Controller 加 `@Tag`、`@Operation`、`@ApiResponse` 標註

4. 生成 spec：
   ```bash
   ./mvnw spring-boot:run &
   curl http://localhost:8080/v3/api-docs > client-next/openapi.json
   ```

5. 前端型別生成：
   ```bash
   cd client-next
   pnpm openapi-typescript openapi.json -o src/lib/api/types.ts
   ```

6. 更新所有 hooks 使用 `paths` 型別（`type paths = ...` from types.ts）

**驗收標準：**

| 驗證 | 條件 |
|------|------|
| `openapi.json` | 包含全部 20+ 個端點 |
| Swagger UI | `http://localhost:8080/swagger-ui.html` 可正常顯示所有端點 |
| TypeScript | `pnpm build` 無型別錯誤（openapi-typescript 生成的型別被使用） |

---

### ✅ Phase 2 驗收閘門

> **全部通過才可進入 Phase 3。**

| # | 驗證項目 | 執行方式 | 通過條件 |
|---|---------|---------|---------|
| 1 | 後端單元測試 | `./mvnw test` | 全綠 |
| 2 | 整合測試 | `./mvnw verify -Pintegration` | Testcontainers MySQL 全綠 |
| 3 | OpenAPI 覆蓋 | Swagger UI 目視確認 | 所有 20+ 端點記錄 |
| 4 | TypeScript 型別 | `pnpm build` | 0 errors（含 openapi-typescript 型別） |
| 5 | 安全掃描 | `ecc:security-scan` agent | 無 HIGH / CRITICAL 問題 |
| 6 | Strangler Fig | `POST http://localhost:8080/router` | Ext Direct 仍正常回應 |

**負責人：QA + Architecture (Team Lead)**

---

## Phase 3：整合 + E2E 驗收

> **目標：** 前後端完整整合，8 個功能模組的 Playwright E2E 測試全部通過，效能與安全審查完成。
>
> **Assignee 總覽：**  
> - QA：主力（Task 3.2 + 3.3）  
> - Architect + Frontend Dev + Backend Dev：Task 3.1（整合除錯）

---

#### Task 3.1 — 前後端完整整合

**Assignee：** Architecture (Team Lead) + Frontend Dev + Backend Dev  
**Skills：** `vercel-agent-skills:react-best-practices`、`ecc:springboot-patterns`、`superpowers:systematic-debugging`

**目標：** 移除所有 mock，前端完全使用真實 Spring Boot REST API，確認所有流程端到端通暢。

**實作步驟：**

1. 確認 `next.config.ts` rewrite 正確代理所有 `/api/v1/*` → `http://localhost:8080`

2. CSRF token 整合：
   - 前端在 layout.tsx 載入時讀取 `XSRF-TOKEN` cookie
   - 所有 mutation（Server Action / Route Handler）附上 `X-XSRF-TOKEN` header

3. 逐一測試：登入 → 2FA → 導覽 → User CRUD → Profile → 登出

4. 修正整合中發現的問題（CORS、cookie domain、redirect 等）

5. 用真實 MySQL：`docker compose up` + 確認 Liquibase 初始資料正確

**驗收標準：**

| 驗證 | 條件 |
|------|------|
| 手動驗證 | 完整流程：登入 → 瀏覽 → CRUD → 登出，全部使用真實後端 |
| MCP network requests | 所有 API 呼叫 HTTP 200/201/204 |
| MCP console | 0 JavaScript errors |

---

#### Task 3.2 — Playwright E2E Test Suite（8 個模組完整覆蓋）

**Assignee：** QA  
**Skills：** `ecc:e2e-testing`、`ecc:browser-qa`、`superpowers:test-driven-development`、`superpowers:systematic-debugging`

**目標：** 完整 Playwright 測試套件，覆蓋所有 8 個功能模組，確認 Revamped 應用與 Legacy 行為一致。

**測試檔案結構：**

```
e2e/
  fixtures/
    auth.fixture.ts        # 自動登入 fixture
    db.fixture.ts          # 測試資料重置
  auth.spec.ts
  users.spec.ts
  profile.spec.ts
  navigation.spec.ts
  error-pages.spec.ts
```

**`e2e/auth.spec.ts` 測試案例：**
- 正確帳密 → 跳轉 `/users`
- 錯誤密碼 → antd 錯誤訊息
- 錯誤 5 次 → 警示訊息（5次後鎖定）
- 2FA 用戶 → 跳轉 `/login/2fa`，正確 OTP → 進入系統
- 記住我 → 關閉視窗重開 → 自動登入（cookie 存在）
- 登出 → session 清除 → 跳轉 `/login`

**`e2e/users.spec.ts` 測試案例：**
- 載入 Grid，顯示 20 筆分頁資料
- 搜尋關鍵字 → Grid 過濾
- 點擊下一頁 → 正確資料
- 新增使用者（完整表單）→ Grid 出現新資料
- 編輯使用者（修改 email）→ Grid 反映更新
- 刪除使用者 → Grid 移除
- 解鎖被鎖定帳號 → 成功通知
- 停用指定用戶 2FA（ADMIN）→ 成功

**`e2e/profile.spec.ts` 測試案例：**
- 更新語系設定 → 儲存成功 toast
- Enable 2FA → QRCode 顯示 → OTP 驗證 → 顯示已啟用
- Disable 2FA → OTP 確認 → 顯示已停用
- 裝置清單顯示 → 撤銷裝置 → 清單更新

**`e2e/navigation.spec.ts` 測試案例：**
- ADMIN 登入 → 見「使用者管理」「個人設定」「系統管理」
- USER 登入 → 不見「使用者管理」

**`e2e/error-pages.spec.ts` 測試案例：**
- 訪問不存在路由 → 404 Result
- 無權限路由 → 403 Result

**MCP 工具使用：**
- `take_screenshot`：每個關鍵狀態截圖，存入 `e2e/screenshots/`
- `get_console_message`：確認各頁面無 JS errors
- `list_network_requests`：確認 API 呼叫路徑正確（無 401/500）

**驗收標準：**

| 驗證 | 指令 | 通過條件 |
|------|------|---------|
| E2E 全套 | `pnpm e2e --reporter=html` | 所有 30+ 測試案例通過 |
| HTML 報告 | 開啟 `playwright-report/index.html` | 無 FAILED / FLAKY |
| MCP 截圖 | 目視確認 `e2e/screenshots/` | 無視覺破版 |

---

#### Task 3.3 — 效能 + 安全審查

**Assignee：** QA + Architecture (Team Lead)  
**Skills：** `ecc:browser-qa`、`ecc:react-performance`、`ecc:security-scan`、`ecc:security-review`

**目標：** 確認 Revamped 應用在效能與安全面向達到可接受水準。

**實作步驟：**

1. **Lighthouse 效能審查**（MCP Chrome DevTools）：
   ```
   mcp__plugin_ecc_chrome-devtools__lighthouse_audit({
     url: "http://localhost:3000",
     categories: ["performance", "accessibility", "best-practices", "seo"]
   })
   ```
   - 檢查 LCP / CLS / INP

2. **Bundle Size 分析**：
   ```bash
   pnpm build && cat .next/analyze/bundle-analyzer.html
   # 或：pnpm add -D @next/bundle-analyzer
   ```
   - 確認 main chunk < 1MB（antd tree-shaking 生效）

3. **安全審查**（`ecc:security-review` agent）：
   - CSP header 正確（含 nonce）
   - `Set-Cookie` 含 `HttpOnly; Secure; SameSite=Lax`
   - OWASP Top 10：SQLi / XSS / CSRF / IDOR 檢查

4. **生產建構驗證**：
   ```bash
   pnpm build                           # Next.js production build
   ./mvnw clean package -DskipTests    # Spring Boot JAR
   ```

**驗收標準：**

| 驗證 | 通過條件 |
|------|---------|
| Lighthouse Performance | ≥ 80 |
| Lighthouse Accessibility | ≥ 80 |
| Bundle main chunk | < 1MB |
| 安全審查 | 無 HIGH / CRITICAL 問題 |
| `pnpm build` | 成功（0 errors） |
| `./mvnw clean package` | JAR 產出成功 |

---

### ✅ Phase 3 最終驗收閘門（Revamping 完成）

> **全部通過即代表 Revamping 完成，可關閉 Strangler Fig 並移除舊 Ext Direct 端點。**

| # | 驗證項目 | 通過條件 |
|---|---------|---------|
| 1 | Playwright E2E | `pnpm e2e` 全綠（30+ cases） |
| 2 | Lighthouse Performance | ≥ 80 |
| 3 | Lighthouse Accessibility | ≥ 80 |
| 4 | 安全審查 | 無 HIGH / CRITICAL |
| 5 | Production Build | `pnpm build` + `./mvnw clean package` 成功 |
| 6 | 8 個功能模組 | QA 逐一確認行為與 Legacy 一致（checklist） |
| 7 | MCP 瀏覽器驗證 | 0 console errors，所有 API 返回正確狀態碼 |

**負責人：QA（執行）+ Architecture (Team Lead)（最終簽核）**

---

## 附：Sprint 時間線

| Sprint | 週次 | 主要工作 | 負責人 |
|--------|------|---------|--------|
| Sprint 0 | Week 0 | 文件準備 ✅ | Architect |
| Sprint 1 | Week 1–2 | Task 1.1–1.3（FE 基礎） | FE Dev |
| Sprint 2 | Week 3–4 | Task 1.4–1.6（FE 核心）+ Phase 1 Gate | FE Dev + QA |
| Sprint 3 | Week 5–6 | Task 2.1–2.2（BE 升級） | BE Dev |
| Sprint 4 | Week 6–7 | Task 2.3–2.6（REST API）+ Phase 2 Gate | BE Dev + QA |
| Sprint 5 | Week 8–9 | Task 3.1–3.3（整合 + E2E）+ Phase 3 Gate | All |
