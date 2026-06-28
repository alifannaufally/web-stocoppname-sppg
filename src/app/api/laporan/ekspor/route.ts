import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getLaporanHarian } from "@/lib/db";
import { prisma } from "@/lib/prisma";

function escapeCsv(val: unknown): string {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers: string[], rows: Record<string, unknown>[], keys: string[]): string {
  const headerLine = headers.map(escapeCsv).join(",");
  const dataLines = rows.map((row) => keys.map((k) => escapeCsv(row[k])).join(","));
  return [headerLine, ...dataLines].join("\r\n");
}

const HARIAN_HEADERS = ["No", "Nama", "Satuan", "Stok Awal Hari", "Total Masuk", "Total Keluar", "Total Akhir", "Gambar"];
const HARIAN_KEYS = ["no", "nama", "satuan", "stokAwal", "masuk", "keluar", "totalAkhir", "catatan"];

export async function GET(request: Request) {
  await requirePermission("view_laporan");

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");

  if (mode === "harian") {
    const tanggal = searchParams.get("tanggal");
    if (!tanggal || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
      return NextResponse.json({ error: "Parameter tanggal diperlukan (YYYY-MM-DD)" }, { status: 400 });
    }

    const rows = await getLaporanHarian(tanggal);
    const csv = toCsv(HARIAN_HEADERS, rows, HARIAN_KEYS);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="laporan-harian-${tanggal}.csv"`,
      },
    });
  }

  if (mode === "periode-harian") {
    const dari = searchParams.get("dari");
    const sampai = searchParams.get("sampai");
    if (!dari || !sampai) {
      return NextResponse.json({ error: "Parameter dari dan sampai diperlukan (YYYY-MM-DD)" }, { status: 400 });
    }

    const dateRows = await prisma.opnameEntry.findMany({
      where: { tanggal: { gte: new Date(dari), lte: new Date(sampai) } },
      select: { tanggal: true },
      distinct: ["tanggal"],
      orderBy: { tanggal: "asc" },
    });

    const parts: string[] = [];
    for (const row of dateRows) {
      const dateStr = row.tanggal.toISOString().split("T")[0];
      const items = await getLaporanHarian(dateStr);
      parts.push(`Sheet: ${dateStr}`);
      parts.push(toCsv(HARIAN_HEADERS, items, HARIAN_KEYS));
      parts.push("");
    }

    const csv = parts.join("\r\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="laporan-periode-${dari}-${sampai}.csv"`,
      },
    });
  }

  return NextResponse.json(
    { error: "Parameter mode harus 'harian' atau 'periode-harian'" },
    { status: 400 },
  );
}
