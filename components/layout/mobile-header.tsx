"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IsoType } from "../logo/isotype";
import { LogoType } from "../logo/logotype";

export function MobileHeader({ userName }: { userName: string }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-between border-b bg-sidebar px-4 md:hidden">
      <div className="flex items-center gap-2">
        <IsoType className="size-8 shrink-0" />
        <LogoType className="h-5 w-auto" />
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {userName}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Cerrar sesión"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}
