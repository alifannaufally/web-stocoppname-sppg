export type Permission =
  | "input_opname"
  | "view_laporan"
  | "manage_komoditas"
  | "manage_users"
  | "manage_roles"
  | "manage_settings";

export const ALL_PERMISSIONS: Permission[] = [
  "input_opname",
  "view_laporan",
  "manage_komoditas",
  "manage_users",
  "manage_roles",
  "manage_settings",
];

export const PERMISSION_LABELS: Record<Permission, string> = {
  input_opname: "Input Opname",
  view_laporan: "Lihat Laporan",
  manage_komoditas: "Kelola Komoditas",
  manage_users: "Kelola Pengguna",
  manage_roles: "Kelola Role & Hak Akses",
  manage_settings: "Pengaturan Sistem",
};

export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  input_opname: "Mengisi & menyimpan data opname harian",
  view_laporan: "Melihat laporan harian & periode",
  manage_komoditas: "Tambah, edit, hapus komoditas",
  manage_users: "Tambah, edit, hapus pengguna",
  manage_roles: "Mengatur hak akses setiap role",
  manage_settings: "Mengubah pengaturan sistem",
};

export const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ALL_PERMISSIONS,
  KEPALA_GUDANG: ["input_opname", "view_laporan", "manage_komoditas"],
  KORLAP: ["input_opname", "view_laporan", "manage_komoditas"],
  AKUNTAN: ["view_laporan"],
};

export function hasPermission(
  role: string,
  required: string | string[],
  rolePermissionsMap?: Record<string, string[]>,
): boolean {
  const perms = rolePermissionsMap?.[role] ?? DEFAULT_PERMISSIONS[role] ?? [];
  const requiredArr = Array.isArray(required) ? required : [required];
  return requiredArr.every((p) => perms.includes(p));
}

export function requirePermission(
  role: string,
  required: string | string[],
  rolePermissionsMap?: Record<string, string[]>,
): boolean {
  return hasPermission(role, required, rolePermissionsMap);
}
