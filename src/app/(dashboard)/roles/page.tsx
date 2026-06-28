import { requireRole } from "@/lib/auth";
import { getRolesAndPermissions } from "@/lib/db";
import { RolesClient } from "./client";

export default async function RolesPage() {
  await requireRole(["ADMIN"]);
  const data = await getRolesAndPermissions();
  return <RolesClient initialData={data} />;
}
