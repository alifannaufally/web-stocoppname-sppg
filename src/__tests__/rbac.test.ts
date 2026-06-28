import { describe, it, expect } from "vitest";
import {
  hasPermission,
  DEFAULT_PERMISSIONS,
  ALL_PERMISSIONS,
} from "@/lib/permissions";

describe("DEFAULT_PERMISSIONS", () => {
  it("ADMIN has all permissions", () => {
    for (const perm of ALL_PERMISSIONS) {
      expect(DEFAULT_PERMISSIONS.ADMIN).toContain(perm);
    }
  });

  it("KEPALA_GUDANG has input_opname, view_laporan, manage_komoditas", () => {
    expect(DEFAULT_PERMISSIONS.KEPALA_GUDANG).toContain("input_opname");
    expect(DEFAULT_PERMISSIONS.KEPALA_GUDANG).toContain("view_laporan");
    expect(DEFAULT_PERMISSIONS.KEPALA_GUDANG).toContain("manage_komoditas");
    expect(DEFAULT_PERMISSIONS.KEPALA_GUDANG).not.toContain("manage_users");
    expect(DEFAULT_PERMISSIONS.KEPALA_GUDANG).not.toContain("manage_roles");
    expect(DEFAULT_PERMISSIONS.KEPALA_GUDANG).not.toContain("manage_settings");
  });

  it("KORLAP has input_opname, view_laporan, manage_komoditas", () => {
    expect(DEFAULT_PERMISSIONS.KORLAP).toContain("input_opname");
    expect(DEFAULT_PERMISSIONS.KORLAP).toContain("view_laporan");
    expect(DEFAULT_PERMISSIONS.KORLAP).toContain("manage_komoditas");
    expect(DEFAULT_PERMISSIONS.KORLAP).not.toContain("manage_users");
    expect(DEFAULT_PERMISSIONS.KORLAP).not.toContain("manage_roles");
    expect(DEFAULT_PERMISSIONS.KORLAP).not.toContain("manage_settings");
  });

  it("AKUNTAN only has view_laporan", () => {
    expect(DEFAULT_PERMISSIONS.AKUNTAN).toContain("view_laporan");
    expect(DEFAULT_PERMISSIONS.AKUNTAN).not.toContain("input_opname");
    expect(DEFAULT_PERMISSIONS.AKUNTAN).not.toContain("manage_komoditas");
    expect(DEFAULT_PERMISSIONS.AKUNTAN).not.toContain("manage_users");
    expect(DEFAULT_PERMISSIONS.AKUNTAN).not.toContain("manage_roles");
    expect(DEFAULT_PERMISSIONS.AKUNTAN).not.toContain("manage_settings");
  });
});

describe("hasPermission", () => {
  const rolePermsMap: Record<string, string[]> = {
    ADMIN: ALL_PERMISSIONS,
    KEPALA_GUDANG: ["input_opname", "view_laporan", "manage_komoditas"],
    KORLAP: ["input_opname", "view_laporan", "manage_komoditas"],
    AKUNTAN: ["view_laporan"],
  };

  it("returns true when role has the permission", () => {
    expect(hasPermission("ADMIN", "input_opname", rolePermsMap)).toBe(true);
    expect(hasPermission("KORLAP", "manage_komoditas", rolePermsMap)).toBe(true);
    expect(hasPermission("AKUNTAN", "view_laporan", rolePermsMap)).toBe(true);
  });

  it("returns false when role lacks the permission", () => {
    expect(hasPermission("AKUNTAN", "input_opname", rolePermsMap)).toBe(false);
    expect(hasPermission("KEPALA_GUDANG", "manage_users", rolePermsMap)).toBe(false);
    expect(hasPermission("KORLAP", "manage_roles", rolePermsMap)).toBe(false);
  });

  it("checks multiple permissions (all required)", () => {
    expect(hasPermission("ADMIN", ["view_laporan", "manage_users"], rolePermsMap)).toBe(true);
    expect(hasPermission("KEPALA_GUDANG", ["input_opname", "view_laporan"], rolePermsMap)).toBe(true);
    expect(hasPermission("KEPALA_GUDANG", ["input_opname", "manage_users"], rolePermsMap)).toBe(false);
  });

  it("falls back to DEFAULT_PERMISSIONS when map is not provided", () => {
    expect(hasPermission("ADMIN", "manage_roles")).toBe(true);
    expect(hasPermission("AKUNTAN", "view_laporan")).toBe(true);
    expect(hasPermission("AKUNTAN", "input_opname")).toBe(false);
  });

  it("falls back to DEFAULT_PERMISSIONS when role is not in map", () => {
    expect(hasPermission("AKUNTAN", "view_laporan", {})).toBe(true);
    expect(hasPermission("AKUNTAN", "input_opname", {})).toBe(false);
  });

  it("returns false for unknown roles", () => {
    expect(hasPermission("UNKNOWN_ROLE", "view_laporan")).toBe(false);
    expect(hasPermission("UNKNOWN_ROLE", "view_laporan", rolePermsMap)).toBe(false);
  });
});

describe("requirePermission logic", () => {
  const rolePermsMap: Record<string, string[]> = {
    ADMIN: ALL_PERMISSIONS,
    KEPALA_GUDANG: ["input_opname", "view_laporan", "manage_komoditas"],
    KORLAP: ["input_opname", "view_laporan", "manage_komoditas"],
    AKUNTAN: ["view_laporan"],
  };

  function requirePermission(role: string, permission: string | string[], rolePermissionsMap?: Record<string, string[]>): boolean {
    return hasPermission(role, permission, rolePermissionsMap);
  }

  it("allows ADMIN to access any permission", () => {
    expect(requirePermission("ADMIN", "manage_users", rolePermsMap)).toBe(true);
    expect(requirePermission("ADMIN", "manage_roles", rolePermsMap)).toBe(true);
    expect(requirePermission("ADMIN", "manage_settings", rolePermsMap)).toBe(true);
  });

  it("allows KEPALA_GUDANG to input opname", () => {
    expect(requirePermission("KEPALA_GUDANG", "input_opname", rolePermsMap)).toBe(true);
  });

  it("allows AKUNTAN to view reports but not manage users", () => {
    expect(requirePermission("AKUNTAN", "view_laporan", rolePermsMap)).toBe(true);
    expect(requirePermission("AKUNTAN", "manage_users", rolePermsMap)).toBe(false);
  });

  it("rejects KEPALA_GUDANG from managing users", () => {
    expect(requirePermission("KEPALA_GUDANG", "manage_users", rolePermsMap)).toBe(false);
  });

  it("rejects KORLAP from managing roles", () => {
    expect(requirePermission("KORLAP", "manage_roles", rolePermsMap)).toBe(false);
  });
});
