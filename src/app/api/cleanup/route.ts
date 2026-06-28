import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  await requirePermission("manage_settings");

  const { searchParams } = new URL(request.url);
  let dari = searchParams.get("dari");
  let sampai = searchParams.get("sampai");

  if (!dari || !sampai) {
    const oldest = await prisma.opnameEntry.findFirst({
      orderBy: { tanggal: "asc" },
      select: { tanggal: true },
    });
    if (!oldest) {
      return NextResponse.json({ data: { message: "Tidak ada data opname" } });
    }
    const d = new Date(oldest.tanggal);
    d.setDate(1);
    const blockMonth = Math.floor(d.getMonth() / 2) * 2;
    d.setMonth(blockMonth);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    dari = d.toISOString().split("T")[0];
    const end = new Date(d);
    end.setDate(14);
    end.setHours(23, 59, 59, 999);
    sampai = end.toISOString().split("T")[0];
  }

  const dateDari = new Date(dari + "T00:00:00");
  const dateSampai = new Date(sampai + "T23:59:59");

  if (isNaN(dateDari.getTime()) || isNaN(dateSampai.getTime())) {
    return NextResponse.json({ error: "Format tanggal tidak valid" }, { status: 400 });
  }

  const result = await prisma.opnameEntry.deleteMany({
    where: { tanggal: { gte: dateDari, lte: dateSampai } },
  });

  return NextResponse.json({
    data: {
      deletedCount: result.count,
      dari,
      sampai,
      message: `${result.count} entri opname dihapus (${dari} — ${sampai})`,
    },
  });
}

export async function GET(request: Request) {
  await requirePermission("manage_settings");

  const { searchParams } = new URL(request.url);
  const dari = searchParams.get("dari");
  const sampai = searchParams.get("sampai");

  const totalEntries = await prisma.opnameEntry.count();

  if (dari && sampai) {
    const dateDari = new Date(dari + "T00:00:00");
    const dateSampai = new Date(sampai + "T23:59:59");
    const toBeDeleted = await prisma.opnameEntry.count({
      where: { tanggal: { gte: dateDari, lte: dateSampai } },
    });
    return NextResponse.json({ data: { totalEntries, dari, sampai, toBeDeleted } });
  }

  const oldest = await prisma.opnameEntry.findFirst({
    orderBy: { tanggal: "asc" },
    select: { tanggal: true },
  });

  if (!oldest) {
    return NextResponse.json({ data: { totalEntries: 0, oldestDate: null, toBeDeleted: 0 } });
  }

  const d = new Date(oldest.tanggal);
  d.setDate(1);
  const blockMonth = Math.floor(d.getMonth() / 2) * 2;
  d.setMonth(blockMonth);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setDate(14);
  end.setHours(23, 59, 59, 999);

  const toBeDeleted = await prisma.opnameEntry.count({
    where: { tanggal: { gte: d, lte: end } },
  });

  return NextResponse.json({
    data: {
      totalEntries,
      oldestDate: oldest.tanggal.toISOString().split("T")[0],
      dari: d.toISOString().split("T")[0],
      sampai: end.toISOString().split("T")[0],
      toBeDeleted,
    },
  });
}
