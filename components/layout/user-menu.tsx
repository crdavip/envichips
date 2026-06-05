"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Settings, LogOut, ChevronDown } from "lucide-react";

type UserMenuProps = {
  userName: string;
  userEmail: string;
  position: "sidebar-expanded" | "sidebar-collapsed" | "header";
};

export function UserMenu({ userName, userEmail, position }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initial = userName?.charAt(0)?.toUpperCase() || "?";
  const displayName = userName || "Usuario";
  const showDetails = position === "sidebar-expanded";

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  // Calculamos la posición basada en el trigger
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

  const handleToggle = () => {
    if (!open) {
      // Buscamos el botón trigger para obtener su posición
      const btn = menuRef.current?.querySelector("button");
      if (btn) {
        setTriggerRect(btn.getBoundingClientRect());
      }
    }
    setOpen(!open);
  };

  const getDropdownPosition = (): React.CSSProperties => {
    if (!triggerRect) return { display: "none" };

    const dropdownWidth = 224;
    const gap = 8;
    const style: React.CSSProperties = { position: "fixed" };

    switch (position) {
      case "sidebar-expanded":
        // Sale hacia ARRIBA: alineado al borde izquierdo del botón
        style.bottom = window.innerHeight - triggerRect.top + gap;
        style.left = triggerRect.left;
        break;
      case "sidebar-collapsed":
        // Sale hacia la DERECHA, pero sin cortarse abajo
        style.left = triggerRect.right + gap;
        // Altura estimada del dropdown (~220px con el contenido)
        if (triggerRect.top + 220 > window.innerHeight) {
          // No entra abajo → anclar desde el fondo
          style.bottom = gap;
        } else {
          style.top = triggerRect.top;
        }
        break;
      case "header":
        // Sale hacia ABAJO: alineado al borde derecho del botón
        style.top = triggerRect.bottom + gap;
        style.left = triggerRect.right - dropdownWidth;
        break;
    }

    return style;
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors cursor-pointer outline-none"
      >
        <div className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-medium uppercase text-primary-foreground">
          {initial}
        </div>
        {showDetails && (
          <>
            <span className="truncate">{displayName}</span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </>
        )}
      </button>

      {open && triggerRect && (
        <div
          style={getDropdownPosition()}
          className="min-w-56 rounded-xl border bg-popover p-1 shadow-lg outline-none"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-medium uppercase text-primary-foreground">
              {initial}
            </div>
            <div className="flex min-w-0 flex-col">
              <p className="truncate text-sm font-medium">{displayName}</p>
              {userEmail && (
                <p className="truncate text-xs text-muted-foreground">
                  {userEmail}
                </p>
              )}
            </div>
          </div>
          <div className="mx-2 my-1 border-t" />
          <Link
            href="/configuracion"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors outline-none"
          >
            <Settings className="size-4" />
            Configuración
          </Link>
          <div className="mx-2 my-1 border-t" />
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors outline-none cursor-pointer"
          >
            <LogOut className="size-4" />
            Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
}
