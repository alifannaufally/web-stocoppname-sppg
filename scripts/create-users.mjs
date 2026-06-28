import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ezgcdogmhizldtszbiyv.supabase.co";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const users = [
  { email: "admin@scb.com", password: "admin123", nama: "Admin SCB", role: "ADMIN" },
  { email: "korlap@scb.com", password: "korlap123", nama: "Korlap Gudang", role: "KORLAP" },
  { email: "korlap2@scb.com", password: "korlap123", nama: "Korlap 2", role: "KORLAP" },
  { email: "kagudang@scb.com", password: "kagudang123", nama: "Kepala Gudang", role: "KEPALA_GUDANG" },
  { email: "akuntan@scb.com", password: "akuntan123", nama: "Akuntan", role: "AKUNTAN" },
];

async function main() {
  const mgmtToken = process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = "ezgcdogmhizldtszbiyv";

  for (const u of users) {
    console.log(`\nProcessing ${u.email}...`);

    // Delete existing auth user first (cleanup)
    const { data: existing } = await supabase.auth.admin.getUserByEmail(u.email);
    if (existing?.user) {
      await supabase.auth.admin.deleteUser(existing.user.id);

      // Also delete from public.User via Management API sql
      await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
        method: "POST",
        headers: { Authorization: `Bearer ${mgmtToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query: `DELETE FROM "User" WHERE email = '${u.email}';` }),
      });
      console.log(`  ∼ Deleted existing ${u.email}`);
    }

    // Create auth user via Admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.nama },
    });

    if (error) {
      console.log(`  ✗ Failed: ${error.message}`);
      continue;
    }

    console.log(`  ✓ Auth user created: ${data.user?.id}`);

    // Insert into public.User via Management API
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${mgmtToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `INSERT INTO "User" (id, email, nama, "password", role, "createdAt") VALUES ('${data.user?.id}', '${u.email}', '${u.nama}', '${u.password}', '${u.role}', NOW()) ON CONFLICT (id) DO UPDATE SET nama = '${u.nama}', role = '${u.role}';`,
      }),
    });

    if (res.ok) {
      console.log(`  ✓ public.User synced`);
    } else {
      console.log(`  ✗ Sync failed: ${await res.text()}`);
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);
