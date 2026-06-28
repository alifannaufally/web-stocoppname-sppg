import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getItems, getOpnameByDate, batchStokAwalHari } from "@/lib/db";

export async function GET(request: Request) {
  await requirePermission("input_opname");

  const { searchParams } = new URL(request.url);
  const tanggal = searchParams.get("tanggal");
  const jenis = searchParams.get("jenis") as "BASAH" | "KERING" | null;

  if (!tanggal || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    return NextResponse.json({ error: "tanggal diperlukan (YYYY-MM-DD)" }, { status: 400 });
  }

  const items = await getItems(undefined, jenis || undefined);
  const [entries, stokData] = await Promise.all([
    getOpnameByDate(tanggal),
    (async () => {
      const ids = items.map((i: { id: string }) => i.id);
      return ids.length ? batchStokAwalHari(ids, tanggal) : {};
    })(),
  ]);

  const stokAwal = Object.entries(stokData).map(([id, value]) => ({
    id, stokAwalHari: value,
  }));

  return NextResponse.json({
    data: {
      items: items.map((i: { id: string; no: number; nama: string; satuan: string }) => ({
        id: i.id, no: i.no, nama: i.nama, satuan: i.satuan,
      })),
      stokAwal,
      entries,
    },
  });
}
