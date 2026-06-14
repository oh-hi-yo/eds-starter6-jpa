/**
 * 手寫型別 — 與後端 OpenAPI spec 保持一致。
 * 執行 `pnpm generate:types`（需後端在 :8080 運行）可從 /v3/api-docs 重新生成
 * src/lib/api/openapi.d.ts，作為型別契約的原始來源。
 *
 * TODO: 後續將此檔案改為從 openapi.d.ts 的 components.schemas 重新 derive。
 */
// 共用型別 — Phase 3 將由 openapi-typescript 從後端 OpenAPI spec 生成取代。

export interface AuthUser {
  id: number;
  loginName: string;
  firstName: string;
  lastName: string;
  email: string;
  enabled: boolean;
  twoFactorAuth: boolean;
  authorities: string[];
  locale: string;
  lastAccess: number;
}

export interface UserRow extends AuthUser {
  failedLogins: number;
  lockedUntil: number | null;
}

export interface NavigationNode {
  key: string;
  label: string;
  icon?: string;
  path?: string;
  children?: NavigationNode[];
}

export interface PageMeta {
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PageResult<T> {
  content: T[];
  page: PageMeta;
}

export interface Device {
  series: string;
  ip: string;
  userAgent: string;
  lastUsed: number;
}

export interface UserSettings {
  locale: string;
}

/** RFC 7807 Problem Details */
export interface ProblemDetail {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
}
