import { getCurrentUser, requireRole } from "@/lib/auth";
import { getDashboardStats } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarangMasukChart } from "@/components/barang-masuk-chart";
import {
  Warehouse,
  Users,
  UserCheck,
  AlertTriangle,
  ShoppingCart,
} from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let stats: { totalItems: number | null; totalUsers: number | null };
  try {
    const data = await getDashboardStats();
    stats = { totalItems: data.totalItems, totalUsers: data.totalUsers };
  } catch {
    stats = { totalItems: null, totalUsers: null };
  }

  return (
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
            <CardTitle className="text-sm font-medium text-gray-500">Total Komoditas</CardTitle>
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
            <CardTitle className="text-sm font-medium text-gray-500">Total Pengguna</CardTitle>
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
            <CardTitle className="text-sm font-medium text-gray-500">Role Anda</CardTitle>
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
  );
}
