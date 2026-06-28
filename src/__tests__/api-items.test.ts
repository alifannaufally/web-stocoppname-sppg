import { describe, it, expect } from "vitest";
import { createItemSchema, updateItemSchema } from "@/lib/validators";

describe("createItemSchema", () => {
  it("menerima input item yang valid", () => {
    const result = createItemSchema.safeParse({
      no: 1,
      nama: "Beras",
      satuan: "Kg",
    });
    expect(result.success).toBe(true);
  });

  it("menerima input dengan stokAwal opsional", () => {
    const result = createItemSchema.safeParse({
      no: 2,
      nama: "Gula",
      satuan: "Kg",
      stokAwal: 50,
    });
    expect(result.success).toBe(true);
    expect(result.data?.stokAwal).toBe(50);
  });

  it("menggunakan default stokAwal = 0 jika tidak disediakan", () => {
    const result = createItemSchema.safeParse({
      no: 1,
      nama: "Beras",
      satuan: "Kg",
    });
    expect(result.success).toBe(true);
    expect(result.data?.stokAwal).toBe(0);
  });

  it("menolak no negatif", () => {
    const result = createItemSchema.safeParse({
      no: -1,
      nama: "Beras",
      satuan: "Kg",
    });
    expect(result.success).toBe(false);
  });

  it("menolak no 0 (harus positif)", () => {
    const result = createItemSchema.safeParse({
      no: 0,
      nama: "Beras",
      satuan: "Kg",
    });
    expect(result.success).toBe(false);
  });

  it("menolak no non-integer", () => {
    const result = createItemSchema.safeParse({
      no: 1.5,
      nama: "Beras",
      satuan: "Kg",
    });
    expect(result.success).toBe(false);
  });

  it("menolak nama kosong", () => {
    const result = createItemSchema.safeParse({
      no: 1,
      nama: "",
      satuan: "Kg",
    });
    expect(result.success).toBe(false);
  });

  it("menolak nama tidak disertakan", () => {
    const result = createItemSchema.safeParse({
      no: 1,
      satuan: "Kg",
    });
    expect(result.success).toBe(false);
  });

  it("menolak satuan kosong", () => {
    const result = createItemSchema.safeParse({
      no: 1,
      nama: "Beras",
      satuan: "",
    });
    expect(result.success).toBe(false);
  });

  it("menolak stokAwal negatif", () => {
    const result = createItemSchema.safeParse({
      no: 1,
      nama: "Beras",
      satuan: "Kg",
      stokAwal: -10,
    });
    expect(result.success).toBe(false);
  });

  it("menerima stokAwal = 0", () => {
    const result = createItemSchema.safeParse({
      no: 1,
      nama: "Beras",
      satuan: "Kg",
      stokAwal: 0,
    });
    expect(result.success).toBe(true);
  });
});

describe("createItemSchema - error messages", () => {
  it("memberi pesan error 'Nomor harus positif' untuk no <= 0", () => {
    const result = createItemSchema.safeParse({
      no: 0,
      nama: "Beras",
      satuan: "Kg",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.issues.find((i) => i.path[0] === "no")?.message;
      expect(msg).toBe("Nomor harus positif");
    }
  });

  it("memberi pesan error 'Nama harus diisi' untuk nama kosong", () => {
    const result = createItemSchema.safeParse({
      no: 1,
      nama: "",
      satuan: "Kg",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.issues.find((i) => i.path[0] === "nama")?.message;
      expect(msg).toBe("Nama harus diisi");
    }
  });

  it("memberi pesan error 'Satuan harus diisi' untuk satuan kosong", () => {
    const result = createItemSchema.safeParse({
      no: 1,
      nama: "Beras",
      satuan: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.issues.find((i) => i.path[0] === "satuan")?.message;
      expect(msg).toBe("Satuan harus diisi");
    }
  });

  it("memberi pesan error 'Stok awal tidak boleh negatif' untuk stokAwal negatif", () => {
    const result = createItemSchema.safeParse({
      no: 1,
      nama: "Beras",
      satuan: "Kg",
      stokAwal: -5,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.issues.find((i) => i.path[0] === "stokAwal")?.message;
      expect(msg).toBe("Stok awal tidak boleh negatif");
    }
  });
});

describe("updateItemSchema", () => {
  it("menerima input update yang valid dengan semua field", () => {
    const result = updateItemSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      no: 1,
      nama: "Beras",
      satuan: "Kg",
      stokAwal: 100,
      aktif: true,
    });
    expect(result.success).toBe(true);
  });

  it("menerima update dengan field minimal (id saja)", () => {
    const result = updateItemSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("menolak id yang bukan UUID", () => {
    const result = updateItemSchema.safeParse({
      id: "not-a-uuid",
      nama: "Beras",
    });
    expect(result.success).toBe(false);
  });

  it("menolak update tanpa id", () => {
    const result = updateItemSchema.safeParse({
      nama: "Beras",
    });
    expect(result.success).toBe(false);
  });

  it("menolak stokAwal negatif pada update", () => {
    const result = updateItemSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      stokAwal: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe("data transformation", () => {
  it("mengubah string stokAwal menjadi number via Number()", () => {
    const rawStokAwal = "50";
    expect(Number(rawStokAwal || 0)).toBe(50);
  });

  it("mengubah undefined stokAwal menjadi 0 via Number()", () => {
    expect(Number(undefined || 0)).toBe(0);
  });

  it("mengubah string 'true' menjadi boolean true via Boolean()", () => {
    expect(Boolean("true")).toBe(true);
  });

  it("mengubah undefined aktif menjadi false via Boolean()", () => {
    expect(Boolean(undefined)).toBe(false);
  });

  it("normalisasi no via Number()", () => {
    expect(Number("1")).toBe(1);
    expect(Number("0")).toBe(0);
  });

  it("mengubah jenis ke tipe union BASAH | KERING", () => {
    const jenis: "BASAH" | "KERING" = "BASAH";
    expect(["BASAH", "KERING"]).toContain(jenis);
  });
});
