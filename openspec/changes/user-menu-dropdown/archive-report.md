# Archive Report — UserMenu Dropdown

## Change
`user-menu-dropdown`

## Status
**ARCHIVED** ✅

## Summary
Created a unified `UserMenu` dropdown component using `@base-ui/react/menu` that replaces the separate user/logout UIs in sidebar (desktop) and mobile header. Moved "Configuración" from sidebar navigation to the user dropdown.

## Files Created
- `components/layout/user-menu.tsx` — UserMenu component with avatar, dropdown, Configuración link, and Cerrar Sesión action

## Files Modified
- `components/layout/sidebar.tsx` — Replaced bottom user section with UserMenu
- `components/layout/mobile-header.tsx` — Replaced logout button with UserMenu
- `components/layout/nav-links.tsx` — Removed Configuración link
- `app/(dashboard)/layout.tsx` — Added userEmail flow

## Decisions
- Used `@base-ui/react/menu` for proper accessibility (keyboard nav, focus trap, role="menu")
- Position variants: sidebar-expanded (top), sidebar-collapsed (right), header (bottom)
- Avatar with first letter (bg-primary, text-primary-foreground)
- Fallback: "?" for empty name, hidden email for empty email
- Configuración removed from nav-links (no longer in sidebar nav or mobile bottom-nav)

## Verification
- Build passes (`npm run build` ✅)
- All spec requirements met
- All edge cases covered
