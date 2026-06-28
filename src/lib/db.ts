import "server-only";
import { prisma } from "./prisma";

const queryCache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 5000;

function getCached<T>(key: string): T | null {
  const entry = queryCache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data as T;
  queryCache.delete(key);
  return null;
}

function setCache(key: string, data: unknown) {
  queryCache.set(key, { data, ts: Date.now() });
  if (queryCache.size > 100) {
    const oldest = [...queryCache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) queryCache.delete(oldest[0]);
  }
}

function cacheKey(fn: string, ...args: unknown[]) {
  return `${fn}:${JSON.stringify(args)}`;
}

// Items
export async function getItems(search?: string, jenis?: "BASAH" | "KERING") {
  return prisma.item.findMany({
    where: {
      aktif: true,
      ...(search ? { nama: { contains: search, mode: "insensitive" } } : {}),
      ...(jenis ? { jenis } : {}),
    },
    orderBy: { no: "asc" },
    select: { id: true, no: true, nama: true, satuan: true, jenis: true, stokAwal: true, aktif: true },
  });
}

export async function getAllItems(search?: string, jenis?: "BASAH" | "KERING") {
  return prisma.item.findMany({
    where: {
      ...(search ? { nama: { contains: search, mode: "insensitive" } } : {}),
      ...(jenis ? { jenis } : {}),
    },
    orderBy: { no: "asc" },
    select: { id: true, no: true, nama: true, satuan: true, jenis: true, stokAwal: true, aktif: true },
  });
}

export async function createItem(data: { no: number; nama: string; satuan: string; stokAwal: number; jenis?: "BASAH" | "KERING" }) {
  return prisma.item.create({ data: { ...data, aktif: true } });
}

export async function updateItem(id: string, data: { no?: number; nama?: string; satuan?: string; stokAwal?: number; aktif?: boolean; jenis?: "BASAH" | "KERING" }) {
  return prisma.item.update({ where: { id }, data, select: { id: true, no: true, nama: true, satuan: true, jenis: true, stokAwal: true, aktif: true } });
}

export async function deleteItem(id: string) {
  await prisma.opnameEntry.deleteMany({ where: { itemId: id } });
  await prisma.item.delete({ where: { id } });
}

// Opname
export async function getOpnameByDate(tanggal: string) {
  const entries = await prisma.opnameEntry.findMany({
    where: { tanggal: new Date(tanggal) },
    include: { item: { select: { no: true, nama: true, satuan: true, stokAwal: true, jenis: true } } },
    orderBy: { item: { no: "asc" } },
  });

  if (entries.length === 0) return [];

  const itemIds: string[] = [...new Set(entries.map((e: { itemId: string }) => e.itemId))];
  const stokMap = await batchStokAwalHari(itemIds, tanggal);

  return entries.map((e: {
    id: string; itemId: string; tanggal: Date; masuk: number; keluar: number;
    stokFisik: number; catatan: string | null;
    item: { no: number; nama: string; satuan: string; stokAwal: number; jenis: string };
  }) => ({
    id: e.id,
    itemId: e.itemId,
    tanggal: e.tanggal.toISOString().split("T")[0],
    masuk: e.masuk,
    keluar: e.keluar,
    stokFisik: e.stokFisik,
    catatan: e.catatan,
    itemNo: e.item.no,
    itemNama: e.item.nama,
    itemSatuan: e.item.satuan,
    itemStokAwal: e.item.stokAwal,
    itemJenis: e.item.jenis,
    stokAwalHari: stokMap[e.itemId] ?? 0,
  }));
}

export async function getStokAwalHari(itemId: string, tanggal: string) {
  const key = cacheKey("getStokAwalHari", itemId, tanggal);
  const cached = getCached<number>(key);
  if (cached !== null) return cached;

  const rows = await prisma.$queryRaw<{ stok_awal: number; net: number }[]>`
    SELECT i."stokAwal" as stok_awal, COALESCE(SUM(oe.masuk - oe.keluar), 0) as net
    FROM "Item" i
    LEFT JOIN "OpnameEntry" oe ON i.id = oe."itemId" AND oe.tanggal < ${new Date(tanggal)}::date
    WHERE i.id = ${itemId}
    GROUP BY i.id, i."stokAwal"
  `;
  let result = 0;
  if (rows.length > 0) result = Number(rows[0].stok_awal) + Number(rows[0].net);
  setCache(key, result);
  return result;
}

