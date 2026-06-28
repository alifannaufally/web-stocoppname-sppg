import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Users,
  Package,
  Shield,
  Settings,
} from "lucide-react";
import { DashboardSidebar } from "./sidebar";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["AKUNTAN", "KORLAP", "KEPALA_GUDANG", "ADMIN"] },
  { href: "/input", label: "Input Harian", icon: ClipboardList, roles: ["KORLAP", "KEPALA_GUDANG", "ADMIN"] },
  { href: "/komoditas", label: "Komoditas", icon: Package, roles: ["KORLAP", "KEPALA_GUDANG", "ADMIN"] },
  { href: "/laporan", label: "Laporan", icon: FileText, roles: ["AKUNTAN", "KORLAP", "KEPALA_GUDANG", "ADMIN"] },
  { href: "/pengguna", label: "Pengguna", icon: Users, roles: ["ADMIN"] },
  { href: "/roles", label: "Role & Hak Akses", icon: Shield, roles: ["ADMIN"] },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings, roles: ["ADMIN"] },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar
        navItems={navItems}
        user={{ id: user.id, email: user.email, nama: user.nama, role: user.role }}
      />
      <main className="flex-1 overflow-auto bg-gray-50 pt-16 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
