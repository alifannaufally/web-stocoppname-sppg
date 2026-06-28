import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wcpbuhaeqjiaylubtcpn.supabase.co";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const mgmtToken = process.env.SUPABASE_ACCESS_TOKEN || "";
const projectRef = supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)?.[1] || "wcpbuhaeqjiaylubtcpn";

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const users = [
  { email: "admin@sppg.com", password: "admin123", nama: "Admin SPBG", role: "ADMIN" },
  { email: "korlap@scb.com", password: "korlap123", nama: "Korlap Gudang", role: "KORLAP" },
  { email: "korlap2@scb.com", password: "korlap123", nama: "Korlap 2", role: "KORLAP" },
  { email: "kagudang@scb.com", password: "kagudang123", nama: "Kepala Gudang", role: "KEPALA_GUDANG" },
  { email: "akuntan@scb.com", password: "akuntan123", nama: "Akuntan", role: "AKUNTAN" },
];

async function sql(query: string) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${mgmtToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function main() {
  for (const u of users) {
    console.log(`Creating ${u.email}...`);

    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.nama },
    });

    if (error) {
      if (error.message?.includes("already")) {
        console.log(`  ∼ Already exists`);
      } else {
        console.log(`  ✗ ${error.message}`);
      }
      continue;
    }

    console.log(`  ✓ Auth: ${data.user?.id}`);

    try {
      await sql(
        `INSERT INTO "User" (id, email, nama, "password", role, "createdAt") VALUES ('${data.user?.id}', '${u.email}', '${u.nama}', '${u.password}', '${u.role}', NOW()) ON CONFLICT (id) DO UPDATE SET nama = '${u.nama}', role = '${u.role}';`
      );
      console.log(`  ✓ DB synced`);
    } catch (e: unknown) {
      console.log(`  ✗ DB: ${(e as Error).message}`);
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);
