# Product Features — eds-starter6-jpa

> 本文件描述 Legacy 應用的核心功能，供 Agent Team 在 Revamping 時參考實作範圍與對應行為。

---

## 1. 專案定位

`eds-starter6-jpa` 是一個**企業後台入門應用程式（Starter App）**，主要功能是使用者與權限管理，附帶完整的安全機制（2FA、帳號鎖定、密碼重設）。適合作為企業 Admin Panel 的起點。

---

## 2. 技術棧對照（Legacy → Target）

| 面向 | Legacy | Revamping 目標 |
|------|--------|---------------|
| 前端框架 | ExtJS 6.5 Classic | React 19 + Next.js 15 |
| 前端狀態管理 | ExtJS ViewModel (MVVM) | React Server Components + Client State |
| 前後端通信 | Ext Direct（RPC over HTTP POST） | REST API（JSON over HTTP） |
| 後端框架 | Spring Boot 2.7.15 | Spring Boot 3.x |
| Java 版本 | Java 8（legacy） | JDK 17 |
| ORM | JPA / Hibernate 5.3 | Spring Data JPA（Jakarta EE） |
| DB 遷移 | Liquibase | Liquibase（保留） |
| 認證機制 | Spring Security + Session | Spring Security + JWT 或 Session |
| 建構工具 | Maven + Sencha CMD | Maven（後端）+ npm/Turbopack（前端） |
| 部署 | 單一 JAR | 分離部署（Next.js + Spring Boot JAR） |

---

## 3. 核心功能模組

### 3.1 使用者認證（Authentication）

**功能描述：**
- 帳號密碼登入（loginName + password）
- 記住我（Remember-Me Cookie，有效期 31 天）
- CSRF 防護
- 帳號鎖定（連續 10 次失敗，鎖定 30 分鐘）
- Two-Factor Authentication（TOTP，使用 QRCode 設定）
- Heartbeat polling（保持 session 活躍）

**Legacy 實作：**
- `securityService` via Ext Direct
- Spring Security session-based auth
- `QRCodeController` 提供 QR Code 圖片

**對應 API：**

| 方法 | 說明 |
|------|------|
| `securityService.getAuthUser()` | 取得目前登入使用者資訊 |
| `securityService.reset(form)` | 執行密碼重設 |
| `securityService.resetRequest(form)` | 發送密碼重設信件 |
| `securityService.signin2fa(form)` | 2FA 驗證登入 |
| `securityService.switchUser(userId)` | 管理員切換成其他使用者身份 |
| `GET /poll/securityService/heartbeat/heartbeat` | Session Heartbeat |
| `GET /csrf` | 取得 CSRF Token |

---

### 3.2 使用者管理（User Management）

**功能描述：**
- 使用者列表（Grid，含分頁、搜尋）
- 新增 / 編輯使用者（Form）
- 刪除使用者（軟刪除，`is_deleted` flag）
- 角色/權限指派（authorities 字串，逗號分隔）
- 帳號啟用/停用
- 解鎖被鎖定的帳號
- 管理員替使用者停用 2FA
- 發送密碼重設信件

**Legacy 實作：**
- `userService` via Ext Direct
- `User` Entity（table: `AppUser`）
- ExtJS Grid + Form（`view/user/`）
- ExtClassGenerator 自動生成 `Starter.model.User`

**對應 API：**

| 方法 | 說明 |
|------|------|
| `userService.read(params)` | 讀取使用者列表（含分頁） |
| `userService.update(user)` | 新增或更新使用者 |
| `userService.destroy(user)` | 刪除使用者（軟刪除） |
| `userService.readAuthorities(params)` | 取得可用權限清單 |
| `userService.unlock(userId)` | 解鎖被鎖定帳號 |
| `userService.disableTwoFactorAuth(userId)` | 停用指定使用者的 2FA |
| `userService.sendPassordResetEmail(userId)` | 發送密碼重設信件 |

---

### 3.3 使用者設定（User Profile & Settings）

**功能描述：**
- 查看 / 修改個人設定（語系、密碼等）
- 啟用 / 停用自己的 2FA
- 查看目前所有記住我登入裝置清單
- 撤銷特定裝置的記住我 Token

**Legacy 實作：**
- `userConfigService` via Ext Direct
- `view/userconfig/Panel.js`

**對應 API：**

| 方法 | 說明 |
|------|------|
| `userConfigService.readSettings(params)` | 讀取個人設定 |
| `userConfigService.updateSettings(settings)` | 更新個人設定 |
| `userConfigService.enable2f()` | 啟用自己的 2FA（回傳 QR Code URL） |
| `userConfigService.disable2f()` | 停用自己的 2FA |
| `userConfigService.readPersistentLogins(params)` | 讀取記住我裝置清單 |
| `userConfigService.destroyPersistentLogin(token)` | 撤銷特定記住我 Token |

---

### 3.4 導覽系統（Navigation）

**功能描述：**
- 依使用者權限動態產生左側選單
- 選單以樹狀結構（NavigationNode）定義
- 選單項目對應 ExtJS view 模組

