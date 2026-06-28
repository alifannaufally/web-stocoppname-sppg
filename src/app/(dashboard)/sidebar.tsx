"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu, X, PanelLeftClose, PanelLeft,
  LayoutDashboard, ClipboardList, FileText, Users, Package, Shield, Settings,
} from "lucide-react";
import { SidebarUserSection } from "./sidebar-user-section";
import type { UserData } from "./types";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["AKUNTAN", "KORLAP", "KEPALA_GUDANG", "ADMIN"] },
  { href: "/input", label: "Input Harian", icon: ClipboardList, roles: ["KORLAP", "KEPALA_GUDANG", "ADMIN"] },
  { href: "/komoditas", label: "Komoditas", icon: Package, roles: ["KORLAP", "KEPALA_GUDANG", "ADMIN"] },
  { href: "/laporan", label: "Laporan", icon: FileText, roles: ["AKUNTAN", "KORLAP", "KEPALA_GUDANG", "ADMIN"] },
  { href: "/pengguna", label: "Pengguna", icon: Users, roles: ["ADMIN"] },
  { href: "/roles", label: "Role & Hak Akses", icon: Shield, roles: ["ADMIN"] },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings, roles: ["ADMIN"] },
];

export function DashboardSidebar({ user }: { user: UserData }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const sidebarContent = (compact: boolean) => (
    <>
      <div className={`flex items-center gap-3 border-b border-white/10 px-6 py-5 ${compact ? "justify-center px-0" : ""}`}>
        <img src="/logo-bgn.png" alt="SPPG" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
        {!compact && (
          <div>
            <p className="text-sm font-semibold">SPPG GAMPONG MULIA</p>
            <p className="text-xs text-white/60">Gudang Basah dan Kering</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems
          .filter((item) => item.roles.includes(user.role))
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => { setMobileOpen(false); }}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                compact ? "justify-center px-0" : ""
              } ${
                pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
              title={compact ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!compact && item.label}
            </Link>
          ))}
      </nav>

      {!compact && (
        <div className="border-t border-white/10 px-4 py-4">
          <SidebarUserSection user={user} />
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-[#092F54] text-white shadow-lg lg:hidden"
        aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Desktop sidebar */}
      <div className={`hidden lg:relative lg:flex lg:shrink-0 ${collapsed ? "w-16" : "w-64"} transition-all duration-200`}>
        {/* Desktop collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:text-[#092F54] hover:shadow-md transition-all"
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
        <aside className="flex h-full w-full flex-col bg-[#092F54] text-white">
          {sidebarContent(collapsed)}
        </aside>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <aside className="flex h-full w-full flex-col bg-[#092F54] text-white">
          {sidebarContent(false)}
        </aside>
      </div>
    </>
  );
}
