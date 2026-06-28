import { getCurrentUser } from "@/lib/auth";
import { getDashboardStats } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarangMasukChart } from "@/components/barang-masuk-chart";
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Users,
  Package,
  LogOut,
  Warehouse,
  ShoppingCart,
  UserCheck,
  AlertTriangle,
  Shield,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["AKUNTAN", "KORLAP", "KEPALA_GUDANG", "ADMIN"] },
  { href: "/input", label: "Input Harian", icon: ClipboardList, roles: ["KORLAP", "KEPALA_GUDANG", "ADMIN"] },
  { href: "/komoditas", label: "Komoditas", icon: Package, roles: ["KORLAP", "KEPALA_GUDANG", "ADMIN"] },
  { href: "/laporan", label: "Laporan", icon: FileText, roles: ["AKUNTAN", "KORLAP", "KEPALA_GUDANG", "ADMIN"] },
  { href: "/pengguna", label: "Pengguna", icon: Users, roles: ["ADMIN"] },
  { href: "/roles", label: "Role & Hak Akses", icon: Shield, roles: ["ADMIN"] },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings, roles: ["ADMIN"] },
];

async function handleLogout() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  let stats: { totalItems: number | null; totalUsers: number | null };
  try {
    const data = await getDashboardStats();
    stats = { totalItems: data.totalItems, totalUsers: data.totalUsers };
  } catch {
    stats = { totalItems: null, totalUsers: null };
  }

  const userRole = user.role;

  return (
    <div className="flex h-screen">
      <aside className="flex w-64 flex-col bg-[#092F54] text-white">
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
          <img src="/logo-bgn.png" alt="SPPG GAMPONG MULIA" className="h-10 w-10 rounded-lg object-cover" />
          <div>
            <p className="text-sm font-semibold">SPPG GAMPONG MULIA</p>
            <p className="text-xs text-white/60">Gudang Basah dan Kering</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems
            .filter((item) => item.roles.includes(userRole))
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  item.href === "/"
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3C623] text-xs font-bold text-[#092F54]">
              {user.nama.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.nama}</p>
              <p className="text-xs text-white/60">{user.role.replace("_", " ")}</p>
            </div>
          </div>
          <form action={handleLogout}>
            <Button
              variant="ghost"
              type="submit"
              className="w-full justify-start gap-3 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </Button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="p-8">
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-[#092F54]">Dashboard</h1>
              <p className="mt-2 text-gray-500">
                Selamat datang, <span className="font-medium text-[#092F54]">{user.nama}</span>{" "}
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F3C623]/20 px-2.5 py-0.5 text-xs font-medium text-[#F3C623]">
                  {user.role.replace("_", " ")}
                </span>
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Total Komoditas
                  </CardTitle>
                  <div className="rounded-lg bg-blue-50 p-2">
                    <Warehouse className="h-4 w-4 text-[#092F54]" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-[#092F54]">
                    {stats.totalItems !== null ? stats.totalItems : "—"}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">Barang aktif di sistem</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Total Pengguna
                  </CardTitle>
                  <div className="rounded-lg bg-green-50 p-2">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-[#092F54]">
                    {stats.totalUsers !== null ? stats.totalUsers : "—"}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">Terdaftar di sistem</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Role Anda
                  </CardTitle>
                  <div className="rounded-lg bg-amber-50 p-2">
                    <UserCheck className="h-4 w-4 text-amber-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-[#F3C623]">
                    {user.role.replace("_", " ")}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {user.role === "ADMIN"
                      ? "Akses penuh ke semua fitur"
                      : user.role === "KORLAP"
                        ? "Koordinator lapangan"
                        : user.role === "KEPALA_GUDANG"
                          ? "Kepala gudang"
                          : "Akuntan"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-[#092F54]">
                    Barang Masuk per Komoditas
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    Grafik barang masuk 7 komoditas teratas
                  </p>
                </CardHeader>
                <CardContent>
                  <BarangMasukChart />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#092F54]">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Item Berselisih
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    Barang dengan selisih stok
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ShoppingCart className="mb-3 h-12 w-12 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">Belum ada data</p>
                    <p className="mt-1 text-xs text-gray-400">
                      Data akan muncul setelah opname dilakukan
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
