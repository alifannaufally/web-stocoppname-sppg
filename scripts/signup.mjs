import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wcpbuhaeqjiaylubtcpn.supabase.co";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_9wI8Tr1xzNyrHHJnTCBUjw_up0yNRDX";

const supabase = createClient(supabaseUrl, anonKey);

const users = [
  { email: "admin@sppg.com", password: "admin123", nama: "Admin SPBG", role: "ADMIN" },
  { email: "korlap@scb.com", password: "korlap123", nama: "Korlap Gudang", role: "KORLAP" },
  { email: "korlap2@scb.com", password: "korlap123", nama: "Korlap 2", role: "KORLAP" },
  { email: "kagudang@scb.com", password: "kagudang123", nama: "Kepala Gudang", role: "KEPALA_GUDANG" },
  { email: "akuntan@scb.com", password: "akuntan123", nama: "Akuntan", role: "AKUNTAN" },
];

async function main() {
  for (const u of users) {
    const { data, error } = await supabase.auth.signUp({
      email: u.email,
      password: u.password,
      options: { data: { full_name: u.nama } },
    });

    if (error) {
      if (error.message.includes("already")) {
        console.log(`  ∼ ${u.email} already exists`);
      } else {
        console.log(`  ✗ ${u.email}: ${error.message}`);
      }
    } else {
      console.log(`  ✓ ${u.email} signed up (id: ${data.user?.id})`);
    }
  }
}

main().catch(console.error);
