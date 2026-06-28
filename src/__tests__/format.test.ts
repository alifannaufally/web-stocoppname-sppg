import { describe, it, expect } from "vitest";
import { formatDate, formatRoleName, escapeCSV } from "@/lib/format";

describe("formatDate", () => {
  it("mengubah ISO date ke format bahasa Indonesia", () => {
    const result = formatDate("2024-01-15");
    expect(result).toContain("Senin");
    expect(result).toContain("15");
    expect(result).toContain("Januari");
    expect(result).toContain("2024");
  });

  it("menangani tanggal di bulan berbeda", () => {
    const result = formatDate("2024-06-01");
    expect(result).toContain("Sabtu");
    expect(result).toContain("1");
    expect(result).toContain("Juni");
  });

  it("menangani tanggal akhir tahun", () => {
    const result = formatDate("2024-12-31");
    expect(result).toContain("Selasa");
    expect(result).toContain("31");
    expect(result).toContain("Desember");
  });

  it("mengembalikan string asli jika parsing gagal", () => {
    const result = formatDate("invalid-date");
    expect(result).toBe("invalid-date");
  });
});

describe("formatRoleName", () => {
  it("mengganti underscore dengan spasi untuk KEPALA_GUDANG", () => {
    expect(formatRoleName("KEPALA_GUDANG")).toBe("KEPALA GUDANG");
  });

  it("tidak mengubah role tanpa underscore", () => {
    expect(formatRoleName("ADMIN")).toBe("ADMIN");
    expect(formatRoleName("AKUNTAN")).toBe("AKUNTAN");
    expect(formatRoleName("KORLAP")).toBe("KORLAP");
  });

  it("menangani string kosong", () => {
    expect(formatRoleName("")).toBe("");
  });

  it("menangani multiple underscore", () => {
    expect(formatRoleName("A_B_C_D")).toBe("A B C D");
  });
});

describe("escapeCSV", () => {
  it("tidak mengubah nilai sederhana tanpa karakter khusus", () => {
    expect(escapeCSV("Beras")).toBe("Beras");
    expect(escapeCSV("123")).toBe("123");
    expect(escapeCSV("hello world")).toBe("hello world");
  });

  it("membungkus nilai dengan koma dalam tanda kutip", () => {
    expect(escapeCSV("Beras, Gula")).toBe('"Beras, Gula"');
  });

  it("membungkus nilai dengan tanda kutip dan menggandakan kutip di dalamnya", () => {
    expect(escapeCSV('Beras "Premium"')).toBe('"Beras ""Premium"""');
  });

  it("membungkus nilai dengan newline dalam tanda kutip", () => {
    expect(escapeCSV("Baris 1\nBaris 2")).toBe('"Baris 1\nBaris 2"');
  });

  it("menangani nilai yang sudah memiliki escape ganda", () => {
    expect(escapeCSV('"')).toBe('""""');
  });

  it("menangani kombinasi karakter khusus", () => {
    expect(escapeCSV('Gula, "Pasir"\nGrade A')).toBe(
      '"Gula, ""Pasir""\nGrade A"',
    );
  });
});
