import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getOpnameByDate, upsertOpnameEntry } from "@/lib/db";

async function mapConcurrent<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

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

  const entries = await getOpnameByDate(tanggal);
  return NextResponse.json({ data: entries });
}

export async function POST(request: Request) {
  const user = await requirePermission("input_opname");

  const body = await request.json();
  const { tanggal, entries } = body;

  if (!tanggal || !entries?.length) {
    return NextResponse.json({ error: "tanggal dan entries diperlukan" }, { status: 400 });
  }

  const savedEntries = await mapConcurrent(
    entries,
    5,
    async (entry: { itemId: string; masuk: number; keluar: number; stokFisik?: number; catatan?: string }) => {
      const result = await upsertOpnameEntry({
        itemId: entry.itemId,
        tanggal,
        masuk: entry.masuk,
        keluar: entry.keluar,
        stokFisik: entry.stokFisik ?? 0,
        catatan: entry.catatan,
        diinputOleh: user.id,
      });
      return Array.isArray(result) ? result[0] : result;
    },
  );

  return NextResponse.json({ data: savedEntries }, { status: 201 });
}
