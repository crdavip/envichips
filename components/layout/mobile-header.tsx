"use client";

import { LogOut } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IsoType } from "../logo/isotype";
import { LogoType } from "../logo/logotype";
import { logoutAction } from "@/lib/actions";

export function MobileHeader({ userName }: { userName: string }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-between border-b bg-sidebar px-4 md:hidden">
      <div className="flex items-center gap-1.5">
        <IsoType className="size-10 shrink-0" />
        <LogoType className="h-7 w-auto" />
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {userName}
        </span>
        <form action={logoutAction}>
          <button
            type="submit"
            className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
            title="Cerrar sesión"
          >
            <LogOut className="size-4" />
          </button>
        </form>
      </div>
    </header>
  );
}
