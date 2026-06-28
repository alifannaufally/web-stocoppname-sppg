"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, Database, RefreshCw, AlertTriangle, CheckCircle, Calendar } from "lucide-react";

export function SettingsClient() {
  const [stats, setStats] = useState<{
    totalEntries: number;
    oldestDate: string | null;
    dari: string;
    sampai: string;
    toBeDeleted: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  function today() { return new Date().toISOString().split("T")[0]; }
  function daysAgo(n: number) {
    const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split("T")[0];
  }

  useEffect(() => {
    setDari(daysAgo(14));
    setSampai(today());
  }, []);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const params = dari && sampai ? `?dari=${dari}&sampai=${sampai}` : "";
      const res = await fetch(`/api/cleanup${params}`);
      const json = await res.json();
      setStats(json.data);
      if (dari && sampai) setPreviewCount(json.data?.toBeDeleted ?? 0);
    } catch {
      setStats(null);
    }
    setLoading(false);
  }, [dari, sampai]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  async function previewDelete() {
    if (!dari || !sampai) return;
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/cleanup?dari=${dari}&sampai=${sampai}`);
      const json = await res.json();
      setPreviewCount(json.data?.toBeDeleted ?? 0);
    } catch {
      setPreviewCount(null);
    }
    setPreviewLoading(false);
  }

  async function handleCleanup() {
    setCleaning(true);
    setResult(null);
    try {
      const params = dari && sampai ? `?dari=${dari}&sampai=${sampai}` : "";
      const res = await fetch(`/api/cleanup${params}`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setResult({ type: "success", text: json.data.message });
        fetchStats();
      } else {
        setResult({ type: "error", text: json.error || "Gagal" });
      }
    } catch {
      setResult({ type: "error", text: "Gagal menjalankan cleanup" });
    }
    setCleaning(false);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#092F54]">Pengaturan</h1>
        <p className="mt-1 text-sm text-gray-500">Pengaturan sistem & pemeliharaan database</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-[#F3C623]" />
            <div>
              <CardTitle className="text-lg">Pembersihan Database</CardTitle>
              <CardDescription>
                Hapus data opname lama secara manual untuk menjaga performa database
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Date range selector */}
          <div className="rounded-lg border bg-gray-50 p-4">
            <p className="mb-3 text-sm font-medium text-gray-700">Pilih Rentang Tanggal</p>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Dari</label>
                <input type="date" value={dari} onChange={(e) => { setDari(e.target.value); setPreviewCount(null); }}
                  className="h-9 rounded-md border border-input bg-white px-3 text-sm shadow-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Sampai</label>
                <input type="date" value={sampai} onChange={(e) => { setSampai(e.target.value); setPreviewCount(null); }}
                  className="h-9 rounded-md border border-input bg-white px-3 text-sm shadow-sm" />
              </div>
              <Button size="sm" variant="outline" className="gap-1" onClick={previewDelete} disabled={previewLoading}>
                {previewLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Calendar className="h-3 w-3" />}
                Cek Data
              </Button>
            </div>

            {previewCount !== null && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="text-gray-500">Akan dihapus:</span>
                <span className="font-bold text-red-500">{previewCount} entri</span>
                <span className="text-gray-400">dari {dari} — {sampai}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          {loading ? (
            <div className="flex items-center gap-2 py-2 text-sm text-gray-400">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Memuat statistik...
            </div>
          ) : stats ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-gray-500">Total Entri</p>
                <p className="text-2xl font-bold text-[#092F54]">{stats.totalEntries}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-gray-500">Data Tertua</p>
                <p className="text-2xl font-bold text-[#092F54]">{stats.oldestDate || "—"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-gray-500">Akan Dihapus</p>
                <p className="text-2xl font-bold text-red-500">{previewCount ?? stats.toBeDeleted}</p>
                <p className="text-xs text-gray-400">{dari} — {sampai}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-gray-500">Sisa Setelah Cleanup</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalEntries - (previewCount ?? stats.toBeDeleted)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Tidak dapat memuat statistik</p>
          )}

          {result && (
            <div className={`rounded-lg border px-4 py-3 text-sm flex items-center gap-2 ${
              result.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
            }`}>
              {result.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              {result.text}
            </div>
          )}

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" className="gap-2" disabled={!dari || !sampai}>
                <Trash2 className="h-4 w-4" />
                Hapus Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-[#092F54]">Konfirmasi Hapus Data</DialogTitle>
                <DialogDescription className="pt-2 space-y-3">
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <span>Hapus <strong>{previewCount ?? 0} entri opname</strong> dari <strong>{dari}</strong> hingga <strong>{sampai}</strong>? Data & gambar tidak bisa dikembalikan.</span>
                  </div>
                  <Button onClick={handleCleanup} disabled={cleaning} variant="destructive" className="w-full gap-2">
                    {cleaning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    {cleaning ? "Menghapus..." : `Hapus ${previewCount ?? 0} Entri`}
                  </Button>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
