"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown, FileSpreadsheet, FileArchive, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

type Mode = "harian" | "periode";
type GudangType = "BASAH" | "KERING";

interface HarianItem {
  id: string;
  no: number;
  nama: string;
  satuan: string;
  jenis: string;
  stokAwal: number;
  masuk: number;
  keluar: number;
  totalAkhir: number;
  catatan?: string;
}

interface PeriodeSheet {
  tanggal: string;
  items: HarianItem[];
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayString(): string {
  return formatDate(new Date());
}

function twoWeeksAgoString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 14);
  return formatDate(d);
}

function formatDateID(dateStr: string) {
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function TableHarian({ data }: { data: HarianItem[] | null }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-gray-400">
        <AlertTriangle className="mb-2 h-8 w-8" />
        <p className="text-sm">Tidak ada data untuk tanggal ini</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase text-gray-500">
            <th className="pb-3 pr-2 font-medium w-10 text-center">No</th>
            <th className="pb-3 pr-3 font-medium">Nama</th>
            <th className="pb-3 pr-3 font-medium w-16">Satuan</th>
            <th className="pb-3 pr-3 font-medium text-right">Stok Awal Hari</th>
            <th className="pb-3 pr-3 font-medium text-right">Total Masuk</th>
            <th className="pb-3 pr-3 font-medium text-right">Total Keluar</th>
            <th className="pb-3 pr-3 font-medium text-right">Total Akhir</th>
            <th className="pb-3 font-medium">Gambar</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id} className="border-b last:border-0">
              <td className="py-3 pr-2 text-center text-gray-600">{item.no}</td>
              <td className="py-3 pr-3 font-medium">{item.nama}</td>
              <td className="py-3 pr-3 text-gray-600">{item.satuan}</td>
              <td className="py-3 pr-3 text-right font-mono">{item.stokAwal}</td>
              <td className="py-3 pr-3 text-right font-mono">{item.masuk}</td>
              <td className="py-3 pr-3 text-right font-mono">{item.keluar}</td>
              <td className="py-3 pr-3 text-right font-mono font-semibold">{item.totalAkhir}</td>
              <td className="py-3">
                {item.catatan?.startsWith("http") ? (
                  <a href={item.catatan} target="_blank" rel="noopener noreferrer">
                    <img src={item.catatan} alt="Gambar" className="h-10 w-10 rounded-md object-cover border hover:opacity-80 transition-opacity" />
                  </a>
                ) : (
                  <span className="text-gray-500">{"—"}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LaporanClient() {
  const [mode, setMode] = useState<Mode>("harian");
  const [gudangType, setGudangType] = useState<GudangType>("BASAH");
  const [tanggal, setTanggal] = useState(todayString);
  const [dari, setDari] = useState(twoWeeksAgoString);
  const [sampai, setSampai] = useState(todayString);
  const [harianData, setHarianData] = useState<HarianItem[] | null>(null);
  const [periodeSheets, setPeriodeSheets] = useState<PeriodeSheet[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchHarian = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/laporan/harian?tanggal=${tanggal}`);
      if (res.ok) {
        const json = await res.json();
        setHarianData(json.data ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [tanggal]);

  const fetchPeriode = useCallback(async () => {
    setLoading(true);
    setActiveSheet(0);
    try {
      const res = await fetch(`/api/laporan/periode-harian?dari=${dari}&sampai=${sampai}`);
      if (res.ok) {
        const json = await res.json();
        setPeriodeSheets(json.data ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [dari, sampai]);

  useEffect(() => {
    if (mode === "harian") fetchHarian();
    else fetchPeriode();
  }, [mode, fetchHarian, fetchPeriode]);

  function downloadExport(format: string) {
    const params = mode === "harian"
      ? `mode=harian&tanggal=${tanggal}`
      : `mode=periode-harian&dari=${dari}&sampai=${sampai}`;
    const endpoint = format === "csv" ? "ekspor" : "ekspor-xlsx";
    const suffix = format !== "csv" ? `&format=${format}` : "";
    const a = document.createElement("a");
    a.href = `/api/laporan/${endpoint}?${params}${suffix}`;
    a.click();
  }

  const filteredHarian = harianData
    ? harianData.filter((i) => i.jenis === gudangType)
    : null;

  const filteredPeriodeSheets = periodeSheets
    .map((sheet) => ({
      ...sheet,
      items: sheet.items.filter((i) => i.jenis === gudangType),
    }))
    .filter((sheet) => sheet.items.length > 0);

  const currentSheet = filteredPeriodeSheets[activeSheet];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#092F54]">Laporan</h1>
        <p className="mt-1 text-sm text-gray-500">Lihat laporan stok gudang basah</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex rounded-lg border p-0.5 bg-gray-100">
              <button onClick={() => setMode("harian")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  mode === "harian" ? "bg-white text-[#092F54] shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}>Per Hari</button>
              <button onClick={() => setMode("periode")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  mode === "periode" ? "bg-white text-[#092F54] shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}>Per Periode (2 minggu)</button>
            </div>

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

            <div className="flex flex-wrap items-center gap-3 ml-auto">
              {mode === "harian" ? (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Tanggal</label>
                  <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)}
                    className="h-9 rounded-md border border-input bg-white px-3 text-sm shadow-sm" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Dari</label>
                    <input type="date" value={dari} onChange={(e) => setDari(e.target.value)}
                      className="h-9 rounded-md border border-input bg-white px-3 text-sm shadow-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Sampai</label>
                    <input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)}
                      className="h-9 rounded-md border border-input bg-white px-3 text-sm shadow-sm" />
                  </div>
                </>
              )}
              <div className="flex gap-1">
                <Button variant="default" size="sm" className="gap-1" onClick={() => downloadExport("csv")}>
                  <FileDown className="h-4 w-4" />
                  CSV
                </Button>
                <Button variant="secondary" size="sm" className="gap-1" onClick={() => downloadExport("xlsx")}>
                  <FileSpreadsheet className="h-4 w-4" />
                  XLSX
                </Button>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => downloadExport("zip")}>
                  <FileArchive className="h-4 w-4" />
                  ZIP
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {mode === "harian"
              ? `Laporan Harian — ${formatDateID(tanggal)}`
              : `Laporan Periode — ${dari} s/d ${sampai}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#F3C623] border-t-transparent" />
              <span className="ml-3 text-sm text-gray-500">Memuat data...</span>
            </div>
          ) : mode === "harian" ? (
            <TableHarian data={filteredHarian} />
          ) : filteredPeriodeSheets.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <AlertTriangle className="mb-2 h-8 w-8" />
              <p className="text-sm">Tidak ada data untuk periode ini</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Sheet tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b">
                <button onClick={() => setActiveSheet(Math.max(0, activeSheet - 1))}
                  disabled={activeSheet === 0}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30">
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {filteredPeriodeSheets.map((sheet, i) => (
                  <button key={sheet.tanggal} onClick={() => setActiveSheet(i)}
                    className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      i === activeSheet
                        ? "bg-[#092F54] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}>
                    {formatDateID(sheet.tanggal).split(",")[0]}
                  </button>
                ))}

                <button onClick={() => setActiveSheet(Math.min(filteredPeriodeSheets.length - 1, activeSheet + 1))}
                  disabled={activeSheet === filteredPeriodeSheets.length - 1}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Active sheet */}
              <div>
                <p className="mb-3 text-sm font-medium text-gray-600">
                  Sheet: <span className="text-[#092F54]">{formatDateID(currentSheet.tanggal)}</span>
                  <span className="ml-2 text-xs text-gray-400">({activeSheet + 1} / {filteredPeriodeSheets.length})</span>
                </p>
                <TableHarian data={currentSheet.items} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
