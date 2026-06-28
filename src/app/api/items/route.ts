import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getItems, getAllItems, createItem, updateItem, deleteItem } from "@/lib/db";

export async function GET(request: Request) {
  await requirePermission("manage_komoditas");

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || undefined;
  const all = searchParams.get("all") === "true";
  const jenis = searchParams.get("jenis") as "BASAH" | "KERING" | null;

  const items = all ? await getAllItems(q, jenis || undefined) : await getItems(q, jenis || undefined);
  return NextResponse.json({ data: items });
}

export async function POST(request: Request) {
  await requirePermission("manage_komoditas");

  const body = await request.json();
  const { no, nama, satuan, stokAwal, jenis } = body;

  if (!no || !nama || !satuan) {
    return NextResponse.json({ error: "no, nama, dan satuan wajib diisi" }, { status: 400 });
  }

  try {
    const result = await createItem({ no: Number(no), nama, satuan, stokAwal: Number(stokAwal || 0), jenis });
    const item = Array.isArray(result) ? result[0] : result;
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  await requirePermission("manage_komoditas");

  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: "id diperlukan" }, { status: 400 });
  }

  const result = await updateItem(body.id, {
    no: body.no ? Number(body.no) : undefined,
    nama: body.nama,
    satuan: body.satuan,
    stokAwal: body.stokAwal !== undefined ? Number(body.stokAwal) : undefined,
    aktif: body.aktif !== undefined ? Boolean(body.aktif) : undefined,
    jenis: body.jenis,
  });

  if (!result) {
    return NextResponse.json({ error: "Tidak ada data yang diubah" }, { status: 400 });
  }

  const item = Array.isArray(result) ? result[0] : result;
  return NextResponse.json({ data: item });
}

export async function DELETE(request: Request) {
  await requirePermission("manage_komoditas");

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Parameter id diperlukan" }, { status: 400 });
  }

  await deleteItem(id);
  return NextResponse.json({ data: { success: true } });
}