**Legacy 實作：**
- `navigationService` via Ext Direct
- `NavigationNode` DTO（`name`, `text`, `iconCls`, `children`）
- `store/Navigation.js` 存儲選單資料

**對應 API：**

| 方法 | 說明 |
|------|------|
| `navigationService.getNavigation(params)` | 取得目前使用者的導覽選單樹 |

---

### 3.5 系統管理（System Administration）

**功能描述：**
- 系統資訊查看（版本、建構時間、JVM 資訊）
- 前端錯誤記錄（Client-side crash log 送至後端）

**Legacy 實作：**
- `SystemService` 提供系統資訊
- `LogService` 記錄前端錯誤
- Spring Boot Actuator（`/actuator/info` 等端點）

**對應 API：**

| 方法 | 說明 |
|------|------|
| `logService.logClientCrash(errorInfo)` | 記錄前端 JavaScript 錯誤 |

---

### 3.6 郵件通知（Email Notifications）

**功能描述：**
- 密碼重設信件（含重設連結，Token 有效期限）
- 郵件寄件人：`no-reply@starter.com`（可設定）

**Legacy 實作：**
- `MailService` + Spring Boot Starter Mail
- 連接 `localhost` SMTP（預設，可換設定）
- `passwordResetToken` + `passwordResetTokenValidUntil` 儲存在 `User` Entity

---

### 3.7 錯誤頁面（Error Pages）

**功能描述：**
- 403 Forbidden：沒有權限時顯示客製化頁面
- 404 Not Found：路由不存在時顯示客製化頁面
- 500 Internal Server Error：伺服器錯誤時顯示客製化頁面

**Legacy 實作：**
- `view/main/Error403.js`、`Error404.js`、`Error500.js`（ExtJS 視圖）
- Spring Security 設定重導至對應路徑

---

### 3.8 多語系支援（Internationalization）

**功能描述：**
- 使用者可選擇介面語系（`locale` 欄位）
- 支援多語言資源檔

**Legacy 實作：**
- `AppLocaleResolver` 解析使用者語系
- `store/Languages.js` 提供語言選項清單
- `UserSettings.locale` 欄位儲存偏好語系

---

## 4. 資料模型

### User（table: AppUser）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | Long | PK（繼承自 AbstractPersistable） |
| `loginName` | String | 唯一登入名稱 |
| `firstName` | String | 名 |
| `lastName` | String | 姓 |
| `email` | String | 唯一 Email |
| `authorities` | String | 角色字串（逗號分隔） |
| `passwordHash` | String | BCrypt hash（不序列化至前端） |
| `locale` | String | 語系（max 8） |
| `enabled` | boolean | 帳號是否啟用 |
| `failedLogins` | Integer | 連續失敗登入次數 |
| `lockedOutUntil` | ZonedDateTime | 鎖定到期時間 |
| `lastAccess` | ZonedDateTime | 最後存取時間 |
| `passwordResetToken` | String | 密碼重設 Token（36 chars UUID） |
| `passwordResetTokenValidUntil` | ZonedDateTime | Token 有效期限 |
| `deleted` | boolean | 軟刪除 flag（column: is_deleted） |
| `secret` | String | TOTP 2FA 金鑰（不序列化） |
| `twoFactorAuth` | boolean | 是否啟用 2FA（computed，非 DB 欄位） |

### Authority（table: Authority）

角色常數（`ADMIN`、`USER` 等），與 User 無 FK 關聯，以字串形式存在 User.authorities。

### PersistentLogin（table: persistent_logins）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `series` | String | PK，Token 系列 ID |
| `token` | String | 實際 Token |
| `lastUsed` | Date | 最後使用時間 |
| `user` | User | 關聯使用者（@ManyToOne） |

---

## 5. 非功能性需求

| 需求 | Legacy 實作 | Revamping 建議保留 |
|------|-------------|-------------------|
| CSRF 防護 | Spring Security CSRF filter | 是（REST 可用 SameSite Cookie 或 CSRF header） |
| Session 管理 | Spring Session（480 分鐘） | 視認證方案而定 |
| 帳號鎖定 | 10 次失敗 / 30 分鐘 | 是 |
| 密碼格式驗證 | Spring Validation | 是 |
| DB Schema 版本控制 | Liquibase | 是，保留 |
| 軟刪除 | `is_deleted` flag | 是 |
| 非同步處理 | Spring @Async（ThreadPool） | 是，至少郵件發送需要 |
| 安全標頭 | Spring Security defaults | 是 |

---

## 6. Revamping 範圍邊界

**本次 Revamping 包含（In Scope）：**
- 8 個功能模組的前端 UI 改寫（ExtJS → React 19 + Next.js 15）
- 後端 API 改寫（Ext Direct → REST JSON）
- Java / Spring Boot 升級（JDK 17 + SB 3.x）
- 資料模型保留（User / Authority / PersistentLogin）

**不在本次範圍（Out of Scope）：**
- 新增 Legacy 沒有的功能
- 資料庫從 H2/MySQL 換成其他資料庫
- 微服務拆分
- CI/CD pipeline 建置
