"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Shield,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/articulos", label: "Artículos", icon: Package },
  { href: "/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/usuarios", label: "Usuarios", icon: Shield },
  { href: "/informes", label: "Informes", icon: BarChart3 },
  { href: "/configuracion", label: "Configuración", icon: Settings },
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
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        "flex",
        orientation === "vertical"
          ? "flex-col gap-1"
          : "flex-row items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden px-2",
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
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
              orientation === "horizontal" && "shrink-0 flex-col gap-1 px-2 py-1 text-xs",
              isCollapsed &&
                orientation === "vertical" &&
                "gap-0 px-0 justify-center",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
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
