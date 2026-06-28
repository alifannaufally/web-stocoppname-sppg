import Link from "next/link";
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
import { SidebarUserSection } from "./sidebar-user-section";

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

  const userRole = user.role;

  return (
    <div className="flex h-screen">
      <aside className="flex w-64 flex-col bg-[#092F54] text-white">
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
          <img src="/logo-bgn.png" alt="SPPG" className="h-10 w-10 rounded-lg object-cover" />
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
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <SidebarUserSection user={{ id: user.id, email: user.email, nama: user.nama, role: user.role }} />
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
