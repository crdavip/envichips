# Design — UserMenu Dropdown

## Change
`user-menu-dropdown`

## Component Tree

```
UserMenu (props: userName, userEmail)
├── Menu.Trigger
│   └── div (flex items-center, gap-2)
│       ├── div (avatar: size-8, rounded-full, bg-primary, text-primary-foreground, flex, items-center, justify-center, font-medium, uppercase)
│       │   └── {userName[0] || "?"}
│       ├── span (userName — hidden when collapsed/mobile)
│       └── ChevronDown (icon, size-4 — hidden when collapsed/mobile)
├── Menu.Positioner (side/align based on context)
│   └── Menu.Popup (min-w-56, p-1, rounded-xl, border, bg-popover, shadow-lg)
│       ├── div (header: flex items-center gap-3, px-3, py-2.5)
│       │   ├── div (avatar: size-9, rounded-full, bg-primary, text-primary-foreground, flex, items-center, justify-center, font-medium, uppercase)
│       │   ├── div (flex flex-col)
│       │   │   ├── p (userName, text-sm, font-medium)
│       │   │   └── p (userEmail, text-xs, text-muted-foreground — hidden if empty)
│       │   └── (no close button — menu closes on outside click)
│       ├── Menu.Separator
│       ├── Menu.Item (Configuración)
│       │   └── Link href="/configuracion"
│       │       ├── Settings (icon, size-4)
│       │       └── span "Configuración"
│       ├── Menu.Separator
│       └── Menu.Item (Cerrar Sesión)
│           ├── LogOut (icon, size-4)
│           └── span "Cerrar Sesión"
│           └── onClick → signOut({ callbackUrl: "/login" })
```

## Data Flow

```
app/(dashboard)/layout.tsx (server component)
  └── auth() → session.user.name, session.user.email
      ├── Sidebar ← userName, userEmail
      │   └── UserMenu ← userName, userEmail
      ├── MobileHeader ← userName, userEmail
      │   └── UserMenu ← userName, userEmail
      └── SidebarProvider (context)
```

## State Management

- **Open/close state**: handled internally by `@base-ui/react/menu` (no local state needed)
- **Sidebar collapsed state**: consumed from `useSidebar()` context in sidebar.tsx, passed as prop to UserMenu or handled via CSS
- **Positioning**: computed based on context prop (`position: "sidebar-expanded" | "sidebar-collapsed" | "header"`)

## Responsive Behavior

| Breakpoint | Trigger | Position | Parent Component |
|-----------|---------|----------|-----------------|
| `md+` (desktop) | Avatar + Name + Chevron | `side="top" align="end"` | sidebar.tsx |
| `md+` collapsed | Avatar only | `side="right" align="start"` | sidebar.tsx |
| `<md` (mobile) | Avatar only | `side="bottom" align="end"` | mobile-header.tsx |

## Accessibility

- `role="menu"` provided by Base UI Menu
- Keyboard nav: Arrow Up/Down to move between items, Enter to select, Escape to close
- Focus trap: Base UI handles focus management
- Trigger is a button (clickable, focusable)

## Implementation Plan

### Files to Create

**`components/layout/user-menu.tsx`**

```tsx
"use client";

import { Menu } from "@base-ui/react/menu";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Settings, LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  userName: string;
  userEmail: string;
  position: "sidebar-expanded" | "sidebar-collapsed" | "header";
};

export function UserMenu({ userName, userEmail, position }: UserMenuProps) {
  const initial = userName?.charAt(0)?.toUpperCase() || "?";
  const displayName = userName || "Usuario";

  const getPositionerProps = () => {
    switch (position) {
      case "sidebar-collapsed":
        return { side: "right" as const, align: "start" as const };
      case "header":
        return { side: "bottom" as const, align: "end" as const };
      case "sidebar-expanded":
      default:
        return { side: "top" as const, align: "end" as const };
    }
  };

  const showDetails = position === "sidebar-expanded";

  return (
    <Menu.Root>
      <Menu.Trigger className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors cursor-pointer data-[popup-open]:bg-sidebar-accent outline-none">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-medium uppercase text-primary-foreground">
          {initial}
        </div>
        {showDetails && (
          <>
            <span className="truncate">{displayName}</span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </>
        )}
      </Menu.Trigger>
      <Menu.Positioner {...getPositionerProps()}>
        <Menu.Popup className="min-w-56 rounded-xl border bg-popover p-1 shadow-lg outline-none">
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
          <Menu.Separator className="mx-2 my-1 border-t" />
          <Menu.Item className="flex cursor-default items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted hover:text-foreground outline-none data-[active]:bg-muted">
            <Link href="/configuracion" className="flex items-center gap-2">
              <Settings className="size-4" />
              Configuración
            </Link>
          </Menu.Item>
          <Menu.Separator className="mx-2 my-1 border-t" />
          <Menu.Item
            className="flex cursor-default items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted hover:text-foreground outline-none data-[active]:bg-muted"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="size-4" />
            Cerrar Sesión
          </Menu.Item>
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Root>
  );
}
```

### Files to Modify

**`components/layout/sidebar.tsx`**:
- Add `userEmail` prop
- Replace bottom section (lines 55-80) with `<UserMenu position={isCollapsed ? "sidebar-collapsed" : "sidebar-expanded"} userName={userName} userEmail={userEmail} />`
- Remove `signOut` import, `LogOut` icon import
- Remove `Button` import if no longer used elsewhere

**`components/layout/mobile-header.tsx`**:
- Add `userEmail` prop
- Replace logout button with `<UserMenu position="header" userName={userName} userEmail={userEmail} />`
- Remove `LogOut` icon import and `buttonVariants` import
- Remove `logoutAction` import from `@/lib/actions`

**`components/layout/nav-links.tsx`**:
- Remove the Configuración entry from the `links` array
- Remove the `Settings` icon import

**`app/(dashboard)/layout.tsx`**:
- Extract and pass `userEmail` from `session.user.email`
- Pass `userEmail` to both `Sidebar` and `MobileHeader`

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Base UI Menu positioning in collapsed sidebar | Test with explicit `side="right" align="start"`; adjust if collision issues arise |
| Config not accessible from bottom-nav on mobile | Acceptable — it's secondary nav; user can still access via header dropdown |
| Menu.Item wrapping Link might cause event issues | Use a fragment or render Link content inside Menu.Item; test click behavior |
| Base UI v1.5 Menu API differences from latest | Check installed version API; adjust if needed |
