import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getLaporanHarian } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

import ExcelJS from "exceljs";
import { ZipArchive } from "archiver";

const HEADERS = ["No", "Nama", "Satuan", "Stok Awal Hari", "Total Masuk", "Total Keluar", "Total Akhir", "Gambar"];
const KEYS = ["no", "nama", "satuan", "stokAwal", "masuk", "keluar", "totalAkhir", "catatan"];

async function buildWorkbook(sheets: { tanggal: string; items: Record<string, unknown>[] }[]) {
  const wb = new ExcelJS.Workbook();
  for (const sheet of sheets) {
    const ws = wb.addWorksheet(sheet.tanggal);
    ws.columns = HEADERS.map((h) => ({ header: h, key: h, width: h === "Nama" ? 24 : h === "Gambar" ? 12 : 14 }));
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF092F54" } };

    for (const item of sheet.items) {
      const rowData: Record<string, unknown> = {};
      KEYS.forEach((k, i) => { rowData[HEADERS[i]] = item[k]; });
      const addedRow = ws.addRow(rowData);

      addedRow.height = 45;

      // Add image if present
      const imgUrl = item.catatan as string;
      if (imgUrl?.startsWith("http")) {
        try {
          const imgRes = await fetch(imgUrl);
          if (imgRes.ok) {
            const contentType = imgRes.headers.get("content-type") || "";
            const ext = contentType.includes("png") ? "png" : "jpeg";
            const imgArr = await imgRes.arrayBuffer();
            const imgId = wb.addImage({ buffer: imgArr, extension: ext });
            ws.addImage(imgId, {
              tl: { col: 7, row: addedRow.number - 1 },
              ext: { width: 60, height: 60 },
              editAs: "oneCell",
            });
            addedRow.getCell(8).value = "";
          }
        } catch {
          // leave URL as text on failure
        }
      }
    }
  }
  return wb;
}

export async function GET(request: Request) {
  await requirePermission("view_laporan");

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");
  const format = searchParams.get("format") || "xlsx";

  // Determine sheets
  let sheets: { tanggal: string; items: Record<string, unknown>[] }[] = [];

  if (mode === "harian") {
    const tanggal = searchParams.get("tanggal");
    if (!tanggal) return NextResponse.json({ error: "tanggal diperlukan" }, { status: 400 });
    const items = await getLaporanHarian(tanggal);
    sheets = [{ tanggal, items }];
  } else if (mode === "periode-harian") {
    const dari = searchParams.get("dari");
    const sampai = searchParams.get("sampai");
    if (!dari || !sampai) return NextResponse.json({ error: "dari & sampai diperlukan" }, { status: 400 });

    const dateRows = await prisma.opnameEntry.findMany({
      where: { tanggal: { gte: new Date(dari), lte: new Date(sampai) } },
      select: { tanggal: true }, distinct: ["tanggal"], orderBy: { tanggal: "asc" },
    });
    for (const row of dateRows) {
      const dateStr = row.tanggal.toISOString().split("T")[0];
      sheets.push({ tanggal: dateStr, items: await getLaporanHarian(dateStr) });
    }
  } else {
    return NextResponse.json({ error: "mode harus harian atau periode-harian" }, { status: 400 });
  }

  if (format === "zip") {
    // Generate ZIP: CSV + images
    const archive = new ZipArchive({ zlib: { level: 9 } });
    const chunks: Buffer[] = [];
    archive.on("data", (c: Buffer) => chunks.push(c));
    archive.on("error", (e: Error) => { throw e; });

    // Add CSV for each sheet
    for (const sheet of sheets) {
      const csv = [HEADERS.join(","), ...sheet.items.map((r) => KEYS.map((k) => String(r[k] ?? "").replace(/,/g, ";")).join(","))].join("\r\n");
      archive.append(csv, { name: `${sheet.tanggal}.csv` });
    }

    // Add images
    const supabase = await createClient();
    const seenUrls = new Set<string>();
    for (const sheet of sheets) {
      for (const item of sheet.items) {
        const url = item.catatan as string;
        if (url?.startsWith("http") && !seenUrls.has(url)) {
          seenUrls.add(url);
          try {
            const imgRes = await fetch(url, {
              headers: {
                "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
                "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              },
            });
            if (imgRes.ok) {
              const ext = url.split(".").pop() || "jpg";
              const imgName = url.split("/").pop() || `img-${seenUrls.size}.${ext}`;
              archive.append(Buffer.from(await imgRes.arrayBuffer()), { name: `gambar/${imgName}` });
            }
          } catch { /* skip */ }
        }
      }
    }

    archive.finalize();
    await new Promise<void>((resolve) => archive.on("end", resolve));
    await new Promise<void>((r) => setTimeout(r, 500)); // wait for chunks

    const zipBuffer = new Uint8Array(chunks.reduce((acc: number[], c) => [...acc, ...c], []));
    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="laporan-${mode}-${sheets[0]?.tanggal || "data"}.zip"`,
      },
    });
  }

  // Default: XLSX
  const wb = await buildWorkbook(sheets);
  const buffer = await wb.xlsx.writeBuffer() as ArrayBuffer;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="laporan-${mode}-${sheets[0]?.tanggal || "data"}.xlsx"`,
    },
  });
}
