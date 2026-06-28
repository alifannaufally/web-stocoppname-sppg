"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
  PERMISSION_DESCRIPTIONS,
} from "@/lib/permissions";
import {
  Shield,
  ShieldCheck,
  Loader2,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

export interface Role {
  id: string | null;
  name: string;
  description: string | null;
  userCount: number;
}

const DEFAULT_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  ADMIN: { bg: "bg-[#F3C623]/10", text: "text-[#F3C623]", border: "border-[#F3C623]/30" },
  KEPALA_GUDANG: { bg: "bg-[#092F54]/10", text: "text-[#092F54]", border: "border-[#092F54]/30" },
  KORLAP: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-300" },
  AKUNTAN: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
};

const FALLBACK_BADGE = { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" };

function formatRoleName(name: string) {
  return name.replace(/_/g, " ");
}

function RoleBadge({ name }: { name: string }) {
  const s = DEFAULT_BADGE[name] || FALLBACK_BADGE;
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${s.bg} ${s.text} ${s.border}`}
    >
      {formatRoleName(name)}
    </span>
  );
}

function Toggle({ enabled, loading }: { enabled: boolean; loading: boolean }) {
  return (
    <span
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ${
        loading ? "opacity-50" : ""
      } ${enabled ? "bg-[#F3C623]" : "bg-gray-200"}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </span>
  );
}

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  initialDescription?: string;
  onSubmit: (name: string, description: string) => Promise<void>;
  title: string;
  description: string;
  submitLabel: string;
}

function RoleDialog({ open, onOpenChange, initialName = "", initialDescription = "", onSubmit, title, description, submitLabel }: RoleDialogProps) {
  const [name, setName] = useState(initialName);
  const [desc, setDesc] = useState(initialDescription);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(name.trim(), desc.trim());
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="role-name" className="block text-sm font-medium text-gray-700 mb-1">
              Nama Role
            </label>
            <input
              id="role-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#F3C623] focus:outline-none focus:ring-1 focus:ring-[#F3C623]"
              placeholder="Misal: SUPERVISOR"
              required
              disabled={!!initialName}
            />
          </div>
          <div>
            <label htmlFor="role-desc" className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi
            </label>
            <textarea
              id="role-desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#F3C623] focus:outline-none focus:ring-1 focus:ring-[#F3C623]"
              placeholder="Deskripsi role..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
            </DialogClose>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#092F54] px-4 py-2 text-sm text-white hover:bg-[#092F54]/90 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitLabel}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleName: string;
  userCount: number;
  onConfirm: () => Promise<void>;
}

function DeleteConfirmDialog({ open, onOpenChange, roleName, userCount, onConfirm }: DeleteConfirmProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus Role</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus role <strong>{formatRoleName(roleName)}</strong>?
            {userCount > 0 && (
              <span className="block mt-2 text-red-600">
                Terdapat {userCount} pengguna dengan role ini. Hapus role ini juga akan menghapus data hak aksesnya.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3 pt-2">
          <DialogClose asChild>
            <button
              type="button"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
          </DialogClose>
          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Hapus
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RolesClient({ initialData }: { initialData: { roles: Role[]; permissions: Record<string, string[]> } }) {
  const [roles, setRoles] = useState<Role[]>(initialData.roles);
  const [permissions, setPermissions] = useState<Record<string, string[]>>(initialData.permissions);
  const [selectedRole, setSelectedRole] = useState<string>(roles[0]?.name || "");
  const [savingRole, setSavingRole] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);

  function flashMessage(setter: typeof setSuccessMsg, msg: string, duration = 3000) {
    setter(msg);
    setTimeout(() => setter(""), duration);
  }

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch("/api/roles");
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setRoles(json.data.roles || []);
          setPermissions((prev) => ({ ...prev, ...json.data.permissions }));
        }
      }
    } catch {
      // keep current
    }
  }, []);

  async function addRole(name: string, description: string) {
    const res = await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Gagal menambah role");
    }
    await fetchRoles();
    flashMessage(setSuccessMsg, `Role ${formatRoleName(name)} berhasil ditambahkan`);
  }

  async function editRoleSubmit(name: string, description: string) {
    if (!editRole?.id) {
      setError("Role bawaan tidak bisa diedit, hanya bisa diubah permissionnya.");
      return;
    }
    const res = await fetch("/api/roles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editRole.id, description }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Gagal mengupdate role");
    }
    await fetchRoles();
    flashMessage(setSuccessMsg, `Role ${formatRoleName(name)} berhasil diperbarui`);
  }

  async function deleteRoleSubmit() {
    if (!deleteRole?.id) {
      setError("Role bawaan tidak bisa dihapus.");
      return;
    }
    const res = await fetch(`/api/roles?id=${deleteRole.id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Gagal menghapus role");
    }
    await fetchRoles();
    if (selectedRole === deleteRole.name) {
      setSelectedRole("");
    }
    flashMessage(setSuccessMsg, `Role ${formatRoleName(deleteRole.name)} berhasil dihapus`);
  }

  async function togglePermission(role: string, permission: string) {
    const current = permissions[role] || [];
    const updated = current.includes(permission)
      ? current.filter((p: string) => p !== permission)
      : [...current, permission];

    setPermissions((prev) => ({ ...prev, [role]: updated }));
    setSavingRole(role);

    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, permissions: updated }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      flashMessage(setSuccessMsg, `Hak akses ${formatRoleName(role)} berhasil diperbarui`);
    } catch {
      setPermissions((prev) => ({ ...prev, [role]: current }));
      flashMessage(setError, "Gagal menyimpan perubahan");
    } finally {
      setSavingRole(null);
    }
  }

  const currentRole = selectedRole;
  const rolePerms = permissions[currentRole] || [];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#092F54]">Role &amp; Hak Akses</h1>
          <p className="mt-1 text-sm text-gray-500">
            Kelola role pengguna dan izin akses
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <button className="inline-flex items-center gap-2 rounded-lg bg-[#092F54] px-4 py-2 text-sm text-white hover:bg-[#092F54]/90">
              <Plus className="h-4 w-4" />
              Tambah Role
            </button>
          </DialogTrigger>
          <RoleDialog
            open={addOpen}
            onOpenChange={setAddOpen}
            onSubmit={addRole}
            title="Tambah Role Baru"
            description="Buat role kustom dengan nama dan deskripsi."
            submitLabel="Simpan"
          />
        </Dialog>
      </div>

      {successMsg && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => {
          const isSelected = selectedRole === role.name;
          return (
            <Card
              key={role.name}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? "ring-2 ring-[#F3C623]" : ""
              }`}
              onClick={() => setSelectedRole(role.name)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {role.name === "ADMIN" ? (
                      <ShieldCheck className="h-5 w-5 text-[#F3C623]" />
                    ) : (
                      <Shield className="h-5 w-5 text-[#092F54]" />
                    )}
                    <CardTitle className="text-base">{formatRoleName(role.name)}</CardTitle>
                  </div>
                  <RoleBadge name={role.name} />
                </div>
                {role.description && (
                  <CardDescription className="mt-1">{role.description}</CardDescription>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  {role.userCount} pengguna
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setEditRole(role)}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                    disabled={!role.id}
                    title={!role.id ? "Role bawaan tidak bisa diedit" : "Edit role"}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteRole(role)}
                    className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50"
                    disabled={!role.id}
                    title={!role.id ? "Role bawaan tidak bisa dihapus" : "Hapus role"}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Hapus
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {editRole && (
        <RoleDialog
          open={!!editRole}
          onOpenChange={(open) => { if (!open) setEditRole(null); }}
          initialName={editRole.name}
          initialDescription={editRole.description || ""}
          onSubmit={editRoleSubmit}
          title={`Edit Role: ${formatRoleName(editRole.name)}`}
          description="Ubah deskripsi role. Nama role tidak bisa diubah."
          submitLabel="Simpan"
        />
      )}

      {deleteRole && (
        <DeleteConfirmDialog
          open={!!deleteRole}
          onOpenChange={(open) => { if (!open) setDeleteRole(null); }}
          roleName={deleteRole.name}
          userCount={deleteRole.userCount}
          onConfirm={deleteRoleSubmit}
        />
      )}

      {currentRole && (
        <div>
          <h2 className="text-xl font-semibold text-[#092F54] mb-1">
            Hak Akses — {formatRoleName(currentRole)}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Atur izin akses untuk role ini. Perubahan akan tersimpan otomatis.
          </p>
          <Card>
            <CardContent className="space-y-1 pt-6">
              {ALL_PERMISSIONS.map((perm) => {
                const enabled = rolePerms.includes(perm);
                const isSaving = savingRole === currentRole;
                return (
                  <button
                    key={perm}
                    type="button"
                    disabled={isSaving}
                    onClick={() => togglePermission(currentRole, perm)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed ${
                      enabled ? "bg-[#F3C623]/5" : ""
                    }`}
                  >
                    <div className="flex-1 pr-4">
                      <p className={`font-medium ${enabled ? "text-gray-900" : "text-gray-400"}`}>
                        {PERMISSION_LABELS[perm]}
                      </p>
                      <p className={`text-xs ${enabled ? "text-gray-500" : "text-gray-300"}`}>
                        {PERMISSION_DESCRIPTIONS[perm]}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {isSaving ? (
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      ) : (
                        <Toggle enabled={enabled} loading={false} />
                      )}
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
