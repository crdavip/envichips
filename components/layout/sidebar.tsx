"use client";

import { signOut } from "next-auth/react";
import { LogOut, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLinks } from "@/components/layout/nav-links";
import { IsoType } from "../logo/isotype";
import { LogoType } from "../logo/logotype";
import { useSidebar } from "./sidebar-context";

export function Sidebar({ userName }: { userName: string }) {
  const { isCollapsed, toggle } = useSidebar();

  return (
    <aside
      className={`fixed left-0 top-0 z-30 hidden h-full flex-col border-r bg-sidebar transition-all duration-300 md:flex ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo */}
      <div
        className={`flex items-center border-b py-3 ${
          isCollapsed ? "justify-center px-2" : "gap-3 px-4"
        }`}
      >
        <IsoType className="size-9 shrink-0" />
        {!isCollapsed && <LogoType className="h-6 w-auto" />}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <NavLinks orientation="vertical" isCollapsed={isCollapsed} />
      </div>

      {/* Bottom section: logout + collapse */}
      <div
        className={`border-t py-3 ${
          isCollapsed ? "flex flex-col items-center gap-3 px-1" : "px-4"
        }`}
      >
        {!isCollapsed && (
          <p className="mb-2 truncate text-sm font-medium text-foreground">
            {userName}
          </p>
        )}

        <Button
          variant="outline"
          size={isCollapsed ? "icon-sm" : "sm"}
          className={isCollapsed ? "size-7" : "w-full justify-start gap-2"}
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={isCollapsed ? "Cerrar sesión" : undefined}
        >
          <LogOut className="size-4" />
          {!isCollapsed && "Cerrar sesión"}
        </Button>

        <Button
          variant="ghost"
          size={isCollapsed ? "icon-sm" : "sm"}
          className={isCollapsed ? "mt-1 size-7" : "mt-1 w-full justify-center"}
          onClick={toggle}
          title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
        >
          <ChevronLeft
            className={`size-4 transition-transform duration-300 ${
              isCollapsed ? "rotate-180" : ""
            }`}
          />
          {!isCollapsed && "Colapsar"}
        </Button>
      </div>
    </aside>
  );
}
