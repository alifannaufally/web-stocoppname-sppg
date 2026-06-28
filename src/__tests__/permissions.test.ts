import { describe, it, expect } from "vitest";
import {
  DEFAULT_PERMISSIONS,
  requirePermission,
  ALL_PERMISSIONS,
} from "@/lib/permissions";

describe("DEFAULT_PERMISSIONS record", () => {
  it("memiliki 4 role yang terdefinisi", () => {
    expect(Object.keys(DEFAULT_PERMISSIONS)).toHaveLength(4);
    expect(DEFAULT_PERMISSIONS).toHaveProperty("ADMIN");
    expect(DEFAULT_PERMISSIONS).toHaveProperty("KEPALA_GUDANG");
    expect(DEFAULT_PERMISSIONS).toHaveProperty("KORLAP");
    expect(DEFAULT_PERMISSIONS).toHaveProperty("AKUNTAN");
  });

  it("setiap role memiliki array permissions", () => {
    for (const role of Object.keys(DEFAULT_PERMISSIONS)) {
      expect(Array.isArray(DEFAULT_PERMISSIONS[role])).toBe(true);
    }
  });
});

describe("ADMIN has all permissions", () => {
  it("memiliki semua permission dari ALL_PERMISSIONS", () => {
    for (const perm of ALL_PERMISSIONS) {
      expect(requirePermission("ADMIN", perm)).toBe(true);
    }
  });

  it("memiliki multiple permissions sekaligus", () => {
    expect(
      requirePermission("ADMIN", [
        "input_opname",
        "view_laporan",
        "manage_komoditas",
        "manage_users",
        "manage_roles",
        "manage_settings",
      ]),
    ).toBe(true);
  });
});

describe("AKUNTAN hanya memiliki view_laporan", () => {
  it("hanya memiliki view_laporan", () => {
    expect(requirePermission("AKUNTAN", "view_laporan")).toBe(true);
  });

  it("tidak memiliki permission lainnya", () => {
    const nonLaporanPerms = ALL_PERMISSIONS.filter(
      (p) => p !== "view_laporan",
    );
    for (const perm of nonLaporanPerms) {
      expect(requirePermission("AKUNTAN", perm)).toBe(false);
    }
  });
});

describe("requirePermission with fallback to defaults", () => {
  it("menggunakan DEFAULT_PERMISSIONS saat tidak ada custom map", () => {
    expect(requirePermission("ADMIN", "manage_roles")).toBe(true);
    expect(requirePermission("KORLAP", "input_opname")).toBe(true);
  });

  it("mengembalikan false untuk role yang tidak dikenal", () => {
    expect(requirePermission("NONEXISTENT", "view_laporan")).toBe(false);
  });

  it("menerima custom permission map dan menggunakannya", () => {
    const customMap: Record<string, string[]> = {
      CUSTOM_ROLE: ["input_opname", "view_laporan"],
    };
    expect(requirePermission("CUSTOM_ROLE", "input_opname", customMap)).toBe(
      true,
    );
    expect(requirePermission("CUSTOM_ROLE", "manage_users", customMap)).toBe(
      false,
    );
  });

  it("fallback ke DEFAULT_PERMISSIONS jika role tidak ada di custom map", () => {
    const customMap: Record<string, string[]> = {
      CUSTOM_ROLE: ["input_opname"],
    };
    expect(requirePermission("ADMIN", "manage_settings", customMap)).toBe(true);
  });
});