export async function batchStokAwalHari(itemIds: string[], tanggal: string) {
  const key = cacheKey("batchStokAwalHari", [...itemIds].sort(), tanggal);
  const cached = getCached<Record<string, number>>(key);
  if (cached) return cached;

  const rows = await prisma.$queryRaw<{ id: string; stok_awal: number; net: number }[]>`
    SELECT i.id, i."stokAwal" as stok_awal, COALESCE(SUM(oe.masuk - oe.keluar), 0) as net
    FROM "Item" i
    LEFT JOIN "OpnameEntry" oe ON i.id = oe."itemId" AND oe.tanggal < ${new Date(tanggal)}::date
    WHERE i.id = ANY(${itemIds})
    GROUP BY i.id, i."stokAwal"
  `;
  const map: Record<string, number> = {};
  for (const row of rows) map[row.id] = Number(row.stok_awal) + Number(row.net);
  setCache(key, map);
  return map;
}

export async function upsertOpnameEntry(data: {
  itemId: string; tanggal: string; masuk: number; keluar: number;
  stokFisik: number; catatan?: string; diinputOleh: string;
}) {
  const tanggal = new Date(data.tanggal);
  return prisma.opnameEntry.upsert({
    where: { itemId_tanggal: { itemId: data.itemId, tanggal } },
    create: { itemId: data.itemId, tanggal, masuk: data.masuk, keluar: data.keluar, stokFisik: data.stokFisik, catatan: data.catatan, diinputOleh: data.diinputOleh },
    update: { masuk: data.masuk, keluar: data.keluar, stokFisik: data.stokFisik, catatan: data.catatan, diinputOleh: data.diinputOleh },
  });
}

// Laporan Harian
export async function getLaporanHarian(tanggal: string) {
  const items = await prisma.item.findMany({ where: { aktif: true }, orderBy: { no: "asc" } });
  const [entries, stokMap] = await Promise.all([
    prisma.opnameEntry.findMany({ where: { tanggal: new Date(tanggal) } }),
    batchStokAwalHari(items.map((i: { id: string }) => i.id), tanggal),
  ]);

  const entryMap = new Map(entries.map((e: { itemId: string; id: string; masuk: number; keluar: number; stokFisik: number; catatan: string | null }) => [e.itemId, e]));
  return items.map((item: { id: string; no: number; nama: string; satuan: string; jenis: string; stokAwal: number }) => {
    const entry = entryMap.get(item.id);
    const stokAwal = stokMap[item.id] ?? 0;
    const masuk = entry?.masuk ?? 0;
    const keluar = entry?.keluar ?? 0;
    return {
      id: item.id, no: item.no, nama: item.nama, satuan: item.satuan, jenis: item.jenis,
      stokAwal, masuk, keluar, totalAkhir: stokAwal + masuk - keluar,
      catatan: entry?.catatan ?? null,
    };
  });
}

// Laporan Periode
export async function getLaporanPeriode(dari: string, sampai: string) {
  const items: { id: string; no: number; nama: string; satuan: string; jenis: string; stokAwal: number }[] = await prisma.item.findMany({ where: { aktif: true }, orderBy: { no: "asc" } });
  const stokMap = await batchStokAwalHari(items.map((i) => i.id), dari);

  const dateDari = new Date(dari);
  const dateSampai = new Date(sampai);
  const aggRows = await prisma.$queryRaw<{ item_id: string; total_masuk: number; total_keluar: number }[]>`
    SELECT oe."itemId" as item_id, COALESCE(SUM(oe.masuk), 0) as total_masuk, COALESCE(SUM(oe.keluar), 0) as total_keluar
    FROM "OpnameEntry" oe
    WHERE oe.tanggal >= ${dateDari}::date AND oe.tanggal <= ${dateSampai}::date
    AND oe."itemId" = ANY(${items.map((i) => i.id)})
    GROUP BY oe."itemId"
  `;
  const aggMap = new Map(aggRows.map((r) => [r.item_id, { masuk: Number(r.total_masuk), keluar: Number(r.total_keluar) }]));

  return items.map((item) => {
    const agg = aggMap.get(item.id);
    const stokAwal = stokMap[item.id] ?? 0;
    const totalMasuk = agg?.masuk ?? 0;
    const totalKeluar = agg?.keluar ?? 0;
    return {
      id: item.id, no: item.no, nama: item.nama, satuan: item.satuan, jenis: item.jenis,
      stokAwal, totalMasuk, totalKeluar, totalAkhir: stokAwal + totalMasuk - totalKeluar,
    };
  });
}

