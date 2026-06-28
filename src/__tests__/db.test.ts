import { describe, it, expect } from "vitest";
import { hitungStokSistem, hitungSelisih } from "@/lib/calc";
import {
  hasPermission,
  DEFAULT_PERMISSIONS,
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
  PERMISSION_DESCRIPTIONS,
} from "@/lib/permissions";

describe("hitungStokSistem", () => {
  it("menghitung stok sistem dengan benar (stok awal + masuk - keluar)", () => {
    expect(hitungStokSistem(100, 20, 10)).toBe(110);
  });

  it("mengembalikan 0 jika semua nilai 0", () => {
    expect(hitungStokSistem(0, 0, 0)).toBe(0);
  });

  it("menangani keluar lebih besar dari stok awal + masuk (stok negatif)", () => {
    expect(hitungStokSistem(10, 5, 20)).toBe(-5);
  });

  it("menolak stok awal negatif", () => {
    expect(() => hitungStokSistem(-1, 10, 5)).toThrow("Stok awal tidak boleh negatif");
  });

  it("menolak masuk negatif", () => {
    expect(() => hitungStokSistem(10, -1, 5)).toThrow("Masuk tidak boleh negatif");
  });

  it("menolak keluar negatif", () => {
    expect(() => hitungStokSistem(10, 5, -1)).toThrow("Keluar tidak boleh negatif");
  });

  it("bekerja dengan angka desimal", () => {
    expect(hitungStokSistem(10.5, 2.5, 1.5)).toBe(11.5);
  });

  it("bekerja dengan angka besar", () => {
    expect(hitungStokSistem(999999, 1, 0)).toBe(1000000);
  });
});

describe("hitungSelisih", () => {
  it("menghitung selisih positif (stok fisik > stok sistem)", () => {
    expect(hitungSelisih(120, 100)).toBe(20);
  });

  it("menghitung selisih negatif (stok fisik < stok sistem)", () => {
    expect(hitungSelisih(80, 100)).toBe(-20);
  });

  it("mengembalikan 0 jika stok fisik sama dengan stok sistem", () => {
    expect(hitungSelisih(100, 100)).toBe(0);
  });

  it("bekerja dengan angka 0", () => {
    expect(hitungSelisih(0, 0)).toBe(0);
    expect(hitungSelisih(10, 0)).toBe(10);
    expect(hitungSelisih(0, 10)).toBe(-10);
  });
});

describe("hasPermission", () => {
  it("mengembalikan true jika role memiliki permission", () => {
    expect(hasPermission("ADMIN", "input_opname")).toBe(true);
    expect(hasPermission("KORLAP", "view_laporan")).toBe(true);
    expect(hasPermission("AKUNTAN", "view_laporan")).toBe(true);
  });

  it("mengembalikan false jika role tidak memiliki permission", () => {
    expect(hasPermission("AKUNTAN", "input_opname")).toBe(false);
    expect(hasPermission("KEPALA_GUDANG", "manage_users")).toBe(false);
  });

  it("memeriksa multiple permissions (semua harus dimiliki)", () => {
    expect(hasPermission("ADMIN", ["input_opname", "manage_users"])).toBe(true);
    expect(hasPermission("KORLAP", ["input_opname", "view_laporan"])).toBe(true);
    expect(hasPermission("KORLAP", ["input_opname", "manage_users"])).toBe(false);
  });

  it("menggunakan permission map kustom jika diberikan", () => {
    const customMap: Record<string, string[]> = {
      CUSTOM: ["input_opname"],
    };
    expect(hasPermission("CUSTOM", "input_opname", customMap)).toBe(true);
    expect(hasPermission("CUSTOM", "view_laporan", customMap)).toBe(false);
  });

  it("fallback ke DEFAULT_PERMISSIONS jika role tidak ada di custom map", () => {
    expect(hasPermission("ADMIN", "manage_roles", {})).toBe(true);
  });

  it("mengembalikan false untuk role yang tidak dikenal", () => {
    expect(hasPermission("UNKNOWN", "view_laporan")).toBe(false);
  });
});

describe("DEFAULT_PERMISSIONS", () => {
  it("memiliki 4 role yang diharapkan", () => {
    expect(Object.keys(DEFAULT_PERMISSIONS)).toEqual([
      "ADMIN",
      "KEPALA_GUDANG",
      "KORLAP",
      "AKUNTAN",
    ]);
  });

  it("ADMIN memiliki semua permissions", () => {
    for (const perm of ALL_PERMISSIONS) {
      expect(DEFAULT_PERMISSIONS.ADMIN).toContain(perm);
    }
  });

  it("KEPALA_GUDANG memiliki input_opname, view_laporan, manage_komoditas", () => {
    expect(DEFAULT_PERMISSIONS.KEPALA_GUDANG).toEqual([
      "input_opname",
      "view_laporan",
      "manage_komoditas",
    ]);
  });

  it("KORLAP memiliki input_opname, view_laporan, manage_komoditas", () => {
    expect(DEFAULT_PERMISSIONS.KORLAP).toEqual([
      "input_opname",
      "view_laporan",
      "manage_komoditas",
    ]);
  });

  it("AKUNTAN hanya memiliki view_laporan", () => {
    expect(DEFAULT_PERMISSIONS.AKUNTAN).toEqual(["view_laporan"]);
  });
});

describe("PERMISSION_LABELS dan PERMISSION_DESCRIPTIONS", () => {
  it("PERMISSION_LABELS memiliki entri untuk semua ALL_PERMISSIONS", () => {
    for (const perm of ALL_PERMISSIONS) {
      expect(PERMISSION_LABELS).toHaveProperty(perm);
      expect(typeof PERMISSION_LABELS[perm]).toBe("string");
      expect(PERMISSION_LABELS[perm].length).toBeGreaterThan(0);
    }
  });

  it("PERMISSION_DESCRIPTIONS memiliki entri untuk semua ALL_PERMISSIONS", () => {
    for (const perm of ALL_PERMISSIONS) {
      expect(PERMISSION_DESCRIPTIONS).toHaveProperty(perm);
      expect(typeof PERMISSION_DESCRIPTIONS[perm]).toBe("string");
      expect(PERMISSION_DESCRIPTIONS[perm].length).toBeGreaterThan(0);
    }
  });

  it("jumlah PERMISSION_LABELS sama dengan jumlah ALL_PERMISSIONS", () => {
    expect(Object.keys(PERMISSION_LABELS).length).toBe(ALL_PERMISSIONS.length);
  });

  it("jumlah PERMISSION_DESCRIPTIONS sama dengan jumlah ALL_PERMISSIONS", () => {
    expect(Object.keys(PERMISSION_DESCRIPTIONS).length).toBe(ALL_PERMISSIONS.length);
  });
});
