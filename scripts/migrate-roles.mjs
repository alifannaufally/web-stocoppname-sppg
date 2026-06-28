import { Client } from "pg";
const client = new Client({
  connectionString: "postgresql://postgres.wcpbuhaeqjiaylubtcpn:Pampam201201%40@aws-1-ap-south-1.pooler.supabase.com:5432/postgres",
});
await client.connect();

// Drop old RolePermission table
await client.query('DROP TABLE IF EXISTS "RolePermission" CASCADE');

// Change User.role from Role enum to TEXT
await client.query('ALTER TABLE "User" ALTER COLUMN "role" TYPE TEXT');

// Drop the Role enum
await client.query('DROP TYPE IF EXISTS "Role" CASCADE');

// Create CustomRole table
await client.query(
  'CREATE TABLE IF NOT EXISTS "CustomRole" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "CustomRole_pkey" PRIMARY KEY ("id"))'
);
await client.query('CREATE UNIQUE INDEX IF NOT EXISTS "CustomRole_name_key" ON "CustomRole"("name")');

// Recreate RolePermission table
await client.query(
  'CREATE TABLE IF NOT EXISTS "RolePermission" ("id" TEXT NOT NULL, "role" TEXT NOT NULL, "permissions" TEXT NOT NULL DEFAULT \'[]\', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id"))'
);
await client.query('CREATE UNIQUE INDEX IF NOT EXISTS "RolePermission_role_key" ON "RolePermission"("role")');

// Seed default custom roles
const defaultRoles = [
  ["ADMIN", "Administrator sistem"],
  ["KEPALA_GUDANG", "Kepala Gudang"],
  ["KORLAP", "Koordinator Lapangan"],
  ["AKUNTAN", "Akuntan / Keuangan"],
];

for (const [name, desc] of defaultRoles) {
  await client.query(
    'INSERT INTO "CustomRole" (id, name, description, "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, $2, NOW(), NOW()) ON CONFLICT (name) DO NOTHING',
    [name, desc]
  );
}

// Seed default permissions
const defaultPerms = [
  ["ADMIN", JSON.stringify(["input_opname", "view_laporan", "manage_komoditas", "manage_users", "manage_roles", "manage_settings"])],
  ["KEPALA_GUDANG", JSON.stringify(["input_opname", "view_laporan", "manage_komoditas"])],
  ["KORLAP", JSON.stringify(["input_opname", "view_laporan", "manage_komoditas"])],
  ["AKUNTAN", JSON.stringify(["view_laporan"])],
];

for (const [role, perms] of defaultPerms) {
  await client.query(
    'INSERT INTO "RolePermission" (id, role, permissions, "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, $2, NOW(), NOW()) ON CONFLICT (role) DO UPDATE SET permissions = $2, "updatedAt" = NOW()',
    [role, perms]
  );
}

console.log("Migration applied: Role→String, CustomRole, RolePermission seeded");
await client.end();
