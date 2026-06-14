# System Design — eds-starter6-jpa Revamping

> **版本：** 2.0  
> **日期：** 2026-06-13  
> **設計審查：** ecc:architect agent（Harness Engineering Practice）  
> **狀態：** Designer Reviewed ✅

---

## 審查總評（先給結論）

| 面向 | 審查意見 | 決策 |
|------|----------|------|
| 部署形態 | 內部 Admin Panel，不宜過度工程化 | 單體 BFF + 單體 Spring Boot，**不拆微服務** |
| 認證方案 | 需即時撤銷、帳號鎖定、switchUser、2FA | **Session + HttpOnly Cookie**，不用 JWT |
| RSC 邊界 | Admin 操作密集（Grid/Form 互動多） | 殼層 Server Component，互動葉子 Client Component |
| Legacy 並行 | Ext Direct 與 REST 需明確 API 邊界 | Strangler Fig：`/api/legacy` 舊、`/api/v1` 新，共用 Service |

---

## 前端核心 Library Stack

| 用途 | Library | 版本 | 說明 |
|------|---------|------|------|
| UI 元件庫 | **Ant Design** | 5.x | 企業級元件（Form、Modal、Table、Menu、Layout） |
| 資料表格 | **Ag-Grid Community** | 32.x | 高效能 Grid，分頁/排序/過濾/虛擬滾動 |
| 表單管理 | **react-hook-form** | 7.x | 低重渲染表單，搭配 Zod schema 驗證 |
| Server State | **TanStack Query** | v5 | 資料獲取、快取、樂觀更新，搭配 Ag-Grid |
| 框架 | **Next.js 15** | App Router | SSR 殼層 + Client Grid/Form |
| 型別安全 | **openapi-typescript** | 7.x | 從 OpenAPI spec 自動生成 TS 型別 |

> **為何選這組 Stack：**  
> - Ant Design 原生支援企業後台所有元件（DatePicker、Select、Tree 等），比 shadcn/ui 少寫大量組合程式碼  
> - Ag-Grid 直接對應 ExtJS Grid 的所有功能（分頁、排序、行內編輯、Column Pinning），遷移語意最接近  
> - TanStack Query v5 比 SWR 提供更完整的 DevTools、背景重新整理、Optimistic Update API  
> - react-hook-form 對應 ExtJS Form 的 `getValues()`、`validate()` 語意，API 直觀

---

## 1. Architecture Overview

### 1.1 整體部署架構

```
                     ┌─────────────────────────────────────────┐
                     │              使用者瀏覽器                  │
                     │   React 19 + Ant Design + Ag-Grid         │
                     └───────────────┬─────────────────────────┘
                                     │ HTTPS (HttpOnly Session Cookie)
                                     ▼
     ┌──────────────────────────────────────────────────────────────┐
     │                  Next.js 15 (App Router) — BFF                │
     │  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐   │
     │  │ RSC (殼層)    │  │ Server Actions │  │ Route Handlers   │   │
     │  │ Layout/Nav   │  │ (mutation)     │  │ /api/* (proxy)   │   │
     │  └──────────────┘  └───────────────┘  └──────────────────┘   │
     │          同源 Cookie 轉發 / CSP nonce                          │
     └───────────────────────┬──────────────────────────────────────┘
                             │ 內網 REST（Cookie 透傳）
                             ▼
     ┌──────────────────────────────────────────────────────────────┐
     │              Spring Boot 3.x  (JDK 17, Tomcat)                │
     │  ┌────────────┐  ┌───────────┐  ┌────────────┐  ┌─────────┐  │
     │  │ Controller │→ │  Service  │→ │ Repository │→ │ JPA/Hib │  │
     │  │ (REST v1)  │  │ (TX 邊界) │  │ (SprData)  │  │ Hib 6.x │  │
     │  └────────────┘  └───────────┘  └────────────┘  └────┬────┘  │
     │  Spring Security 6（SecurityFilterChain）               │      │
     │  Spring Session（JDBC / Redis）                         │      │
     └──────────────────────────────────────────────────────── ┼ ───┘
                  │                                            ▼
     ┌────────────┴───────────┐                 ┌──────────────────┐
     ▼                        ▼                 │  RDBMS           │
┌──────────────┐    ┌──────────────┐            │ H2 (dev)         │
│ SMTP / Mail  │    │ Spring Session│            │ MySQL (prod)     │
│ (MailHog dev)│    │ Store         │            │ AppUser/Authority│
└──────────────┘    └──────────────┘            └──────────────────┘
```