// Users
export async function getUsers() {
  return prisma.user.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

// Stats
export async function getDashboardStats() {
  const [totalItems, totalUsers] = await Promise.all([
    prisma.item.count({ where: { aktif: true } }),
    prisma.user.count(),
  ]);
  return { totalItems, totalUsers };
}

// Role Permissions
export async function getRolePermissions() {
  const rows = await prisma.rolePermission.findMany();
  const map: Record<string, string[]> = {};
  for (const row of rows) {
    try { map[row.role] = JSON.parse(row.permissions) as string[]; } catch { map[row.role] = []; }
  }
  return map;
}

export async function upsertRolePermission(role: string, permissions: string[]) {
  return prisma.rolePermission.upsert({
    where: { role },
    create: { role, permissions: JSON.stringify(permissions) },
    update: { permissions: JSON.stringify(permissions) },
  });
}

export async function bulkUpsertRolePermissions(entries: { role: string; permissions: string[] }[]) {
  for (const e of entries) {
    await upsertRolePermission(e.role, e.permissions);
  }
  return getRolePermissions();
}

// Custom Roles
export async function getCustomRoles() {
  return prisma.customRole.findMany({ orderBy: { name: "asc" } });
}

export async function createCustomRole(name: string, description?: string) {
  return prisma.customRole.create({ data: { name, description } });
}

export async function updateCustomRole(id: string, data: { name?: string; description?: string }) {
  return prisma.customRole.update({ where: { id }, data });
}

export async function deleteCustomRole(id: string) {
  const role = await prisma.customRole.findUnique({ where: { id }, select: { name: true } });
  if (role) {
    await prisma.rolePermission.deleteMany({ where: { role: role.name } });
  }
  await prisma.customRole.delete({ where: { id } });
}

export async function getRolesAndPermissions(): Promise<{ roles: { id: string | null; name: string; description: string | null; userCount: number }[]; permissions: Record<string, string[]> }> {
  const [customRoles, permissions, userCounts] = await Promise.all([
    getCustomRoles(),
    getRolePermissions(),
    prisma.user.groupBy({
      by: ["role"],
      _count: { role: true },
    }),
  ]);

  const countMap: Record<string, number> = {};
  for (const row of userCounts) {
    countMap[row.role] = row._count.role;
  }

  const allRoleNames = new Set<string>();
  for (const r of ["ADMIN", "KEPALA_GUDANG", "KORLAP", "AKUNTAN"]) allRoleNames.add(r);
  for (const cr of customRoles) allRoleNames.add(cr.name);
  for (const key of Object.keys(permissions)) allRoleNames.add(key);
  for (const key of Object.keys(countMap)) allRoleNames.add(key);

  const descMap = new Map<string, string | null>(customRoles.map((cr) => [cr.name, cr.description]));
  const idMap = new Map<string, string>(customRoles.map((cr) => [cr.name, cr.id]));

  const roles = [...allRoleNames].map((name) => ({
    id: idMap.get(name) || null,
    name,
    description: descMap.get(name) || null,
    userCount: countMap[name] || 0,
  }));

  roles.sort((a, b) => {
    const order = ["ADMIN", "KEPALA_GUDANG", "KORLAP", "AKUNTAN"];
    const ai = order.indexOf(a.name);
    const bi = order.indexOf(b.name);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  return { roles, permissions };
}
