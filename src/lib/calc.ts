export function hitungStokSistem(stokAwalHari: number, masuk: number, keluar: number): number {
  if (stokAwalHari < 0) throw new Error("Stok awal tidak boleh negatif");
  if (masuk < 0) throw new Error("Masuk tidak boleh negatif");
  if (keluar < 0) throw new Error("Keluar tidak boleh negatif");
  return stokAwalHari + masuk - keluar;
}

export function hitungSelisih(stokFisik: number, stokSistem: number): number {
  return stokFisik - stokSistem;
}
