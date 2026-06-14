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
