"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/articulos", label: "Artículos", icon: Package },
  { href: "/dashboard/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users },
  { href: "/dashboard/informes", label: "Informes", icon: BarChart3 },
];

export type NavLinksProps = {
  isCollapsed?: boolean;
  orientation: "vertical" | "horizontal";
  onNavigate?: () => void;
};

export function NavLinks({
  isCollapsed = false,
  orientation,
  onNavigate,
}: NavLinksProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        "flex",
        orientation === "vertical"
          ? "flex-col gap-1"
          : "flex-row items-center justify-around",
      )}
    >
      {links.map((link) => {
        const active = isActive(link.href);
        const Icon = link.icon;

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              orientation === "horizontal" && "flex-col gap-1 px-2 py-1 text-xs",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-5 shrink-0" />
            {!isCollapsed && <span>{link.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
