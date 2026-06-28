import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getLaporanHarian } from "@/lib/db";

export async function GET(request: Request) {
  await requirePermission("view_laporan");

  const { searchParams } = new URL(request.url);
  const tanggal = searchParams.get("tanggal");

  if (!tanggal || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    return NextResponse.json(
      { error: "Parameter tanggal diperlukan (YYYY-MM-DD)" },
      { status: 400 },
    );
  }

  const rows = await getLaporanHarian(tanggal);
  return NextResponse.json({ data: rows });
}