### 1.2 2026 Best Practice 取捨

| 技術 | 採用 | 理由 |
|------|------|------|
| Next.js 15 App Router | ✅ | 2026 預設標準，殼層 SSR + 互動 CSR |
| React Server Components | ✅ 局部 | 僅殼層、Layout、靜態頁面 |
| Server Actions | ✅ | Form mutation，內建 CSRF |
| Ant Design 5.x | ✅ | 企業後台完整元件生態，對應 ExtJS 元件語意 |
| Ag-Grid Community | ✅ | 高效能 Grid，完整對應 ExtJS Grid 功能 |
| TanStack Query v5 | ✅ | 完整的 server state 管理，Devtools 佳 |
| react-hook-form | ✅ | 低重渲染、Zod 整合、對應 ExtJS Form |
| JWT 無狀態 | ❌ | Admin 需即時撤銷，Session 更適合 |
| 微服務拆分 | ❌ | 內部後台不需，過度工程化 |
| Redux / Zustand | ❌ | Server state 交給 TanStack Query，無需全域 store |

---

## 2. Frontend Architecture

### 2.1 Next.js 15 App Router 目錄結構

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx             # Ant Design Form + Server Action
│   │   ├── login/2fa/page.tsx         # 2FA 驗證（antd Input.OTP）
│   │   └── reset-password/page.tsx
│   ├── (admin)/
│   │   ├── layout.tsx                 # RSC：取 authUser + navigation
│   │   ├── users/
│   │   │   ├── page.tsx               # RSC 殼層
│   │   │   └── _components/
│   │   │       ├── user-grid.tsx      # 'use client' — Ag-Grid + TanStack Query
│   │   │       └── user-form.tsx      # 'use client' — react-hook-form + antd
│   │   ├── profile/page.tsx           # antd Form + 2FA + 裝置管理
│   │   └── system/page.tsx            # RSC：antd Descriptions 展示
│   ├── api/log/route.ts
│   ├── error.tsx / not-found.tsx / forbidden.tsx
│   └── layout.tsx                     # AntdRegistry（RSC/SSR 相容）+ i18n
├── components/
│   ├── layout/
│   │   ├── app-layout.tsx             # antd Layout（Sider + Header + Content）
│   │   └── side-menu.tsx              # antd Menu（動態 navigation）
│   └── grid/
│       └── base-grid.tsx              # 封裝 Ag-Grid Community（共用設定）
├── lib/
│   ├── api/
│   │   ├── client.ts                  # fetch wrapper + RFC7807 解析
│   │   └── server.ts                  # RSC/Server Action server fetch
│   ├── auth/session.ts
│   ├── actions/                       # Server Actions（依模組）
│   └── query/
│       └── query-client.ts            # TanStack Query client 設定
├── hooks/
│   ├── use-users.ts                   # TanStack Query：Grid 資料 + mutation
│   └── use-auth.ts
└── middleware.ts                      # 路由登入檢查 + CSP
```

### 2.2 Ant Design 整合（RSC 相容）

Next.js App Router 需要特別處理 Ant Design 的 CSS-in-JS：

```tsx
// app/layout.tsx（RSC）
import { AntdRegistry } from '@ant-design/nextjs-registry'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AntdRegistry>
          <ConfigProvider theme={{ token: { colorPrimary: '#1677ff' } }}>
            {children}
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}
```

Ant Design 主題客製化透過 `ConfigProvider` token 系統，取代 Tailwind CSS 變數。

### 2.3 Ag-Grid 整合（對應 ExtJS Grid）

| ExtJS Grid 功能 | Ag-Grid 對應 |
|----------------|-------------|
| `store: { pageSize: 20 }` | `paginationPageSize: 20` |
| `columns: [{ dataIndex, text, sortable }]` | `columnDefs: [{ field, headerName, sortable }]` |
| `filters: { type: 'string' }` | `filter: 'agTextColumnFilter'` |
| `loadMask: true` | `loading={isLoading}` |
| `bbar: Ext.PagingToolbar` | `pagination={true}` |
| Row selection | `rowSelection: 'multiple'` |
| Cell renderer | `cellRenderer: (params) => <Tag />` |

```tsx
// components/grid/base-grid.tsx
'use client'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, ClientSideRowModelModule } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'

