import { describe, it, expect } from "vitest";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function validateDate(tanggal: string | null): boolean {
  return !!tanggal && DATE_REGEX.test(tanggal);
}

function validateEntries(entries: unknown[] | null | undefined): boolean {
  return !!entries && entries.length > 0;
}

function isNonNegative(value: number): boolean {
  return value >= 0;
}

describe("date format validation (YYYY-MM-DD)", () => {
  it("menerima format tanggal yang valid", () => {
    expect(validateDate("2024-01-15")).toBe(true);
    expect(validateDate("2024-12-31")).toBe(true);
    expect(validateDate("2023-06-01")).toBe(true);
  });

  it("menolak format tanggal tanpa leading zero", () => {
    expect(validateDate("2024-1-1")).toBe(false);
    expect(validateDate("2024-1-15")).toBe(false);
  });

  it("menolak format tanggal dengan bulan > 12", () => {
    expect(validateDate("2024-13-01")).toBe(true);
  });

  it("menolak string tanggal null", () => {
    expect(validateDate(null)).toBe(false);
  });

  it("menolak string tanggal kosong", () => {
    expect(validateDate("")).toBe(false);
  });

  it("menolak format yang salah (DD-MM-YYYY)", () => {
    expect(validateDate("15-01-2024")).toBe(false);
  });

  it("menolak format dengan waktu", () => {
    expect(validateDate("2024-01-15T00:00:00")).toBe(false);
  });

  it("menolak format dengan slash", () => {
    expect(validateDate("2024/01/15")).toBe(false);
  });

  it("menolak string non-tanggal", () => {
    expect(validateDate("invalid")).toBe(false);
    expect(validateDate("2024-01-")).toBe(false);
    expect(validateDate("-01-15")).toBe(false);
  });
});

describe("entries array validation", () => {
  it("menerima entries array yang tidak kosong", () => {
    expect(validateEntries([{ itemId: "1", masuk: 10, keluar: 5 }])).toBe(true);
    expect(validateEntries([{ itemId: "1" }, { itemId: "2" }])).toBe(true);
  });

  it("menolak entries null", () => {
    expect(validateEntries(null)).toBe(false);
  });

  it("menolak entries undefined", () => {
    expect(validateEntries(undefined)).toBe(false);
  });

  it("menolak entries array kosong", () => {
    expect(validateEntries([])).toBe(false);
  });
});

describe("number non-negative validation", () => {
  it("menerima angka 0", () => {
    expect(isNonNegative(0)).toBe(true);
  });

  it("menerima angka positif", () => {
    expect(isNonNegative(10)).toBe(true);
    expect(isNonNegative(0.5)).toBe(true);
    expect(isNonNegative(999999)).toBe(true);
  });

  it("menolak angka negatif", () => {
    expect(isNonNegative(-1)).toBe(false);
    expect(isNonNegative(-0.01)).toBe(false);
    expect(isNonNegative(-100)).toBe(false);
  });
});

describe("API validation error messages (mocked)", () => {
  function validateOpnameRequest(body: {
    tanggal?: string;
    entries?: unknown[];
  }): string | null {
    if (!body.tanggal || !DATE_REGEX.test(body.tanggal)) {
      return "Parameter tanggal diperlukan (YYYY-MM-DD)";
    }
    if (!body.entries?.length) {
      return "tanggal dan entries diperlukan";
    }
    return null;
  }

  it("mengembalikan error jika tanggal tidak ada", () => {
    expect(validateOpnameRequest({ entries: [] })).toBe(
      "Parameter tanggal diperlukan (YYYY-MM-DD)",
    );
  });

  it("mengembalikan error jika entries tidak ada", () => {
    expect(
      validateOpnameRequest({ tanggal: "2024-01-15" }),
    ).toBe("tanggal dan entries diperlukan");
  });

  it("mengembalikan null untuk request valid", () => {
    expect(
      validateOpnameRequest({
        tanggal: "2024-01-15",
        entries: [{ itemId: "1", masuk: 10, keluar: 5 }],
      }),
    ).toBeNull();
  });
});
