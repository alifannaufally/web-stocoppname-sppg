import { Badge } from "@/components/ui/badge";

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  KEPALA_GUDANG: "Kepala Gudang",
  KORLAP: "Korlap",
  AKUNTAN: "Akuntan",
};

const roleVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ADMIN: "default",
  KEPALA_GUDANG: "secondary",
  KORLAP: "outline",
  AKUNTAN: "destructive",
};

export function RoleBadge({ role }: { role: string }) {
  return <Badge variant={roleVariants[role]}>{roleLabels[role]}</Badge>;
}