ModuleRegistry.registerModules([ClientSideRowModelModule])

export function BaseGrid<T>({ rowData, columnDefs, loading, ...props }) {
  return (
    <div className="ag-theme-quartz" style={{ height: 500 }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        loading={loading}
        pagination
        paginationPageSize={20}
        {...props}
      />
    </div>
  )
}
```

### 2.4 react-hook-form + Ant Design 整合（對應 ExtJS Form）

| ExtJS Form 功能 | react-hook-form + antd 對應 |
|----------------|----------------------------|
| `xtype: 'textfield'` | `<Controller><Input /></Controller>` |
| `allowBlank: false` | `rules: { required: true }` + Zod |
| `vtype: 'email'` | `z.string().email()` |
| `getForm().getValues()` | `form.getValues()` |
| `getForm().isValid()` | `form.formState.isValid` |
| `getForm().reset()` | `form.reset()` |

```tsx
// _components/user-form.tsx
'use client'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, Input, Select, Switch, Button } from 'antd'
import { z } from 'zod'

const userSchema = z.object({
  loginName: z.string().min(1),
  firstName: z.string().min(1),
  lastName:  z.string().min(1),
  email:     z.string().email(),
  locale:    z.string(),
  enabled:   z.boolean(),
  authorities: z.array(z.string()),
})

export function UserForm({ user, onSuccess }) {
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: user,
  })
  // antd Form.Item 搭配 Controller 顯示 errors
  ...
}
```

### 2.5 TanStack Query v5 整合（對應 ExtJS Store）

| ExtJS Store 功能 | TanStack Query 對應 |
|----------------|-------------------|
| `store.load()` | `useQuery({ queryKey, queryFn })` |
| `store.autoLoad: true` | `enabled: true`（預設） |
| `store.reload()` | `queryClient.invalidateQueries()` |
| `store.add(record)` | `useMutation` + `onSuccess: invalidate` |
| `store.getCount()` | `data.page.totalElements` |
| Loading mask | `isLoading`, `isFetching` |

```tsx
// hooks/use-users.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { paths } from '@/lib/api/types'  // openapi-typescript 生成

