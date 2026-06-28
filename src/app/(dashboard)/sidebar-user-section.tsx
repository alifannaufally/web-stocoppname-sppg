"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, KeyRound } from "lucide-react";
import { ChangePasswordDialog } from "@/components/change-password-dialog";
import { handleLogout } from "./actions";
import type { UserData } from "./types";

export function SidebarUserSection({ user }: { user: UserData }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3C623] text-xs font-bold text-[#092F54]">
          {user.nama.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium">{user.nama}</p>
          <p className="text-xs text-white/60">{user.role.replace("_", " ")}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 text-white/70 hover:bg-white/10 hover:text-white mb-1"
        onClick={() => setOpen(true)}
      >
        <KeyRound className="h-4 w-4" />
        Ganti Sandi
      </Button>
      <form action={handleLogout}>
        <Button
          variant="ghost"
          type="submit"
          className="w-full justify-start gap-3 text-white/70 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </Button>
      </form>
      <ChangePasswordDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
