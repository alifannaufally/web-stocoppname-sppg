"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react";

interface Item {
  id: string;
  no: number;
  nama: string;
  satuan: string;
  jenis: string;
  stokAwal: number;
  aktif: boolean;
}

const satuanOptions = ["Kg", "Pcs", "Ikat", "Pack", "Papan", "Liter", "Box", "Sak", "Karung", "Botol"];

type JenisFilter = "SEMUA" | "BASAH" | "KERING";

export function KomoditasClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [jenisFilter, setJenisFilter] = useState<JenisFilter>("SEMUA");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ no: "", nama: "", satuan: "Kg", jenis: "BASAH" });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ all: "true" });
      if (search) params.set("q", search);
      if (jenisFilter !== "SEMUA") params.set("jenis", jenisFilter);
      const res = await fetch(`/api/items?${params}`);
      const json = await res.json();
      if (json.data) setItems(json.data);
    } catch {
      setError("Gagal memuat data");
    }
    setLoading(false);
  }, [search, jenisFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  function resetForm() {
    setForm({ no: "", nama: "", satuan: "Kg", jenis: "BASAH" });
    setEditItem(null);
    setError("");
  }

  function handleEdit(item: Item) {
    setEditItem(item);
    setForm({ no: String(item.no), nama: item.nama, satuan: item.satuan, jenis: item.jenis });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const body = editItem
      ? { id: editItem.id, no: Number(form.no), nama: form.nama, satuan: form.satuan, jenis: form.jenis }
      : { no: Number(form.no), nama: form.nama, satuan: form.satuan, jenis: form.jenis };

    const res = await fetch("/api/items", {
      method: editItem ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Gagal menyimpan");
      setSaving(false);
      return;
    }

    setDialogOpen(false);
    resetForm();
    setSuccess(editItem ? "Komoditas berhasil diubah" : "Komoditas berhasil ditambahkan");
    setTimeout(() => setSuccess(""), 3000);
    fetchItems();
    setSaving(false);
  }

  async function handleDelete(item: Item) {
    if (!confirm(`Hapus "${item.nama}"? Data opname terkait akan ikut terhapus.`)) return;
    const res = await fetch(`/api/items?id=${item.id}`, { method: "DELETE" });
    if (res.ok) {
      setSuccess("Komoditas berhasil dihapus");
      setTimeout(() => setSuccess(""), 3000);
      fetchItems();
    }
  }

  async function handleToggleAktif(item: Item) {
    const res = await fetch("/api/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, aktif: !item.aktif }),
    });
    if (res.ok) fetchItems();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#092F54]">Manajemen Komoditas</h1>
          <p className="mt-1 text-sm text-gray-500">Kelola daftar komoditas gudang</p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(v) => {
            setDialogOpen(v);
            if (!v) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah Komoditas
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editItem ? "Edit Komoditas" : "Tambah Komoditas"}</DialogTitle>
              <DialogDescription>
                {editItem ? "Ubah data komoditas yang sudah ada" : "Tambah komoditas baru ke daftar"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="no">Nomor Urut</Label>
                <Input
                  id="no" type="number"
                  value={form.no}
                  onChange={(e) => setForm({ ...form, no: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Komoditas</Label>
                <Input
                  id="nama"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="satuan">Satuan</Label>
                <Select value={form.satuan} onValueChange={(v) => setForm({ ...form, satuan: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {satuanOptions.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jenis">Jenis</Label>
                <Select value={form.jenis} onValueChange={(v) => setForm({ ...form, jenis: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BASAH">Basah</SelectItem>
                    <SelectItem value="KERING">Kering</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Menyimpan..." : editItem ? "Simpan Perubahan" : "Tambah Komoditas"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Daftar Komoditas</CardTitle>
            <div className="flex items-center gap-3">
              <div className="flex rounded-lg border p-0.5 bg-gray-100">
                {(["SEMUA", "BASAH", "KERING"] as const).map((f) => (
                  <button key={f} onClick={() => setJenisFilter(f)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      jenisFilter === f ? "bg-white text-[#092F54] shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}>
                    {f === "SEMUA" ? "Semua" : f === "BASAH" ? "Basah" : "Kering"}
                  </button>
                ))}
              </div>
              <div className="relative w-48">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Cari komoditas..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#F3C623] border-t-transparent mr-2" />
              Memuat data...
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Package className="mb-2 h-12 w-12" />
              <p>Belum ada komoditas</p>
              <p className="text-sm">Klik "Tambah Komoditas" untuk menambahkan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-gray-500">
                    <th className="pb-3 pr-4 font-medium w-16">No</th>
                    <th className="pb-3 pr-4 font-medium">Nama</th>
                    <th className="pb-3 pr-4 font-medium w-20">Satuan</th>
                    <th className="pb-3 pr-4 font-medium w-20">Jenis</th>
                    <th className="pb-3 pr-4 font-medium w-20">Status</th>
                    <th className="pb-3 font-medium w-32">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 pr-4 font-mono text-gray-500">{item.no}</td>
                      <td className={`py-3 pr-4 font-medium ${!item.aktif ? "text-gray-400 line-through" : ""}`}>
                        {item.nama}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{item.satuan}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline" className={item.jenis === "BASAH" ? "text-blue-600 border-blue-200 bg-blue-50" : "text-amber-600 border-amber-200 bg-amber-50"}>
                          {item.jenis === "BASAH" ? "Basah" : "Kering"}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <button
                          onClick={() => handleToggleAktif(item)}
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            item.aktif
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          {item.aktif ? "Aktif" : "Nonaktif"}
                        </button>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(item)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
