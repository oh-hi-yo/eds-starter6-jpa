# Acceptance Task — Phase 3 E2E 整合驗收

> **驗收日期：** 2026-06-15  
> **執行人：** 人工（配合 Playwright 自動化）  
> **通過條件：** 本文所有 ✅ 項目全數通過，才算正式完成 Phase 3 整合驗收

---

## 驗收前提條件

> 所有測試**必須**在以下環境下執行：前後端同時在 local 運行，Playwright 打的是真實 Spring Boot，不是 Mock API。

---

## Step 0 — 環境啟動

### 0.1 啟動後端（Spring Boot）

```bash
# 確認沒有舊的 Java process 佔著 H2 DB
lsof ./db/test.mv.db 2>/dev/null || echo "DB is free"

# 若有 stale process，先 kill
# kill -9 <PID>

# 啟動後端（Terminal 1）
./mvnw spring-boot:run -Dspring-boot.run.profiles=development
```

**通過條件：**
```
Started Application in X.XXX seconds
Tomcat started on port 8080
```

確認可用：
```bash
curl -s http://localhost:8080/actuator/health
# 預期：{"status":"UP"}
```

---

### 0.2 啟動前端（Next.js）

```bash
# Terminal 2
cd client-next
pnpm dev
```

**通過條件：** 終端機出現 `Ready in Xs`，瀏覽器開啟 http://localhost:3000 可看到 login 頁面。

---

### 0.3 確認整合模式

前端應打**真實後端**，不是 mock。確認方式：

```bash
# 查看 next.config.ts 的 rewrites
grep -A 10 "rewrites" client-next/next.config.ts
```

預期看到 `/api/v1/**` rewrite 指向 `http://localhost:8080/api/v1/**`（而非 mock route handler）。

---

## Step 1 — 後端 IT 測試

```bash
./mvnw test
```

**通過條件：**

| 項目 | 通過條件 |
|------|---------|
| Tests run | ≥ 12 |
| Failures | 0 |
| Errors | 0 |
| Skipped | 0 |

```
[INFO] Tests run: 12, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

---

## Step 2 — Playwright E2E 整合測試

> ⚠️ **重要：** 執行前必須確認 Step 0 的後端已啟動（port 8080），且前端已啟動（port 3000）。  
> Playwright 的 `webServer` 設定會重用 existing server，因此不會另起 mock server。

```bash
cd client-next
pnpm e2e
```

或指定 reporter：

```bash
pnpm exec playwright test --reporter=list
```

---

### 2.1 Auth（認證）測試

**Spec 檔案：** `e2e/auth.spec.ts`

| # | Test Case | 操作 | 通過條件 |
|---|-----------|------|---------|
| A1 | 正確帳密登入 | `admin` / `admin` | 跳轉到 `/users`，標題「使用者管理」顯示 |
| A2 | 錯誤密碼 | `admin` / `wrong-password` | 停在 `/login`，顯示「登入名稱或密碼錯誤」 |
| A3 | 2FA 使用者 | `mfauser` / `admin` | 跳轉 `/login/2fa`，OTP `123456` → 進入 `/users` |
| A4 | 登出 | 點「登出」按鈕 | 跳轉回 `/login` |

> ⚠️ **A3 特別注意：** `mfauser` 帳號必須存在於真實 H2 DB 且已啟用 2FA。若測試失敗，查看後端 DB 資料（`http://localhost:8080/h2-console`）確認帳號存在。

---

### 2.2 User Management（使用者管理）測試

**Spec 檔案：** `e2e/users.spec.ts`

| # | Test Case | 操作 | 通過條件 |
|---|-----------|------|---------|
| U1 | Grid 顯示使用者資料 | 登入後看 `/users` | 欄位標題「登入名稱」可見，`admin` 帳號出現在 Grid |
| U2 | 搜尋使用者 | 搜尋框輸入 `admin` + Enter | Grid 過濾，仍可見 `admin` |
| U3 | 新增使用者 | 點「新增使用者」，填表單，儲存 | Modal 關閉，顯示「已新增使用者」 |

> **U1 關鍵：** 後端真實回傳 DB 資料，而非 mock。確認回傳的 `admin` 是 DB 中實際的使用者。

---

### 2.3 Navigation（導覽選單）測試

**Spec 檔案：** `e2e/navigation.spec.ts`

| # | Test Case | 操作 | 通過條件 |
|---|-----------|------|---------|
| N1 | ADMIN 選單 | `admin` 登入 | 側邊欄顯示「使用者管理」、「系統管理」、「個人設定」 |
| N2 | USER 選單 | `david3` 登入 | 側邊欄只顯示「個人設定」，無「使用者管理」 |

> **N2 關鍵：** 依賴後端 `/api/v1/navigation` 依角色回傳不同選單。這是整合驗證的核心——確認後端 role-based 邏輯正確。

---

### 2.4 Profile（個人設定）測試

**Spec 檔案：** `e2e/profile.spec.ts`

| # | Test Case | 操作 | 通過條件 |
|---|-----------|------|---------|
| P1 | 儲存設定 | 點「儲存設定」 | 顯示「設定已儲存」 |
| P2 | 啟用 2FA | 點「兩步驟驗證」Tab → 點「啟用兩步驟驗證」 | QRCode 元件出現 |
| P3 | 登入裝置 | 點「登入裝置」Tab | 裝置清單出現（Chrome / macOS 或實際裝置字串） |

---

### 2.5 Error Pages（錯誤頁面）測試

**Spec 檔案：** `e2e/error-pages.spec.ts`

