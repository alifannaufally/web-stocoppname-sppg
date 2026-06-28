# Sistem Stock Opname — Gudang Basah (SCB)

Aplikasi pencatatan stok harian & opname fisik untuk gudang basah, dengan rekap per periode (2 minggu). Dibangun dengan stack gratis, deploy ke Vercel, database & storage di Supabase.

> **Untuk AI/agent (OpenCode):** Baca seluruh README ini dulu sebelum menulis kode. Kerjakan per fase sesuai urutan di bagian [Roadmap Implementasi](#roadmap-implementasi). Jangan skip fase. Patuhi skema database dan kontrak API persis seperti yang didefinisikan.

---

## 1. Ringkasan Produk

Sistem menggantikan spreadsheet "STOCK GUDANG NEW". Tiga peran:

| Role | Bisa Input | Lihat Laporan | Manajemen User |
|------|:---------:|:-------------:|:--------------:|
| **Kepala Gudang** | ✅ | ✅ | ❌ |
| **Korlap** | ✅ | ✅ | ❌ |
| **Akuntan** | ❌ | ✅ | ❌ |
| **Admin** (opsional) | ✅ | ✅ | ✅ |

**Aturan bisnis inti:**
- Semua role operasional (Korlap, Kepala Gudang) bisa input. Akuntan **read-only** untuk laporan.
- Input harian per komoditas mencatat: **Masuk**, **Keluar**, dan **Stok Fisik** (hasil hitung aktual).
- **Stok Sistem** dihitung otomatis: `stok_awal_hari + masuk − keluar`.
  - `stok_awal_hari` = stok fisik hari kerja sebelumnya (atau stok awal master untuk hari pertama periode).
- **Selisih** = `stok_fisik − stok_sistem`. Jika ≠ 0, item ditandai berselisih.
- Laporan tersedia dalam **2 mode**: per hari, dan per periode (akumulasi 2 minggu / 12 hari kerja).

---

## 2. Tech Stack

| Layer | Teknologi | Catatan |
|-------|-----------|---------|
| Framework | **Next.js 14+ (App Router)** | React Server Components + Route Handlers |
| Bahasa | **TypeScript** (strict) | |
| Database | **PostgreSQL** via **Supabase** | Free tier |
| ORM | **Prisma** | Migrasi & type-safe query |
| Auth | **Supabase Auth** | Email/password, role disimpan di tabel `User` |
| Storage | **Supabase Storage** | Untuk ekspor file / lampiran (opsional) |
| Styling | **Tailwind CSS** + **shadcn/ui** | |
| Charts | **Recharts** | |
| Validasi | **Zod** | Validasi input API |
| Deploy | **Vercel** | Free tier |

**Brand SCB:** Primary Gold `#F3C623`, Navy `#092F54`, font **Plus Jakarta Sans**.

---

## 3. Prasyarat Akun (semua gratis)

1. **Supabase** — buat project baru, catat `Project URL`, `anon key`, `service_role key`, dan `Database connection string` (mode **Session pooler** untuk runtime, **Direct** untuk migrasi).
2. **Vercel** — connect ke repo GitHub.
3. **GitHub** — repo untuk source code.

---

## 4. Struktur Project

```
stock-opname/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              # sidebar + role guard
│   │   │   ├── page.tsx                # Dashboard
│   │   │   ├── input/page.tsx          # Input Harian (Korlap, Kepala Gudang)
│   │   │   ├── laporan/page.tsx        # Laporan harian + periode
│   │   │   └── pengguna/page.tsx       # Manajemen Role (Admin)
│   │   ├── api/
│   │   │   ├── items/route.ts          # GET, POST komoditas
│   │   │   ├── opname/route.ts         # GET, POST entri harian
│   │   │   ├── laporan/
│   │   │   │   ├── harian/route.ts
│   │   │   │   └── periode/route.ts
│   │   │   └── users/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                         # shadcn
│   │   ├── sidebar.tsx
│   │   ├── role-badge.tsx
│   │   ├── stat-card.tsx
│   │   └── data-table.tsx
│   ├── lib/
│   │   ├── prisma.ts                   # singleton Prisma client
│   │   ├── supabase/
│   │   │   ├── client.ts               # browser client
│   │   │   └── server.ts               # server client
│   │   ├── auth.ts                     # getSession, requireRole
│   │   ├── calc.ts                     # logika stok sistem & selisih
│   │   └── validators.ts               # schema Zod
│   └── types/index.ts
├── .env.local
├── .env.example
└── README.md
```

---

## 5. Skema Database (Prisma)

`prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")        // Session pooler (runtime)
  directUrl = env("DIRECT_URL")          // Direct (migrasi)
}

enum Role {
  AKUNTAN
  KORLAP
  KEPALA_GUDANG
  ADMIN
}

model User {
  id        String   @id @default(uuid())  // samakan dengan Supabase auth.users.id
  email     String   @unique
  nama      String
  role      Role     @default(KORLAP)
  createdAt DateTime @default(now())
  entries   OpnameEntry[]
}

model Item {
  id        String   @id @default(uuid())
  no        Int      @unique          // nomor urut dari spreadsheet
  nama      String
  satuan    String                    // Kg, Pcs, Papan, Pack, Ikat, dll
  stokAwal  Float    @default(0)      // stok awal master
  aktif     Boolean  @default(true)
  createdAt DateTime @default(now())
  entries   OpnameEntry[]

  @@index([nama])
}

// Satu baris = stok satu komoditas pada satu tanggal
model OpnameEntry {
  id         String   @id @default(uuid())
  itemId     String
  item       Item     @relation(fields: [itemId], references: [id])
  tanggal    DateTime @db.Date
  masuk      Float    @default(0)
  keluar     Float    @default(0)
  stokFisik  Float    @default(0)      // hasil opname aktual
  // Field turunan disimpan untuk audit & kecepatan laporan:
  stokSistem Float    @default(0)      // stokAwalHari + masuk - keluar
  selisih    Float    @default(0)      // stokFisik - stokSistem
  catatan    String?
  diinputOleh String
  user       User     @relation(fields: [diinputOleh], references: [id])
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([itemId, tanggal])          // 1 entri per item per hari
  @@index([tanggal])
}
```

**Catatan desain:**
- `stokSistem` & `selisih` disimpan (denormalisasi) supaya laporan periode cepat dan ada jejak audit. Hitung di server saat simpan, jangan percaya nilai dari client.
- Hari pertama periode: `stokAwalHari` = `Item.stokAwal`. Hari berikutnya: ambil `stokFisik` dari `OpnameEntry` tanggal kerja sebelumnya untuk item yang sama.

---

## 6. Logika Perhitungan

`src/lib/calc.ts`:

```ts
// Stok sistem hari ini
export function hitungStokSistem(
  stokAwalHari: number,
  masuk: number,
  keluar: number
): number {
  return stokAwalHari + masuk - keluar;
}

// Selisih opname
export function hitungSelisih(stokFisik: number, stokSistem: number): number {
  return stokFisik - stokSistem;
}
```

**Saat menyimpan entri (server-side):**
1. Cari entri tanggal kerja sebelumnya untuk item tsb → ambil `stokFisik` sebagai `stokAwalHari`. Jika tidak ada, pakai `Item.stokAwal`.
2. `stokSistem = stokAwalHari + masuk - keluar`.
3. `selisih = stokFisik - stokSistem`.
4. Upsert berdasarkan `(itemId, tanggal)`.

---

## 7. Kontrak API

Semua route di bawah `/api`. Format response: `{ data, error }`.

### `GET /api/items`
Daftar komoditas aktif. Query opsional: `?q=` (cari nama).

### `POST /api/items` *(Korlap, Kepala Gudang, Admin)*
Body: `{ no, nama, satuan, stokAwal }`.

### `GET /api/opname?tanggal=YYYY-MM-DD`
Entri opname satu hari, di-join dengan item. Untuk halaman Input Harian. Sertakan `stokAwalHari` terhitung per item.

### `POST /api/opname` *(Korlap, Kepala Gudang, Admin — TOLAK Akuntan)*
Body: `{ tanggal, entries: [{ itemId, masuk, keluar, stokFisik, catatan? }] }`.
Server menghitung `stokSistem` & `selisih`, lalu upsert. Simpan `diinputOleh` dari session.

### `GET /api/laporan/harian?tanggal=YYYY-MM-DD`
Tabel per komoditas: masuk, keluar, stok sistem, stok fisik, selisih.

### `GET /api/laporan/periode?dari=YYYY-MM-DD&sampai=YYYY-MM-DD`
Rekap akumulasi per komoditas: stok awal, total masuk, total keluar, stok akhir (stok fisik terakhir di rentang), total selisih.

### `GET /api/users` & `POST /api/users` *(Admin)*
Manajemen pengguna & role.

**Validasi:** semua body divalidasi dengan Zod (`src/lib/validators.ts`). Angka tidak boleh negatif.

---

## 8. Otorisasi (Role Guard)

`src/lib/auth.ts`:

```ts
// Ambil session Supabase + role dari tabel User
export async function getCurrentUser() { /* ... */ }

// Lempar 403 jika role tidak diizinkan
export async function requireRole(allowed: Role[]) {
  const user = await getCurrentUser();
  if (!user || !allowed.includes(user.role)) {
    throw new Response("Forbidden", { status: 403 });
  }
  return user;
}
```

**Aturan:**
- Route `POST /api/opname` & `/api/items` → tolak `AKUNTAN`.
- Halaman `/input` → redirect Akuntan ke `/laporan`.
- Halaman `/pengguna` → hanya `ADMIN`.
- Selalu cek role di **server** (jangan andalkan hide UI saja).

---

## 9. Halaman & Fitur

| Halaman | Isi |
|---------|-----|
| **Dashboard** (`/`) | Stat card (total item, total masuk periode, item berselisih, total selisih abs). Bar chart barang masuk per komoditas. Panel sorotan selisih. |
| **Input Harian** (`/input`) | Pilih tanggal. Tabel input Masuk/Keluar/Stok Fisik per komoditas. Stok Sistem & Selisih live-calculated di UI; final dihitung ulang di server saat simpan. Tombol "Simpan Opname Hari Ini". |
| **Laporan** (`/laporan`) | Toggle: **Per Periode (2 minggu)** & **Per Hari**. Tombol Ekspor (CSV dulu; PDF opsional). |
| **Manajemen Role** (`/pengguna`) | Kartu hak akses per role + tabel pengguna + tambah/edit role. |

UI mengikuti mockup React yang sudah dibuat (brand SCB, sidebar navy, aksen gold).

---

## 10. Environment Variables

`.env.example`:

```bash
# Database (Supabase → Project Settings → Database)
DATABASE_URL="postgresql://...pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...supabase.com:5432/postgres"

# Supabase (Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."   # server only, jangan expose
```

> Di Vercel: tambahkan semua variabel ini di **Project Settings → Environment Variables**.

---

## 11. Setup Lokal

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Jalankan migrasi ke Supabase
npx prisma migrate dev --name init

# 4. Seed data komoditas (dari spreadsheet)
npx prisma db seed

# 5. Jalankan dev server
npm run dev
```

**`package.json` (bagian penting):**
```json
{
  "prisma": { "seed": "tsx prisma/seed.ts" },
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

> **Penting Vercel:** script `build` harus jalankan `prisma generate` dulu, jika tidak build gagal.

---

## 12. Seed Data

`prisma/seed.ts` mengisi komoditas dari spreadsheet. Contoh sebagian (lengkapi semua 90+ item):

```ts
const items = [
  { no: 1, nama: "Sawi Hijau", satuan: "Kg", stokAwal: 0 },
  { no: 2, nama: "Cabe Merah", satuan: "Kg", stokAwal: 0 },
  { no: 3, nama: "Tomat", satuan: "Kg", stokAwal: 0 },
  { no: 4, nama: "Bawang Putih Kupas", satuan: "Kg", stokAwal: 0 },
  { no: 13, nama: "Bawang Merah Kupas", satuan: "Kg", stokAwal: 10 },
  // ... lanjutkan dari spreadsheet STOCK GUDANG NEW
];
```

---

## 13. Deploy ke Vercel

1. Push repo ke GitHub.
2. Import project di Vercel.
3. Set semua Environment Variables (bagian 10).
4. Build command default (`npm run build`) sudah mencakup `prisma generate`.
5. Deploy. Jalankan migrasi production sekali: `npx prisma migrate deploy` (lewat CI atau lokal yang mengarah ke DB production).

---

## 14. Roadmap Implementasi

Kerjakan berurutan:

- [ ] **Fase 0 — Setup.** Init Next.js + TS + Tailwind + shadcn. Konfigurasi Prisma & koneksi Supabase. Migrasi `init`.
- [ ] **Fase 1 — Data layer.** Skema Prisma, seed komoditas, `lib/prisma.ts`, `lib/calc.ts`, `lib/validators.ts`.
- [ ] **Fase 2 — Auth & role.** Supabase Auth, tabel User, `lib/auth.ts`, halaman login, role guard.
- [ ] **Fase 3 — API.** Route handlers (items, opname, laporan harian/periode, users) + validasi Zod.
- [ ] **Fase 4 — UI.** Sidebar + layout, Dashboard, Input Harian, Laporan (2 mode), Manajemen Role. Ikuti mockup.
- [ ] **Fase 5 — Ekspor.** Ekspor CSV laporan periode & harian. (PDF opsional.)
- [ ] **Fase 6 — Deploy.** Vercel + env + migrate deploy. Smoke test tiap role.

---

## 15. Definition of Done

- Akuntan tidak bisa akses `/input` dan `POST /api/opname` (terbukti 403/redirect).
- Stok sistem & selisih dihitung di server, konsisten antar hari (stok fisik kemarin → stok awal hari ini).
- Laporan periode menjumlahkan dengan benar dari entri harian.
- Deploy hidup di Vercel dengan DB Supabase, semua dalam free tier.
