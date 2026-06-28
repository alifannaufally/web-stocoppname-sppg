import { Client } from "pg";

const client = new Client({
  connectionString: "postgresql://postgres.wcpbuhaeqjiaylubtcpn:Pampam201201%40@aws-1-ap-south-1.pooler.supabase.com:5432/postgres",
});
await client.connect();

const q = String.raw;
await client.query(q`ALTER TABLE "OpnameEntry" ADD COLUMN IF NOT EXISTS "stokSistem" DOUBLE PRECISION NOT NULL DEFAULT 0`);
await client.query(q`ALTER TABLE "OpnameEntry" ADD COLUMN IF NOT EXISTS "selisih" DOUBLE PRECISION NOT NULL DEFAULT 0`);
console.log("✓ Columns added");

const { rows } = await client.query(q`SELECT column_name FROM information_schema.columns WHERE table_name = 'OpnameEntry' ORDER BY ordinal_position`);
console.log("Columns:", rows.map(r => r.column_name).join(", "));

await client.end();
