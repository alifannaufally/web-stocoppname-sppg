"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Loader2, Upload, X, ExternalLink, Check, Save } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface Item {
  id: string;
  no: string;
  nama: string;
  satuan: string;
}

interface EntryForm {
  masuk: number;
  keluar: number;
  catatan: string;
}

const defaultEntry: EntryForm = { masuk: 0, keluar: 0, catatan: "" };

function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [showSizeWarning, setShowSizeWarning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      alert("Hanya file PNG, JPEG, JPG yang diizinkan");
      return;
    }

    if (file.size > 1048576) {
      setShowSizeWarning(true);
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) {
        if (json.redirectUrl) window.open(json.redirectUrl, "_blank");
        throw new Error(json.error || "Gagal upload");
      }
      onChange(json.data.url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {value ? (
          <div className="relative group">
            <img src={value} alt="Gambar" className="h-10 w-10 rounded-md object-cover border" />
            <button type="button" onClick={() => onChange("")}
              className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" /> : <Upload className="h-4 w-4 text-gray-400" />}
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleFile} className="hidden" />
      </div>

      <Dialog open={showSizeWarning} onOpenChange={setShowSizeWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#092F54]">File Terlalu Besar</DialogTitle>
            <DialogDescription className="pt-2">
              <p className="mb-4">Ukuran file melebihi batas maksimal <strong>1 MB</strong>.</p>
              <a href="https://www.iloveimg.com/id/kompres-gambar" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[#F3C623] px-4 py-2.5 text-sm font-semibold text-[#092F54] hover:bg-[#F3C623]/90 transition-colors">
                <ExternalLink className="h-4 w-4" />
                Kompres Gambar di ILoveIMG
              </a>
              <p className="mt-3 text-xs text-gray-400">Setelah dikompres, upload ulang gambarnya.</p>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function InputHarianClient() {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [gudangType, setGudangType] = useState<"BASAH" | "KERING">("BASAH");
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState<Record<string, EntryForm>>({});
  const [stokAwalMap, setStokAwalMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [savingItems, setSavingItems] = useState<Record<string, "saving" | "done" | "error">>({});
  const [globalMsg, setGlobalMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const savingRef = useRef<Set<string>>(new Set());

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      });
    } catch { return dateStr; }
  }

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setGlobalMsg(null);
      try {
        const res = await fetch(`/api/input-data?tanggal=${date}&jenis=${gudangType}`);
        if (!res.ok) throw new Error("Gagal mengambil data");
        const json = await res.json();
        const { items: itemList, stokAwal: stokData, entries: entryList } = json.data || {};
        if (cancelled) return;

        setItems(itemList || []);
        const newStokAwal: Record<string, number> = {};
        if (stokData) for (const s of stokData) newStokAwal[s.id] = Number(s.stokAwalHari);

        const newForm: Record<string, EntryForm> = {};
        if (entryList) for (const entry of entryList)
          newForm[entry.itemId] = { masuk: entry.masuk, keluar: entry.keluar, catatan: entry.catatan || "" };

        if (cancelled) return;
        for (const item of itemList || []) {
          if (!newForm[item.id]) newForm[item.id] = { ...defaultEntry };
          if (newStokAwal[item.id] === undefined) newStokAwal[item.id] = 0;
        }
        setForm(newForm);
        setStokAwalMap(newStokAwal);
        setSavingItems({});
      } catch (err) {
        if (!cancelled) setGlobalMsg({ type: "error", text: err instanceof Error ? err.message : "Terjadi kesalahan" });
      } finally { if (!cancelled) setLoading(false); }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [date, gudangType]);

  function updateField(itemId: string, field: "masuk" | "keluar", raw: string) {
    const value = raw === "" ? 0 : parseFloat(raw) || 0;
    setForm((prev) => ({ ...prev, [itemId]: { ...(prev[itemId] || defaultEntry), [field]: value } }));
    if (savingItems[itemId]) {
      setSavingItems((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    }
  }

  function updateCatatan(itemId: string, url: string) {
    setForm((prev) => ({ ...prev, [itemId]: { ...(prev[itemId] || defaultEntry), catatan: url } }));
    if (savingItems[itemId]) {
      setSavingItems((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    }
  }

  function getRow(item: Item): EntryForm { return form[item.id] || defaultEntry; }
  function getStokAwal(itemId: string): number { return stokAwalMap[itemId] ?? 0; }
  function getTotalAkhir(itemId: string): number {
    const row = form[itemId];
    return row ? getStokAwal(itemId) + row.masuk - row.keluar : getStokAwal(itemId);
  }

  async function handleSaveItem(itemId: string) {
    if (savingRef.current.has(itemId)) return;
    savingRef.current.add(itemId);
    setSavingItems((prev) => ({ ...prev, [itemId]: "saving" }));
    const row = getRow(items.find((i) => i.id === itemId)!);
    try {
      const res = await fetch("/api/opname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal: date,
          entries: [{ itemId, masuk: row.masuk, keluar: row.keluar, stokFisik: 0, catatan: row.catatan || undefined }],
        }),
      });
      if (!res.ok) throw new Error("Gagal");
      setSavingItems((prev) => ({ ...prev, [itemId]: "done" }));
      setTimeout(() => {
        setSavingItems((prev) => {
          const next = { ...prev };
          if (next[itemId] === "done") delete next[itemId];
          return next;
        });
      }, 2000);
    } catch {
      setSavingItems((prev) => ({ ...prev, [itemId]: "error" }));
    } finally {
      savingRef.current.delete(itemId);
    }
  }

  const inputClass = "w-20 rounded-md border border-input bg-white px-2 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
  const readonlyClass = "w-20 rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm text-gray-600";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#092F54]">Input Harian</h1>
          <p className="mt-1 text-sm text-gray-500">Simpan data per baris — klik tombol simpan di masing-masing item</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border p-0.5 bg-gray-100">
            <button onClick={() => setGudangType("BASAH")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                gudangType === "BASAH" ? "bg-white text-[#092F54] shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>Gudang Basah</button>
            <button onClick={() => setGudangType("KERING")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                gudangType === "KERING" ? "bg-white text-[#092F54] shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>Gudang Kering</button>
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="flex h-9 w-48 rounded-md border border-input bg-white px-3 pl-10 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
          </div>
        </div>
      </div>

      {globalMsg && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${globalMsg.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {globalMsg.text}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Data Opname — {formatDate(date)}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-[#F3C623]" />
              <span className="ml-2 text-sm text-gray-500">Memuat data...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">Tidak ada item yang ditemukan</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-gray-500">
                    <th className="whitespace-nowrap pb-3 pr-2 font-medium text-center w-10">No</th>
                    <th className="whitespace-nowrap pb-3 pr-4 font-medium text-left">Nama</th>
                    <th className="whitespace-nowrap pb-3 pr-4 font-medium text-left w-16">Satuan</th>
                    <th className="whitespace-nowrap pb-3 px-2 font-medium text-center w-24">Stok Awal Hari</th>
                    <th className="whitespace-nowrap pb-3 px-2 font-medium text-center w-20">Total Masuk</th>
                    <th className="whitespace-nowrap pb-3 px-2 font-medium text-center w-20">Total Keluar</th>
                    <th className="whitespace-nowrap pb-3 px-2 font-medium text-center w-20">Total Akhir</th>
                    <th className="whitespace-nowrap pb-3 pl-3 font-medium text-left w-32">Gambar</th>
                    <th className="whitespace-nowrap pb-3 font-medium text-center w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const row = getRow(item);
                    const stokAwal = getStokAwal(item.id);
                    const totalAkhir = getTotalAkhir(item.id);
                    const status = savingItems[item.id];
                    return (
                      <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50/50">
                        <td className="whitespace-nowrap py-2 text-center text-gray-500">{item.no}</td>
                        <td className="whitespace-nowrap py-2 pr-4 font-medium text-[#092F54]">{item.nama}</td>
                        <td className="whitespace-nowrap py-2 pr-4 text-gray-500">{item.satuan}</td>
                        <td className="whitespace-nowrap py-2 px-2 text-center">
                          <input type="number" value={stokAwal} disabled className={readonlyClass} />
                        </td>
                        <td className="whitespace-nowrap py-2 px-2 text-center">
                          <input type="number" min="0" value={row.masuk || ""}
                            onChange={(e) => updateField(item.id, "masuk", e.target.value)}
                            className={inputClass} style={{ width: "5rem", textAlign: "center" }} />
                        </td>
                        <td className="whitespace-nowrap py-2 px-2 text-center">
                          <input type="number" min="0" value={row.keluar || ""}
                            onChange={(e) => updateField(item.id, "keluar", e.target.value)}
                            className={inputClass} style={{ width: "5rem", textAlign: "center" }} />
                        </td>
                        <td className="whitespace-nowrap py-2 px-2 text-center">
                          <input type="number" value={totalAkhir} disabled
                            className={`${readonlyClass} font-semibold text-[#092F54]`}
                            style={{ width: "5rem", textAlign: "center" }} />
                        </td>
                        <td className="whitespace-nowrap py-2 pl-3">
                          <ImageUpload
                            value={row.catatan}
                            onChange={(url) => updateCatatan(item.id, url)}
                          />
                        </td>
                        <td className="whitespace-nowrap py-2 text-center">
                          <button
                            onClick={() => handleSaveItem(item.id)}
                            disabled={status === "saving"}
                            className={`inline-flex items-center justify-center rounded-md p-2 transition-colors ${
                              status === "done"
                                ? "bg-green-100 text-green-600"
                                : status === "error"
                                  ? "bg-red-100 text-red-600"
                                  : "bg-[#F3C623] text-[#092F54] hover:bg-[#F3C623]/80"
                            }`}
                            title={status === "done" ? "Tersimpan" : status === "error" ? "Gagal" : "Simpan"}
                          >
                            {status === "saving" ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : status === "done" ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
