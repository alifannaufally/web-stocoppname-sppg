import { Client } from "pg";

const SQL = String.raw;

const client = new Client({
  connectionString: "postgresql://postgres.wcpbuhaeqjiaylubtcpn:Pampam201201%40@aws-1-ap-south-1.pooler.supabase.com:5432/postgres",
});

await client.connect();

// Drop in reverse dependency order
await client.query(SQL`DROP TABLE IF EXISTS "OpnameEntry" CASCADE`);
await client.query(SQL`DROP TABLE IF EXISTS "RolePermission" CASCADE`);
await client.query(SQL`DROP TABLE IF EXISTS "Item" CASCADE`);
await client.query(SQL`DROP TABLE IF EXISTS "User" CASCADE`);
await client.query(SQL`DROP TYPE IF EXISTS "Jenis" CASCADE`);
await client.query(SQL`DROP TYPE IF EXISTS "Role" CASCADE`);
console.log("Tables dropped");

// Create enums
await client.query(SQL`CREATE TYPE "Jenis" AS ENUM ('BASAH', 'KERING')`);
await client.query(SQL`CREATE TYPE "Role" AS ENUM ('AKUNTAN', 'KORLAP', 'KEPALA_GUDANG', 'ADMIN')`);
console.log("Enums created");

// Create tables
await client.query(SQL`
  CREATE TABLE "User" (
    "id" TEXT NOT NULL, "email" TEXT NOT NULL, "nama" TEXT NOT NULL, "password" TEXT,
    "role" "Role" NOT NULL DEFAULT 'KORLAP', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
  )
`);
await client.query(SQL`CREATE UNIQUE INDEX "User_email_key" ON "User"("email")`);

await client.query(SQL`
  CREATE TABLE "Item" (
    "id" TEXT NOT NULL, "no" INTEGER NOT NULL, "nama" TEXT NOT NULL, "satuan" TEXT NOT NULL,
    "jenis" "Jenis" NOT NULL DEFAULT 'BASAH', "stokAwal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aktif" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
  )
`);
await client.query(SQL`CREATE UNIQUE INDEX "Item_no_key" ON "Item"("no")`);
await client.query(SQL`CREATE INDEX "Item_nama_idx" ON "Item"("nama")`);

await client.query(SQL`
  CREATE TABLE "OpnameEntry" (
    "id" TEXT NOT NULL, "itemId" TEXT NOT NULL, "tanggal" DATE NOT NULL,
    "masuk" DOUBLE PRECISION NOT NULL DEFAULT 0, "keluar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stokFisik" DOUBLE PRECISION NOT NULL DEFAULT 0, "catatan" TEXT,
    "diinputOleh" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "OpnameEntry_pkey" PRIMARY KEY ("id")
  )
`);
await client.query(SQL`ALTER TABLE "OpnameEntry" ADD CONSTRAINT "OpnameEntry_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
await client.query(SQL`ALTER TABLE "OpnameEntry" ADD CONSTRAINT "OpnameEntry_diinputOleh_fkey" FOREIGN KEY ("diinputOleh") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
await client.query(SQL`CREATE UNIQUE INDEX "OpnameEntry_itemId_tanggal_key" ON "OpnameEntry"("itemId", "tanggal")`);
await client.query(SQL`CREATE INDEX "OpnameEntry_tanggal_idx" ON "OpnameEntry"("tanggal")`);

await client.query(SQL`
  CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL, "role" TEXT NOT NULL, "permissions" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
  )
`);
await client.query(SQL`CREATE UNIQUE INDEX "RolePermission_role_key" ON "RolePermission"("role")`);

console.log("Schema recreated");
await client.end();
