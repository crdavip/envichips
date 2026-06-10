"use client";

import { NavLinks } from "@/components/layout/nav-links";

export function BottomNav({ userRole }: { userRole?: string }) {
  return (
    <nav className="fixed bottom-0 left-0 z-30 w-full border-t bg-sidebar pb-safe flex md:hidden">
      <NavLinks orientation="horizontal" userRole={userRole} />
    </nav>
  );
}
