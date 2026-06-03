"use client";

import { useSidebar } from "./sidebar-context";

export function ShellMain({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <main
      className={`flex-1 pb-16 pt-14 transition-all duration-300 md:pb-0 md:pt-0 ${
        isCollapsed ? "md:ml-16" : "md:ml-64"
      }`}
    >
      {children}
    </main>
  );
}
