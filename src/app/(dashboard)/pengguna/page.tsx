import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserManagementClient } from "./client";

async function fetchUsers(): Promise<{ id: string; email: string; nama: string; role: string; createdAt: string }[]> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      nama: u.nama,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
    }));
  } catch {
    try {
      const res = await fetch(
        `https://api.supabase.com/v1/projects/${process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/(.+)\.supabase\.co/)?.[1]}/database/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer `,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: `SELECT id, email, nama, role, "createdAt" FROM "User" ORDER BY "createdAt" DESC` }),
        },
      );
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }
    return [];
  }
}

export default async function PenggunaPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  const usersData = await fetchUsers();
  return <UserManagementClient users={usersData} />;
}
