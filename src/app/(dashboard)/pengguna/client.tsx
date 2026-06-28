"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, ShieldCheck, ShieldAlert, Eye, Pencil, Trash2, KeyRound } from "lucide-react";

const roleColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ADMIN: "default",
  KEPALA_GUDANG: "secondary",
  KORLAP: "outline",
  AKUNTAN: "destructive",
};

const roleDescriptions: Record<string, string> = {
  ADMIN: "Akses penuh — kelola pengguna & semua data",
  KEPALA_GUDANG: "Input stok & lihat laporan",
  KORLAP: "Input stok & lihat laporan",
  AKUNTAN: "Read-only — hanya laporan",
};

interface UserData {
  id: string;
  email: string;
  nama: string;
  role: string;
  createdAt: string;
}

export function UserManagementClient({ users: initialUsers }: { users: UserData[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState("");
  const [form, setForm] = useState({
    email: "",
    nama: "",
    password: "",
    role: "KORLAP",
  });

  function resetForm() {
    setForm({ email: "", nama: "", password: "", role: "KORLAP" });
    setEditUser(null);
    setError("");
  }

  function handleEdit(user: UserData) {
    setEditUser(user);
    setForm({ email: user.email, nama: user.nama, password: "", role: user.role });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/users", {
      method: editUser ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editUser?.id,
        ...form,
        ...(editUser && !form.password ? { password: undefined } : {}),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Terjadi kesalahan");
      setLoading(false);
      return;
    }

    setOpen(false);
    resetForm();
    router.refresh();
    setLoading(false);
  }

  async function handleResetPassword() {
    if (!resetUserId) return;
    setLoading(true);
    setResetMessage("");

    const res = await fetch("/api/users/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: resetUserId }),
    });

    const data = await res.json();

    if (res.ok) {
      setResetMessage("Password direset ke dapur123");
    } else {
      setResetMessage(data.error || "Gagal mereset password");
    }

    setLoading(false);
    setTimeout(() => {
      setResetUserId(null);
      setResetMessage("");
    }, 3000);
  }

  async function handleDelete(userId: string) {
    if (!confirm("Hapus pengguna ini?")) return;

    const res = await fetch(`/api/users?id=${userId}`, { method: "DELETE" });

    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      router.refresh();
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#092F54]">Manajemen Pengguna</h1>
          <p className="mt-1 text-sm text-gray-500">Kelola pengguna & hak akses</p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah Pengguna
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editUser ? "Edit Pengguna" : "Tambah Pengguna"}</DialogTitle>
              <DialogDescription>
                {editUser ? "Ubah data pengguna yang sudah ada" : "Buat akun baru untuk pengguna"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama</Label>
                <Input
                  id="nama"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password {editUser && "(kosongkan jika tidak diubah)"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editUser}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm({ ...form, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KORLAP">Korlap</SelectItem>
                    <SelectItem value="KEPALA_GUDANG">Kepala Gudang</SelectItem>
                    <SelectItem value="AKUNTAN">Akuntan</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Menyimpan..." : editUser ? "Simpan Perubahan" : "Tambah Pengguna"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {(["ADMIN", "KEPALA_GUDANG", "KORLAP", "AKUNTAN"] as const).map((role) => (
          <Card key={role}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                {role === "ADMIN" ? (
                  <ShieldCheck className="h-4 w-4 text-[#F3C623]" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-[#092F54]" />
                )}
                <CardTitle className="text-sm">{role.replace("_", " ")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">{roleDescriptions[role]}</p>
              <p className="mt-2 text-2xl font-bold text-[#092F54]">
                {users.filter((u) => u.role === role).length}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Pengguna</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-gray-500">
                  <th className="pb-3 pr-4 font-medium">Nama</th>
                  <th className="pb-3 pr-4 font-medium">Email</th>
                  <th className="pb-3 pr-4 font-medium">Role</th>
                  <th className="pb-3 pr-4 font-medium">Bergabung</th>
                  <th className="pb-3 pr-4 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{u.nama}</td>
                    <td className="py-3 pr-4 text-gray-600">{u.email}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={roleColors[u.role] || "outline"}>
                        {u.role.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(u)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setResetUserId(u.id)}
                        >
                          <KeyRound className="h-4 w-4 text-[#F3C623]" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(u.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Dialog
        open={!!resetUserId}
        onOpenChange={(v) => {
          if (!v) {
            setResetUserId(null);
            setResetMessage("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Password pengguna akan direset menjadi <strong>dapur123</strong>. Lanjutkan?
            </DialogDescription>
          </DialogHeader>
          {resetMessage ? (
            <p className="text-sm text-green-500">{resetMessage}</p>
          ) : (
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setResetUserId(null)}>
                Batal
              </Button>
              <Button onClick={handleResetPassword} disabled={loading}>
                {loading ? "Mereset..." : "Ya, Reset"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
