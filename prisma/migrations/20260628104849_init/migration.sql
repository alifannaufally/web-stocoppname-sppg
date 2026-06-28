-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Jenis" AS ENUM ('BASAH', 'KERING');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'KORLAP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "no" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "satuan" TEXT NOT NULL,
    "jenis" "Jenis" NOT NULL DEFAULT 'BASAH',
    "stokAwal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permissions" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpnameEntry" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "masuk" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "keluar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stokFisik" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stokSistem" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "selisih" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "catatan" TEXT,
    "diinputOleh" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpnameEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Item_no_key" ON "Item"("no");

-- CreateIndex
CREATE INDEX "Item_nama_idx" ON "Item"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "CustomRole_name_key" ON "CustomRole"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_role_key" ON "RolePermission"("role");

-- CreateIndex
CREATE INDEX "OpnameEntry_tanggal_idx" ON "OpnameEntry"("tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "OpnameEntry_itemId_tanggal_key" ON "OpnameEntry"("itemId", "tanggal");

-- AddForeignKey
ALTER TABLE "OpnameEntry" ADD CONSTRAINT "OpnameEntry_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpnameEntry" ADD CONSTRAINT "OpnameEntry_diinputOleh_fkey" FOREIGN KEY ("diinputOleh") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

