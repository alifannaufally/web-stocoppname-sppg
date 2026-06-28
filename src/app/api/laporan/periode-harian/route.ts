import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getLaporanHarian } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dari = searchParams.get("dari");
  const sampai = searchParams.get("sampai");

  if (!dari || !sampai) {
    return NextResponse.json({ error: "Parameter dari dan sampai diperlukan" }, { status: 400 });
  }

  // Get all dates with entries in the range
  const dateRows = await prisma.opnameEntry.findMany({
    where: { tanggal: { gte: new Date(dari), lte: new Date(sampai) } },
    select: { tanggal: true },
    distinct: ["tanggal"],
    orderBy: { tanggal: "asc" },
  });

  // Get harian data for each date in parallel
  const sheets = await Promise.all(
    dateRows.map(async (row) => {
      const dateStr = row.tanggal.toISOString().split("T")[0];
      const items = await getLaporanHarian(dateStr);
      return { tanggal: dateStr, items };
    }),
  );

  return NextResponse.json({ data: sheets });
}
