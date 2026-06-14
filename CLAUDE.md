# eds-starter6-jpa — Claude Code Context

## 專案概述

這是一個 **ExtJS 6.5 Classic + Spring Boot 2.7 + Java + JPA/Hibernate** 的 Legacy 全端入門應用程式。
提供完整的使用者認證、角色管理、2FA 等企業應用基本功能。

目前用途：作為 **Harness Engineering Revamping 練習**的 Legacy 素材，目標改造為 React 19 + Next.js 15 + JDK 17 + Spring Boot。

Branch：`feauture/revamping-experiment`

---

## 技術棧

| 層級 | 技術 | 版本 |
|------|------|------|
| 前端框架 | ExtJS Classic | 6.5.2.463 |
| 前端通信 | Ext Direct (extdirectspring) | 1.8.1 |
| 後端框架 | Spring Boot | 2.7.15 |
| ORM | Spring Data JPA / Hibernate | 5.3.2 |
| 資料庫 | H2 (dev) / MySQL (prod) | — |
| DB 版本管理 | Liquibase | 3.8.7 |
| 查詢 DSL | QueryDSL JPA | SB managed |
| 安全框架 | Spring Security | SB managed |
| 建構工具 | Maven (mvnw) + Sencha CMD | — |
| 模型生成 | ExtClassGenerator | 2.0.0 |

---

## 目錄結構

```
eds-starter6-jpa/
├── client/                          # ExtJS Classic 前端
│   ├── app/                         # ExtJS 應用程式碼
│   │   ├── model/                   # 資料模型（由 Java 實體自動生成）
│   │   ├── store/                   # 資料存儲（Languages, Navigation, Authority）
│   │   ├── view/                    # UI 視圖
│   │   │   ├── main/                # 主頁面框架（Main, MainController, MainModel）
│   │   │   ├── user/                # 使用者管理（Grid, Form, Controller, ViewModel）
│   │   │   ├── userconfig/          # 使用者設定（Panel, Controller, ViewModel）
│   │   │   └── auth/                # 認證視圖（Dialog, Signout）
│   │   └── Application.js           # 應用程式入口
│   ├── api.js                       # Ext Direct API 定義（由後端自動生成）
│   ├── app.json                     # ExtJS 應用設定（toolkit: classic, theme: triton）
│   └── workspace.json               # ExtJS workspace（ext 6.5.2.463）
│
├── src/main/java/ch/rasc/eds/starter/
│   ├── Application.java             # Spring Boot 主類
│   ├── config/                      # Spring 設定
│   │   └── security/               # Spring Security 設定
│   ├── entity/                      # JPA 實體（User, Authority, PersistentLogin）
│   ├── service/                     # 業務邏輯（7 個 Service）
│   ├── dto/                         # 資料傳輸物件
│   ├── web/                         # Web Controllers（CSRF, QRCode）
│   └── schedule/                    # 排程任務
│
└── src/main/resources/
    ├── application.yml              # 生產環境設定（port: 80, H2/MySQL）
    ├── application-development.yml  # 開發環境設定（port: 8080）
    └── db/changelog.xml            # Liquibase DB 遷移
```

---

## 常用指令

### 開發環境執行（需要 Sencha CMD + ExtJS 6.5 SDK）

```bash
# 1. 安裝 ExtJS framework（只需執行一次）
cd client
sencha app install --framework=/path/to/extjs6.5/

# 2. 啟動前端 watch（Terminal 1）
cd client
sencha app watch

# 3. 啟動後端（Terminal 2）
./mvnw spring-boot:run -Dspring.profiles.active="development"

# 4. 開啟瀏覽器
open http://localhost:8080
```

### 生產環境建構

```bash
# 建構完整 JAR（含前端）
./mvnw clean package

# 執行生產 JAR（port 80）
java -jar target/eds-starter6-jpa.jar
```

### 測試

```bash
./mvnw test
```

---

## 重要設定

- **預設資料庫**：H2（`./db/test`），無需安裝，開箱即用
- **MySQL 切換**：取消 `application.yml` 中 MySQL 設定的註解
- **登入鎖定**：10 次失敗後鎖定 30 分鐘
- **Session Timeout**：480 分鐘
- **Remember-Me**：31 天

---

## Ext Direct API 端點

所有後端通信透過 `POST /router` 走 Ext Direct 協議：

| Service | Actions |
|---------|---------|
| `logService` | `logClientCrash` |
| `navigationService` | `getNavigation` |
| `securityService` | `getAuthUser`, `reset`, `resetRequest`, `signin2fa`, `switchUser` |
| `userConfigService` | `destroyPersistentLogin`, `disable2f`, `enable2f`, `readPersistentLogins`, `readSettings`, `updateSettings` |
| `userService` | `destroy`, `disableTwoFactorAuth`, `read`, `readAuthorities`, `sendPassordResetEmail`, `unlock`, `update` |

另有 Heartbeat Polling：`GET /poll/securityService/heartbeat/heartbeat`

---

## Revamping 目標技術棧

| 現狀 | 目標 |
|------|------|
| ExtJS 6.5 Classic | React 19 + Next.js 15 |
| Ext Direct 協議 | REST API (JSON) |
| Spring Boot 2.7 | Spring Boot 3.x |
| Java 8/Legacy | JDK 17 |
| Sencha CMD 建構 | npm / Turbopack |
| H2 / MySQL | 保留 MySQL / H2 |
| Liquibase | 保留 Liquibase |
