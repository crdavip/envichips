"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLinks } from "@/components/layout/nav-links";
import { IsoType } from "../logo/isotype";
import { LogoType } from "../logo/logotype";

export function Sidebar({ userName }: { userName: string }) {
  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-full w-64 flex-col border-r bg-sidebar md:flex">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <IsoType className="size-9 shrink-0" />
        <LogoType className="h-6 w-auto" />
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <NavLinks orientation="vertical" />
      </div>

      {/* User info + Logout */}
      <div className="border-t px-4 py-3">
        <p className="mb-2 truncate text-sm font-medium text-foreground">
          {userName}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}
