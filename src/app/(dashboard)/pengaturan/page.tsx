import { requireRole } from "@/lib/auth";
import { SettingsClient } from "./client";

export default async function PengaturanPage() {
  await requireRole(["ADMIN"]);
  return <SettingsClient />;
}