export function useUsers(params: { page: number; size: number; q?: string }) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => fetchUsers(params),
    placeholderData: (prev) => prev,  // 對應 keepPreviousData
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (user) => updateUser(user),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}
```

### 2.6 Server vs Client Component 邊界

| 區塊 | 類型 | 說明 |
|------|------|------|
| `(admin)/layout.tsx` | **Server** | antd Layout 殼層，取 authUser + navigation |
| Side Menu（antd Menu） | **Client** | 折疊互動、active item 追蹤 |
| User Grid（Ag-Grid） | **Client + TanStack Query** | 分頁/排序/搜尋/樂觀更新 |
| User Form（react-hook-form） | **Client + Server Action** | 表單狀態在 client，提交走 Server Action |
| Profile / Settings | **Client + Server Action** | antd Form + react-hook-form |
| 2FA Enable（OTP input） | **Client** | antd Input.OTP + QRCode |
| 系統資訊頁 | **Server** | antd Descriptions，純讀取 |

### 2.7 資料獲取策略

| 場景 | 策略 |
|------|------|
| 初次頁面（殼層、authUser、navigation） | RSC `server fetch` |
| Grid 分頁 / 搜尋 / 排序 | **TanStack Query useQuery** |
| CRUD mutation（新增/編輯/刪除） | **Server Actions** + `useMutation` + `invalidateQueries` |
| 前端 crash log | Route Handler `/api/log` |

### 2.8 State 管理

```
├── Server state      → TanStack Query（useQuery / useMutation）
├── Form state        → react-hook-form（getValues / watch / formState）
├── URL state         → searchParams（分頁、搜尋條件）
├── 局部 UI state     → useState（Modal open/close）
└── 跨元件共享        → React Context（i18n、currentUser、toast）
```

---

## 3. Backend Architecture

### 3.1 分層結構

```
com.example.eds
├── config/          SecurityConfig, SessionConfig, CorsConfig, OpenApiConfig
├── security/        UserDetailsService, TwoFactorFilter, AuthenticationHandler
├── web/
│   ├── controller/  AuthController, UserController, UserConfigController,
│   │                NavigationController, LogController
│   ├── dto/         Request/Response records（與 Entity 解耦）
│   ├── mapper/      MapStruct Entity ↔ DTO
│   └── advice/      GlobalExceptionHandler（RFC 7807）
├── service/         AuthService, UserService, UserConfigService,
│                    NavigationService, MailService, TwoFactorService
├── repository/      Spring Data JPA Repositories
├── domain/          AppUser, Authority, PersistentLogin（Entity）
└── support/         分頁工具、共用常數
```

> **分層紀律：** Controller 只進出 DTO（不碰 Entity）、Service 持有 `@Transactional`、Repository 只負責資料存取。

### 3.2 REST API 設計規範

| 項目 | 規範 |
|------|------|
| Versioning | URI 前綴 `/api/v1/...` |
| 命名 | 名詞複數：`/api/v1/users`、`/api/v1/users/{id}` |
| 動作型端點 | 子資源動詞：`POST /users/{id}/unlock`、`POST /users/{id}/two-factor:disable` |
| HTTP 方法 | GET 讀、POST 建、PUT/PATCH 改、DELETE 刪 |
| 狀態碼 | 200/201/204、400/401/403/404/422/423/429、500 |
| Pagination | Offset 分頁（Ag-Grid 分頁對應） |
| Error 格式 | RFC 7807 Problem Details |

### 3.3 Ext Direct → REST API 對照表（20 endpoints）

| Ext Direct Method | REST Endpoint | Method |
|-------------------|---------------|--------|
| `securityService.getAuthUser` | `/api/v1/auth/me` | GET |
| `securityService.resetRequest` | `/api/v1/auth/password-reset:request` | POST |
| `securityService.reset` | `/api/v1/auth/password-reset` | POST |
| `securityService.signin2fa` | `/api/v1/auth/2fa` | POST |
| `securityService.switchUser` | `/api/v1/auth/impersonate` | POST |
| `userService.read` | `/api/v1/users?page=&size=&q=` | GET |
| `userService.update` | `/api/v1/users/{id}` | PUT |
| `userService.destroy` | `/api/v1/users/{id}` | DELETE |
| `userService.readAuthorities` | `/api/v1/authorities` | GET |
| `userService.unlock` | `/api/v1/users/{id}/unlock` | POST |
| `userService.disableTwoFactorAuth` | `/api/v1/users/{id}/two-factor:disable` | POST |
| `userService.sendPassordResetEmail` | `/api/v1/users/{id}/password-reset-email` | POST |
| `userConfigService.readSettings` | `/api/v1/me/settings` | GET |
| `userConfigService.updateSettings` | `/api/v1/me/settings` | PUT |
| `userConfigService.enable2f` | `/api/v1/me/two-factor:enable` | POST |
| `userConfigService.disable2f` | `/api/v1/me/two-factor:disable` | POST |
| `userConfigService.readPersistentLogins` | `/api/v1/me/devices` | GET |
| `userConfigService.destroyPersistentLogin` | `/api/v1/me/devices/{series}` | DELETE |
| `navigationService.getNavigation` | `/api/v1/navigation` | GET |
| `logService.logClientCrash` | `/api/v1/logs/client` | POST |

### 3.4 認證方案：Session + Cookie

| 維度 | Session + Cookie ✅ | JWT ❌ |
|------|---------------------|--------|
| 即時撤銷 / 帳號鎖定 | 直接刪 session，立即生效 | 需黑名單 |
| switchUser（impersonate） | `SwitchUserFilter` 原生支援 | 需自行重簽 |
| 2FA 兩階段登入 | `session=MFA_PENDING` 自然 | 狀態機麻煩 |
| XSS 風險 | HttpOnly Cookie，JS 取不到 | localStorage 易被竊 |

Cookie 設定：`HttpOnly; Secure; SameSite=Lax`

### 3.5 Spring Security 6.x 設定架構

```
SecurityFilterChain（Lambda DSL）
├── csrf: CookieCsrfTokenRepository（XSRF-TOKEN cookie，非 HttpOnly）
├── sessionManagement: 最大併發、session id 固定防護
├── authorizeHttpRequests:
│     /api/v1/auth/**  → permitAll
│     /api/v1/**       → authenticated
│     /actuator/health → permitAll
│     /actuator/**     → hasRole('ADMIN')
├── 2FA Filter: MFA_PENDING → 403 → /login/2fa
├── SwitchUserFilter（限 ROLE_ADMIN）
├── rememberMe: PersistentTokenBasedRememberMeServices
└── exceptionHandling: 401/403 JSON（不 redirect）
```

---

## 4. Data Flow Design

### 4.1 Authentication Flow（含 2FA）

```
Browser            Next.js (Server Action)      Spring Boot
  │ submit login         │                           │
  │────────────────────▶ │ POST /api/v1/auth/login   │
  │                      │──────────────────────────▶│ verify pw + 鎖定檢查
  │                      │◀── 200 {mfaRequired:true} ─│ session=MFA_PENDING
  │◀── antd Form 顯示 2FA│                           │
  │ submit TOTP（antd    │                           │
  │   Input.OTP）        │ POST /api/v1/auth/2fa     │
  │────────────────────▶ │──────────────────────────▶│ TOTP 驗證 → AUTHENTICATED
  │◀── redirect /users───│◀─────── 200 ──────────────│
```

### 4.2 User Grid CRUD Flow（Ag-Grid + TanStack Query）

```
Ag-Grid(Client)   TanStack Query    Server Action        Spring Boot
   │ 點擊 Edit        │                  │                    │
   │─────────────────▶│ 開 antd Modal    │                    │
   │ 填 react-hook-   │                  │                    │
   │   form 送出      │                  │                    │
   │──────────────────┼─────────────────▶│ updateUser(dto)    │
   │                  │                  │───────────────────▶│ PUT /api/v1/users/{id}
   │                  │                  │◀──────── 200 ──────│
   │                  │ invalidateQueries(['users'])           │
   │◀─ Grid 自動重整──│                  │                    │
```

### 4.3 Ext Direct → REST 漸進橋接（Strangler Fig）

```
              ┌──────────────── Next.js ────────────────────┐
舊 ExtJS 頁面─┤ /api/legacy/direct/* → Spring Boot Ext Direct│
新 React 頁面─┤ /api/v1/*            → Spring Boot REST      │
              └──────────────────────────────────────────────┘
                     共用 Spring Security / Session
```

切換順序：Auth → Navigation → User CRUD → Profile → 其餘

---

## 5. API Contract Design

### 5.1 OpenAPI 3.x + TypeScript 型別生成

```
Spring Boot
└── springdoc-openapi → /v3/api-docs（JSON spec）

Next.js 建構流程
└── openapi-typescript → src/lib/api/types.ts（自動生成）
    └── 所有 useQuery / useMutation 的 request/response 型別
```

### 5.2 分頁 Response 格式（Ag-Grid 相容）

```json
{
  "content": [
    {
      "id": 1, "loginName": "admin", "firstName": "Admin",
      "lastName": "User", "email": "admin@example.com",
      "enabled": true, "twoFactorAuth": false,
      "lastAccess": 1718234567000, "failedLogins": 0
    }
  ],
  "page": { "number": 0, "size": 20, "totalElements": 137, "totalPages": 7 }
}
```

Ag-Grid `pagination=true` + `paginationPageSize=20` 與此格式直接對應。

### 5.3 錯誤格式（RFC 7807 Problem Details）

```json
{
  "type": "https://api.example.com/errors/account-locked",
  "title": "Account Locked",
  "status": 423,
  "detail": "Account locked until 2026-06-13T10:30:00Z.",
  "instance": "/api/v1/auth/login"
}
```

TanStack Query 的 `onError` 直接解析 `response.json()` 得到此格式，antd `message.error(detail)` 顯示。

---

## 6. Security Design

| 控制項 | 設計 |
|--------|------|
| **CSP** | Next.js middleware nonce-based：`default-src 'self'; script-src 'self' 'nonce-xxx'; frame-ancestors 'none'` |
| **CSRF** | `CookieCsrfTokenRepository`（XSRF-TOKEN）+ `X-XSRF-TOKEN` header；Server Actions 有 Next 內建 origin 檢查 |
| **SameSite** | `SameSite=Lax; Secure; HttpOnly` |
| **Rate Limiting** | Bucket4j：登入/2FA/密碼重設 5 次/分/IP，回 `429` |
| **帳號鎖定** | `failedLogins` + `lockedUntil`，回 `423 Locked` |
| **Security Headers** | HSTS、`X-Content-Type-Options: nosniff`、`Referrer-Policy: same-origin` |

### 2FA TOTP 架構

```
啟用：POST /api/v1/me/two-factor:enable
  → 後端產生 secret（Base32），加密存 AppUser.secret
  → 回 otpauth:// URI
  → 前端 antd QRCode 元件渲染（secret 不入 log）
  → 使用者掃描 → antd Input.OTP 輸入 6 碼驗證

登入：密碼通過 → session MFA_PENDING
  → antd Input.OTP 輸入 → java-otp 驗證（時間窗 ±1）→ AUTHENTICATED
```

---

## 7. Testing Architecture

```
          ▲  E2E（Playwright + MCP Chrome DevTools）
         ╱ ╲   登入+2FA、Ag-Grid CRUD、權限選單、i18n
        ╱───╲ Integration（Spring Boot Test + Testcontainers MySQL）
       ╱     ╲  Controller→Service→Repository，含 Security Filter
      ╱───────╲ Unit（JUnit5 + Vitest）
     ╱_________╲  Service、TOTP、鎖定計數、react hooks、form 驗證
```

| 層級 | 工具 | 範圍 |
|------|------|------|
| Unit（後端） | JUnit 5 + Mockito | Service 邏輯、TOTP、鎖定策略 |
| Unit（前端） | Vitest + Testing Library | `useUsers` hook、form schema、元件 |
| Integration | Spring Boot Test + **Testcontainers（MySQL）** | 真實 DB + Security Filter |
| Contract | springdoc spec ↔ `openapi-typescript` | 前後端型別一致 |
| E2E | **Playwright + MCP Chrome DevTools** | 8 個功能模組驗收 |

Ag-Grid 單元測試：用 `@testing-library/react` render Grid，驗證 row data 與 column defs，而非 UI 像素。

---

## 8. Observability

| 面向 | 方案 |
|------|------|
| Health / Metrics | Spring Boot Actuator：`/health`、`/prometheus` |
| 結構化日誌 | Logback + JSON encoder，含 `traceId`、`userName` |
| Correlation ID | `X-Request-Id`（Next 產生 → 後端 MDC） |
| 前端錯誤 | antd ConfigProvider `onError` + `error.tsx` → `/api/v1/logs/client` |
| TanStack Query | DevTools（dev only，可視化 cache 狀態） |

---

## 9. Local Development Setup

```yaml
# docker-compose.yml
services:
  mysql:
    image: mysql:8.4
    ports: ["3306:3306"]
    environment: { MYSQL_DATABASE: eds, MYSQL_ROOT_PASSWORD: dev }
  mailhog:
    image: mailhog/mailhog
    ports: ["1025:1025", "8025:8025"]
```

```bash
Terminal 1: docker compose up
Terminal 2: ./mvnw spring-boot:run -Dspring.profiles.active=development  # :8080
Terminal 3: pnpm dev                                                       # :3000
```

`next.config.ts` rewrites `/api/**` → `http://localhost:8080`

```bash
# 安裝前端依賴
pnpm add antd @ant-design/nextjs-registry
pnpm add ag-grid-react ag-grid-community
pnpm add @tanstack/react-query @tanstack/react-query-devtools
pnpm add react-hook-form @hookform/resolvers zod
pnpm add openapi-typescript --save-dev
```

---

## 10. Architecture Decision Records（ADR）

### ADR-001：Session + Cookie，不用 JWT（同前版）

### ADR-002：Ant Design + Ag-Grid + TanStack Query，取代 shadcn + TanStack Table + SWR

| | |
|--|--|
| **Context** | ExtJS 是企業級 UI 框架，使用者習慣豐富元件；需遷移複雜 Grid 行為 |
| **Decision** | Ant Design 5.x + Ag-Grid Community + TanStack Query v5 |
| **Pros** | Ant Design 原生支援 ExtJS 所有對應元件（Form、Table、Modal、DatePicker）；Ag-Grid 功能最接近 ExtJS Grid（行內操作、Column Pinning、虛擬滾動）；TanStack Query 比 SWR 提供更完整的 DevTools 與 Optimistic Update |
| **Cons** | Ant Design bundle 較大（~1.5MB），需開 tree-shaking；Ag-Grid Community 缺少部分 Enterprise 功能（Excel export）；多個 lib 學習曲線 |
| **Rationale** | 企業後台的開發效率與功能完整性優先於 bundle size；Ag-Grid Community 對此專案功能足夠 |

### ADR-003：Strangler Fig 漸進遷移（同前版）

---

## 附：ExtJS → 新 Stack 元件完整對照

| ExtJS 元件 | Ant Design 5 對應 | 備註 |
|-----------|------------------|------|
| `Ext.grid.Panel` | **Ag-Grid** | 分頁/排序/過濾功能完整 |
| `Ext.form.Panel` | `antd Form` + **react-hook-form** | Zod schema 驗證 |
| `Ext.form.field.Text` | `antd Input` + `Controller` | |
| `Ext.form.field.ComboBox` | `antd Select` + `Controller` | |
| `Ext.form.field.Date` | `antd DatePicker` + `Controller` | |
| `Ext.form.field.Checkbox` | `antd Switch / Checkbox` + `Controller` | |
| `Ext.window.Window` | `antd Modal` | |
| `Ext.container.Viewport` | `antd Layout` | Sider + Header + Content |
| `Ext.tree.Panel（navigation）` | `antd Menu` | `mode="inline"` |
| `Ext.LoadMask` | `antd Spin` / `Ag-Grid loading` | |
| `Ext.MessageBox` | `antd Modal.confirm / message` | |
| `Ext.toolbar.Paging` | Ag-Grid 內建 `pagination` | |
| `Ext.button.Button` | `antd Button` | |
| `Ext.tab.Panel` | `antd Tabs` | |
| Error 403/404/500 | `antd Result` | |
| QR Code | `antd QRCode` | 2FA 設定 |
| OTP Input | `antd Input.OTP` | 2FA 登入 |

---

## 附：反模式紅旗清單

| 反模式 | 本設計如何規避 |
|--------|----------------|
| Golden Hammer（JWT / Redux） | Session + TanStack Query，按場景選型 |
| Premature Optimization（Edge Runtime） | Node runtime BFF + 單體後端 |
| 過度 RSC 化 | client boundary 推到葉節點 |
| H2 測過 MySQL 爆 | CI 用 Testcontainers MySQL |
| Response envelope over-wrapping | 直接回資源 + RFC 7807 |
| Big Bang 重寫 | Strangler Fig 漸進遷移 |
| antd 全量 import | tree-shaking + `babel-plugin-import` |
