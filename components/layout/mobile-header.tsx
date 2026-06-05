"use client";

import { IsoType } from "../logo/isotype";
import { LogoType } from "../logo/logotype";
import { UserMenu } from "@/components/layout/user-menu";

export function MobileHeader({ userName, userEmail }: { userName: string; userEmail: string }) {
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
        <UserMenu position="header" userName={userName} userEmail={userEmail} />
      </div>
    </header>
  );
}
