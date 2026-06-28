import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const createUserSchema = z.object({
  email: z.string().email("Email tidak valid"),
  nama: z.string().min(1, "Nama harus diisi"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.string(),
});

export const updateUserRoleSchema = z.object({
  role: z.string(),
});

export const createItemSchema = z.object({
  no: z.number().int().positive("Nomor harus positif"),
  nama: z.string().min(1, "Nama harus diisi"),
  satuan: z.string().min(1, "Satuan harus diisi"),
  stokAwal: z.number().min(0, "Stok awal tidak boleh negatif").default(0),
});

export const updateItemSchema = z.object({
  id: z.string().uuid(),
  no: z.number().int().positive("Nomor harus positif").optional(),
  nama: z.string().min(1, "Nama harus diisi").optional(),
  satuan: z.string().min(1, "Satuan harus diisi").optional(),
  stokAwal: z.number().min(0, "Stok awal tidak boleh negatif").optional(),
  aktif: z.boolean().optional(),
});
