import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "./prisma";
import { createClient } from "./supabase/server";
import type { Permission } from "./permissions";
import { hasPermission, DEFAULT_PERMISSIONS } from "./permissions";

interface DbUser {
  id: string;
  email: string;
  nama: string;
  password: string | null;
  role: string;
  createdAt: Date;
}

async function queryDbUser(userId: string, email: string): Promise<DbUser | null> {
  // Try lookup by auth user ID first
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) return user;
  } catch {
    // Prisma unavailable, try Management API
  }

  // Try lookup by email in case auth ID doesn't match public.User ID
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) return user;
  } catch {
    // Prisma unavailable, try Management API
  }

  try {
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(
      /https:\/\/(.+)\.supabase\.co/,
    )?.[1];
    const token = process.env.SUPABASE_ACCESS_TOKEN;
    if (!projectRef || !token) return null;

    const res = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `SELECT id, email, nama, "password", role, "createdAt" FROM "User" WHERE email = '${email}' LIMIT 1`,
        }),
      },
    );

    if (!res.ok) return null;
    const rows = await res.json();
    if (!rows?.length) return null;

    return {
      id: rows[0].id,
      email: rows[0].email,
      nama: rows[0].nama,
      password: rows[0].password ?? null,
      role: rows[0].role,
      createdAt: new Date(rows[0].createdAt),
    };
  } catch {
    return null;
  }
}

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const dbUser = await queryDbUser(authUser.id, authUser.email ?? "");
  if (dbUser) return dbUser;

  // Last resort: build from auth metadata
  const meta = authUser.user_metadata;
  return {
    id: authUser.id,
    email: authUser.email ?? "",
    nama: (meta?.full_name as string) || authUser.email?.split("@")[0] || "User",
    password: null,
    role: "KORLAP",
    createdAt: new Date(authUser.created_at),
  };
});

export async function requireRole(allowed: string[]) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!allowed.includes(user.role)) {
    redirect("/laporan");
  }
  return user;
}

export async function requireAdmin() {
  return requireRole(["ADMIN"]);
}

export async function requireOperational() {
  return requireRole(["KORLAP", "KEPALA_GUDANG", "ADMIN"]);
}

const rolePermissionsCache = new Map<string, Record<string, string[]>>();
let rolePermsTimestamp = 0;
const ROLE_PERMS_TTL = 10000;

export async function getRolePermissionsMap(): Promise<Record<string, string[]>> {
  if (Date.now() - rolePermsTimestamp < ROLE_PERMS_TTL && rolePermissionsCache.has("_")) {
    return rolePermissionsCache.get("_")!;
  }

  try {
    const { getRolePermissions } = await import("./db");
    const map = await getRolePermissions();
    rolePermissionsCache.set("_", map);
    rolePermsTimestamp = Date.now();
    return map;
  } catch {
    return {};
  }
}

export async function requirePermission(permission: Permission | Permission[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const permsMap = await getRolePermissionsMap();
  const userPerms = permsMap[user.role] ?? DEFAULT_PERMISSIONS[user.role] ?? [];

  const required = Array.isArray(permission) ? permission : [permission];
  const allowed = required.every((p) => userPerms.includes(p));

  if (!allowed) {
    redirect("/laporan");
  }
  return user;
}