| # | Test Case | 操作 | 通過條件 |
|---|-----------|------|---------|
| E1 | 404 頁面 | 訪問 `/not-a-real-page` | 顯示 404 antd Result 元件 |
| E2 | 403 頁面 | 未登入訪問 `/users` 或受限路由 | 顯示 403 或跳轉 `/login` |

---

## Step 3 — 瀏覽器手動 Golden Path 驗證

> Playwright 抓的是 DOM，人工再走一遍確認視覺與 UX 正常。

開啟 **http://localhost:3000**，依序操作：

| # | 操作 | 預期結果 |
|---|------|---------|
| G1 | 輸入 `admin` / `admin`，點「登入」 | 跳轉到 `/users`，看到 Ag-Grid 使用者列表 |
| G2 | 點選單「個人設定」 | 跳轉 `/profile`，看到三個 Tab |
| G3 | 點「使用者管理」，點任一 row 的「編輯」 | Modal 開啟，表單有預填資料 |
| G4 | 修改 firstName，點「儲存」 | Modal 關閉，Grid 自動重整，顯示新 firstName |
| G5 | 點「登出」 | 跳回 `/login` |
| G6 | 開 Browser DevTools，查 Console | **0 JavaScript errors** |
| G7 | DevTools Network，查登入 API | `POST /api/v1/auth/login` → 200，response 有 user 資料 |

---

## Step 4 — API 直接驗證

```bash
# 取得 session
COOKIE=$(curl -s -c - -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginName":"admin","password":"admin"}' \
  -w "\n%{http_code}" | tail -1)

echo "HTTP: $COOKIE"

# 驗證 me endpoint
curl -s -b "JSESSIONID=$SESSION" http://localhost:8080/api/v1/auth/me | python3 -m json.tool
```

| # | Endpoint | 通過條件 |
|---|----------|---------|
| R1 | `POST /api/v1/auth/login` | HTTP 200，回傳 user 物件 |
| R2 | `GET /api/v1/auth/me` | HTTP 200，回傳已登入 user |
| R3 | `GET /api/v1/users?page=0&size=20` | HTTP 200，回傳分頁使用者列表 |
| R4 | `GET /api/v1/navigation` | HTTP 200，回傳 navigation tree |
| R5 | `POST /api/v1/auth/logout` | HTTP 200 或 204 |
| R6 | `GET /api/v1/auth/me`（logout 後） | HTTP 401 |

---

## 驗收結果記錄表

> 驗收完成後填入此表，簽核後更新 `progress.md`。

**執行日期：** ___________  
**執行人：** ___________  
**環境：** local（backend port 8080, frontend port 3000）

| 步驟 | 項目 | 結果 | 備註 |
|------|------|------|------|
| Step 0 | 後端啟動（health UP） | ⬜ PASS / ⬜ FAIL | |
| Step 0 | 前端啟動（3000 可訪問） | ⬜ PASS / ⬜ FAIL | |
| Step 0 | 整合模式確認（rewrite 指向 8080） | ⬜ PASS / ⬜ FAIL | |
| Step 1 | `./mvnw test` — 12 tests GREEN | ⬜ PASS / ⬜ FAIL | |
| Step 2 | Auth E2E — A1 正確登入 | ⬜ PASS / ⬜ FAIL | |
| Step 2 | Auth E2E — A2 錯誤密碼 | ⬜ PASS / ⬜ FAIL | |
| Step 2 | Auth E2E — A3 2FA 流程 | ⬜ PASS / ⬜ FAIL | |
| Step 2 | Auth E2E — A4 登出 | ⬜ PASS / ⬜ FAIL | |
| Step 2 | Users E2E — U1 Grid 顯示 | ⬜ PASS / ⬜ FAIL | |
| Step 2 | Users E2E — U2 搜尋 | ⬜ PASS / ⬜ FAIL | |
| Step 2 | Users E2E — U3 新增 | ⬜ PASS / ⬜ FAIL | |
| Step 2 | Nav E2E — N1 ADMIN 選單 | ⬜ PASS / ⬜ FAIL | |
| Step 2 | Nav E2E — N2 USER 選單 | ⬜ PASS / ⬜ FAIL | |
| Step 2 | Profile E2E — P1 儲存設定 | ⬜ PASS / ⬜ FAIL | |
| Step 2 | Profile E2E — P2 啟用 2FA | ⬜ PASS / ⬜ FAIL | |
| Step 2 | Profile E2E — P3 裝置清單 | ⬜ PASS / ⬜ FAIL | |
| Step 2 | Error Pages — E1 404 | ⬜ PASS / ⬜ FAIL | |
| Step 2 | Error Pages — E2 403/redirect | ⬜ PASS / ⬜ FAIL | |
| Step 3 | Golden Path G1–G7 手動驗收 | ⬜ PASS / ⬜ FAIL | |
| Step 4 | API R1–R6 curl 驗證 | ⬜ PASS / ⬜ FAIL | |

---

## 通過/失敗判定

**PASS 條件：** Step 1 + Step 2 所有項目全數 PASS，Step 3 無嚴重 UX 問題，Step 4 R1–R6 全部正確 HTTP status。

**FAIL 處理：**
1. 記錄失敗的 test case 名稱 + 錯誤訊息
2. 截圖存於 `client-next/test-results/` 或 `.doc/screenshots/`
3. 修復後重新執行對應 step
4. 全部通過後重新填寫此表

---

## 驗收通過後的動作

```bash
# 1. 更新 progress.md — Phase 3 狀態改為 ✅ 完成
# 2. Commit
git add .doc/progress.md .doc/acceptance-task.md
git commit -m "docs: Phase 3 acceptance passed — E2E integration verified"
git push origin feauture/revamping-experiment
```
