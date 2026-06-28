import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LaporanClient } from "./client";

export default async function LaporanPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <LaporanClient />;
}
