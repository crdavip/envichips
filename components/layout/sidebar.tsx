"use client";

import { ChevronLeft } from "lucide-react";
import { NavLinks } from "@/components/layout/nav-links";
import { UserMenu } from "@/components/layout/user-menu";
import { IsoType } from "../logo/isotype";
import { LogoType } from "../logo/logotype";
import { useSidebar } from "./sidebar-context";
import { cn } from "@/lib/utils";

export function Sidebar({ userName, userEmail }: { userName: string; userEmail: string }) {
  const { isCollapsed, toggle } = useSidebar();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 hidden h-full flex-col border-r bg-sidebar transition-all duration-300 md:flex",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center border-b py-3",
          isCollapsed ? "justify-center px-2" : "gap-1.5 px-4",
        )}
      >
        <IsoType className="size-10 shrink-0" />
        {!isCollapsed && <LogoType className="h-8 w-auto" />}
      </div>

      {/* Collapse toggle — floating on the right edge */}
      <button
        onClick={toggle}
        className={cn(
          "absolute top-3 z-40 flex size-7 items-center justify-center rounded-full border bg-sidebar text-muted-foreground shadow-xs transition-all duration-300 hover:bg-sidebar-accent hover:text-foreground cursor-pointer",
          isCollapsed ? "-right-5" : "-right-3",
        )}
        title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
      >
        <ChevronLeft
          className={cn(
            "size-4 transition-transform duration-300",
            isCollapsed && "rotate-180",
          )}
        />
      </button>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <NavLinks orientation="vertical" isCollapsed={isCollapsed} />
      </div>

      {/* Bottom: user menu dropdown */}
      <div
        className={cn(
          "border-t py-3",
          isCollapsed
            ? "flex flex-col items-center gap-3 px-1"
            : "px-4",
        )}
      >
        <UserMenu
          position={isCollapsed ? "sidebar-collapsed" : "sidebar-expanded"}
          userName={userName}
          userEmail={userEmail}
        />
      </div>
    </aside>
  );
}
