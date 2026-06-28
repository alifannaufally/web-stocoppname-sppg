import { describe, it, expect } from "vitest";
import { loginSchema, createUserSchema, updateUserRoleSchema } from "@/lib/validators";
import { hitungStokSistem, hitungSelisih } from "@/lib/calc";

describe("loginSchema", () => {
  it("accepts valid login input", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = loginSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("createUserSchema", () => {
  it("accepts valid user creation input", () => {
    const result = createUserSchema.safeParse({
      email: "newuser@example.com",
      nama: "New User",
      password: "password123",
      role: "KORLAP",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid roles", () => {
    for (const role of ["AKUNTAN", "KORLAP", "KEPALA_GUDANG", "ADMIN"]) {
      const result = createUserSchema.safeParse({
        email: "user@example.com",
        nama: "User",
        password: "password123",
        role,
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts any role string", () => {
    const result = createUserSchema.safeParse({
      email: "user@example.com",
      nama: "User",
      password: "password123",
      role: "CUSTOM_ROLE",
    });
    expect(result.success).toBe(true);
    expect(result.data?.role).toBe("CUSTOM_ROLE");
  });

  it("rejects missing nama", () => {
    const result = createUserSchema.safeParse({
      email: "user@example.com",
      password: "password123",
      role: "ADMIN",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateUserRoleSchema", () => {
  it("accepts valid role", () => {
    const result = updateUserRoleSchema.safeParse({ role: "ADMIN" });
    expect(result.success).toBe(true);
  });

  it("accepts any role string", () => {
    const result = updateUserRoleSchema.safeParse({ role: "CEO" });
    expect(result.success).toBe(true);
  });
});

describe("hitungStokSistem", () => {
  it("menghitung stok sistem dengan benar: stokAwal + masuk - keluar", () => {
    expect(hitungStokSistem(100, 20, 10)).toBe(110);
  });

  it("mengembalikan nilai yang sama untuk input nol", () => {
    expect(hitungStokSistem(0, 0, 0)).toBe(0);
  });

  it("menghasilkan nilai negatif jika keluar > stokAwal + masuk", () => {
    expect(hitungStokSistem(10, 5, 20)).toBe(-5);
  });

  it("menolak stokAwal negatif dengan throw error", () => {
    expect(() => hitungStokSistem(-1, 10, 5)).toThrow("Stok awal tidak boleh negatif");
  });

  it("menolak masuk negatif dengan throw error", () => {
    expect(() => hitungStokSistem(10, -1, 5)).toThrow("Masuk tidak boleh negatif");
  });

  it("menolak keluar negatif dengan throw error", () => {
    expect(() => hitungStokSistem(10, 5, -1)).toThrow("Keluar tidak boleh negatif");
  });
});

describe("hitungSelisih", () => {
  it("menghitung selisih positif (stokFisik > stokSistem)", () => {
    expect(hitungSelisih(120, 100)).toBe(20);
  });

  it("menghitung selisih negatif (stokFisik < stokSistem)", () => {
    expect(hitungSelisih(80, 100)).toBe(-20);
  });

  it("mengembalikan 0 jika stokFisik === stokSistem", () => {
    expect(hitungSelisih(100, 100)).toBe(0);
  });
});
