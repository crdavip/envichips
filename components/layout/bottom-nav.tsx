"use client";

import { NavLinks } from "@/components/layout/nav-links";

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 z-30 w-full border-t bg-white pb-safe flex md:hidden">
      <NavLinks orientation="horizontal" />
    </nav>
  );
}
