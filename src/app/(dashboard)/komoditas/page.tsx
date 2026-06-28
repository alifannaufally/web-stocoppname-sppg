import { requireRole } from "@/lib/auth";
import { KomoditasClient } from "./client";

export default async function KomoditasPage() {
  await requireRole(["KORLAP", "KEPALA_GUDANG", "ADMIN"]);
  return <KomoditasClient />;
}
