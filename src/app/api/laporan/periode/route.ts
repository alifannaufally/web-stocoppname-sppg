import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getLaporanPeriode } from "@/lib/db";

export async function GET(request: Request) {
  await requirePermission("view_laporan");

  const { searchParams } = new URL(request.url);
  const dari = searchParams.get("dari");
  const sampai = searchParams.get("sampai");

  if (!dari || !sampai) {
    return NextResponse.json(
      { error: "Parameter dari dan sampai diperlukan (YYYY-MM-DD)" },
      { status: 400 },
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dari) || !/^\d{4}-\d{2}-\d{2}$/.test(sampai)) {
    return NextResponse.json(
      { error: "Format tanggal harus YYYY-MM-DD" },
      { status: 400 },
    );
  }

  const rows = await getLaporanPeriode(dari, sampai);
  return NextResponse.json({ data: rows });
}
