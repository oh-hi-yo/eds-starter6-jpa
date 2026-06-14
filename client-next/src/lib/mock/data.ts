// Phase 1 Mock 資料層 —— Phase 3 整合真實後端時整個 mock/ 目錄移除。
import type { AuthUser, Device, NavigationNode, UserRow, UserSettings } from "@/lib/types";

const FIRST = ["Alice", "Bob", "Carol", "David", "Eve", "Frank", "Grace", "Heidi", "Ivan", "Judy"];
const LAST = ["Chen", "Lin", "Wang", "Liu", "Yang", "Huang", "Wu", "Tsai", "Hsu", "Kao"];
const LOCALES = ["zh-TW", "en", "ja"];

function makeUser(id: number): UserRow {
  const first = FIRST[id % FIRST.length];
  const last = LAST[id % LAST.length];
  const isAdmin = id === 1;
  const locked = id % 13 === 0;
  return {
    id,
    loginName: id === 1 ? "admin" : `${first.toLowerCase()}${id}`,
    firstName: first,
    lastName: last,
    email: id === 1 ? "admin@example.com" : `${first.toLowerCase()}${id}@example.com`,
    enabled: id % 7 !== 0,
    twoFactorAuth: id % 5 === 0,
    authorities: isAdmin ? ["ADMIN", "USER"] : ["USER"],
    locale: LOCALES[id % LOCALES.length],
    lastAccess: Date.UTC(2026, 5, 13) - id * 3_600_000,
    failedLogins: locked ? 10 : id % 3,
    // 相對現在 +24h，確保測試期間帳號保持鎖定狀態（解鎖按鈕才會出現）
    lockedUntil: locked ? Date.now() + 24 * 3_600_000 : null,
  };
}

// 種子資料：admin (id=1) + mfauser + 35 筆一般使用者
const SEED: UserRow[] = [
  makeUser(1),
  {
    id: 2,
    loginName: "mfauser",
    firstName: "Multi",
    lastName: "Factor",
    email: "mfa@example.com",
    enabled: true,
    twoFactorAuth: true,
    authorities: ["ADMIN", "USER"],
    locale: "zh-TW",
    lastAccess: Date.UTC(2026, 5, 12),
    failedLogins: 0,
    lockedUntil: null,
  },
  ...Array.from({ length: 35 }, (_, i) => makeUser(i + 3)),
];

// in-memory store（dev 重啟即重置，足夠 Phase 1 驗證）
const users = new Map<number, UserRow>(SEED.map((u) => [u.id, u]));
let nextId = 100;

export const AUTHORITIES = ["ADMIN", "USER"];

export function toAuthUser(u: UserRow): AuthUser {
  const { failedLogins: _f, lockedUntil: _l, ...rest } = u;
  void _f;
  void _l;
  return rest;
}

export function findUserByLogin(loginName: string): UserRow | undefined {
  for (const u of users.values()) if (u.loginName === loginName) return u;
  return undefined;
}

export function listUsers(page: number, size: number, q?: string) {
  let all = [...users.values()].sort((a, b) => a.id - b.id);
  if (q && q.trim()) {
    const needle = q.trim().toLowerCase();
    all = all.filter(
      (u) =>
        u.loginName.toLowerCase().includes(needle) ||
        u.email.toLowerCase().includes(needle) ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(needle),
    );
  }
  const totalElements = all.length;
  const start = page * size;
  const content = all.slice(start, start + size);
  return {
    content,
    page: {
      number: page,
      size,
      totalElements,
      totalPages: Math.max(1, Math.ceil(totalElements / size)),
    },
  };
}

export function upsertUser(input: Partial<UserRow> & { id?: number | null }): UserRow {
  if (input.id) {
    const existing = users.get(input.id);
    if (!existing) throw new Error("not found");
    const merged = { ...existing, ...input, id: input.id } as UserRow;
    users.set(input.id, merged);
    return merged;
  }
  const id = nextId++;
  const created: UserRow = {
    id,
    loginName: input.loginName ?? `user${id}`,
    firstName: input.firstName ?? "",
    lastName: input.lastName ?? "",
    email: input.email ?? "",
    enabled: input.enabled ?? true,
    twoFactorAuth: false,
    authorities: input.authorities ?? ["USER"],
    locale: input.locale ?? "zh-TW",
    lastAccess: Date.now(),
    failedLogins: 0,
    lockedUntil: null,
  };
  users.set(id, created);
  return created;
}

export function deleteUser(id: number): boolean {
  return users.delete(id);
}

export function unlockUser(id: number): UserRow | undefined {
  const u = users.get(id);
  if (!u) return undefined;
  u.failedLogins = 0;
  u.lockedUntil = null;
  return u;
}

export function disableTwoFactor(id: number): UserRow | undefined {
  const u = users.get(id);
  if (!u) return undefined;
  u.twoFactorAuth = false;
  return u;
}

export function getNavigation(authorities: string[]): NavigationNode[] {
  const isAdmin = authorities.includes("ADMIN");
  const nav: NavigationNode[] = [];
  if (isAdmin) {
    nav.push({ key: "users", label: "使用者管理", icon: "team", path: "/users" });
  }
  nav.push({ key: "profile", label: "個人設定", icon: "user", path: "/profile" });
  if (isAdmin) {
    nav.push({ key: "system", label: "系統管理", icon: "setting", path: "/system" });
  }
  return nav;
}

// 個人設定（per-login，in-memory）
const settingsStore = new Map<string, UserSettings>();
export function getSettings(loginName: string): UserSettings {
  const u = findUserByLogin(loginName);
  return settingsStore.get(loginName) ?? { locale: u?.locale ?? "zh-TW" };
}
export function updateSettings(loginName: string, s: UserSettings): UserSettings {
  settingsStore.set(loginName, s);
  const u = findUserByLogin(loginName);
  if (u) u.locale = s.locale;
  return s;
}

// 記住我裝置（per-login，in-memory）
const deviceStore = new Map<string, Device[]>();
function seedDevices(loginName: string): Device[] {
  return [
    { series: "ser-001", ip: "192.168.1.10", userAgent: "Chrome / macOS", lastUsed: Date.now() - 3_600_000 },
    { series: "ser-002", ip: "10.0.0.5", userAgent: "Safari / iOS", lastUsed: Date.now() - 86_400_000 },
  ];
}
export function listDevices(loginName: string): Device[] {
  if (!deviceStore.has(loginName)) deviceStore.set(loginName, seedDevices(loginName));
  return deviceStore.get(loginName)!;
}
export function revokeDevice(loginName: string, series: string): boolean {
  const list = listDevices(loginName);
  const idx = list.findIndex((d) => d.series === series);
  if (idx === -1) return false;
  list.splice(idx, 1);
  return true;
}
