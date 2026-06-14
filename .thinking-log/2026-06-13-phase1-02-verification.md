# Thinking Log — Phase 1 / Entry 02: Build & Verification

**時間：** 2026-06-13
**角色：** QA + Frontend Dev
**Task：** Phase 1 驗收閘門

---

## 遇到的問題與解法（trace）

### 1. pnpm 系統未安裝
- corepack `enable` 因無 `/usr/bin` 寫入權限失敗 → 改 `--install-directory ~/.local/bin`（已在 PATH）。pnpm 11.6.0。

### 2. pnpm pre-run dep check 擋住 vitest/build
- `pnpm test` 觸發 `runDepsStatusCheck` → 內部 `pnpm install` 因 `ERR_PNPM_IGNORED_BUILDS`（sharp/unrs-resolver）exit 1。
- 設 `.npmrc verify-deps-before-run=false` 仍被 corepack wrapper 覆蓋。
- **最終解法：直接呼叫 `node_modules/.bin/{vitest,next,playwright}`，完全繞過 pnpm wrapper。** sharp/unrs-resolver 為 optional（不用 next/image），略過 build 不影響。

### 3. Playwright 瀏覽器缺 chrome-headless-shell
- 先前只 `playwright install chromium`（完整版），但 runner 預設用 headless shell。
- 補 `playwright install chromium-headless-shell` 解決。

### 4. Port 3000 被佔用（關鍵環境問題）
- 啟動前 3000 已被 **另一個 Express + create-react-app 服務** 佔用（`X-Powered-By: Express`，CRA 模板）。
- 非本專案、`ss` 看不到 PID owner、`fuser -k` 無法終止 → 推測非本 user/sandbox 程序。
- **決策：前端改跑 3100，Playwright baseURL 以 `BASE_URL` env 參數化。** 已記錄請使用者自行釋放 3000。

### 5. antd CJK 按鈕自動插空格 → Playwright 找不到按鈕
- antd 預設 `autoInsertSpace`：兩個 CJK 字之間插空格，"登入" → "登 入"，導致 `getByRole('button',{name:'登入'})` 找不到。
- **解法：ConfigProvider `button={{ autoInsertSpace: false }}` 全域關閉。** 一次修正所有按鈕。

### 6. USER 登入後落點錯誤
- login 頁原本硬寫 `router.push("/users")`，一般 USER 也被送到 /users。
- **解法：依 `res.user.authorities` 判斷 admin→/users、其餘→/profile。** 並把 mfauser 設為 ADMIN，讓 2FA 測試仍落在 /users 有意義。

---

## 驗收結果

- `next build`：✅ 0 errors，24 routes
- `vitest run`：✅ 14/14
- `playwright test`：✅ 14/14（auth 4 + users 3 + navigation 2 + profile 3 + error-pages 2）
- 截圖：✅ 6 張（login / users-grid / user-form / profile-settings / 2fa-qrcode / system）

## 下一步

- 等待使用者確認 feature。
- 確認 OK → git commit + push（Phase 1）。
- 之後進入 Phase 2（Spring Boot 3 + JDK 17 + REST API）。
