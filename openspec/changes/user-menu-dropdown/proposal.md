# Proposal — UserMenu Dropdown

## Metadata

- **Change name**: `user-menu-dropdown`
- **Created**: 2026-06-05
- **Status**: Proposed

## Intent

Replace the current user/logout UI (separate implementations in sidebar and mobile header) with a single unified `UserMenu` dropdown component. Move "Configuración" from the sidebar navigation into this dropdown.

## Motivation

- Current approach has two separate implementations for desktop and mobile
- Desktop shows user name as static text + separate logout button
- Mobile shows only a logout icon, user name is barely visible
- No user avatar, no contextual user info available
- Configuración is secondary navigation that fits better in a user menu

## Scope

### In
- New `UserMenu` component using `@base-ui/react/menu`
- Integrate into sidebar (desktop) bottom section
- Integrate into mobile-header (mobile) right side
- Remove Configuración from nav-links
- Pass `userEmail` from session in layout

### Out
- Any other navigation changes
- Auth logic changes (signOut API stays the same)
- Visual redesign beyond the dropdown
- Adding user avatar images (initials-only for now)

## Approach

### Component: `UserMenu`

```
props: { userName: string; userEmail: string }
```

Structure:
- **Trigger**: Avatar circle (first letter, uppercase, bg-primary) + optional name + chevron
- **Menu.Popup**:
  - Header: larger avatar + name + email (non-interactive)
  - Menu.Separator
  - Menu.Item: Configuración (Settings icon, navigates to /configuracion via Link)
  - Menu.Item: Cerrar Sesión (LogOut icon, calls signOut({ callbackUrl: "/login" }))

### Placement

| Context | Trigger | Dropdown Position |
|---------|---------|-------------------|
| Sidebar expanded | `[A] Nombre ▼` | `side="top" align="end"` |
| Sidebar collapsed | `[A]` | `side="right" align="start"` |
| Mobile header | `[A]` | `side="bottom" align="end"` |

### Configuration Cleanup
- Remove Configuración from `links` array in `nav-links.tsx`
- Remove `logoutAction` server action usage from mobile-header (use signOut directly)

## Files Affected

| File | Action |
|------|--------|
| `components/layout/user-menu.tsx` | **CREATE** |
| `components/layout/sidebar.tsx` | MODIFY |
| `components/layout/mobile-header.tsx` | MODIFY |
| `components/layout/nav-links.tsx` | MODIFY |
| `app/(dashboard)/layout.tsx` | MODIFY |

## Dependencies

- `@base-ui/react` ^1.5.0 (already installed)
- `lucide-react` (already installed)
- `next-auth/react` (already installed)

## Risks

1. **Collapsed sidebar positioning**: Base UI Menu may need explicit `side` + `align` overrides when sidebar is collapsed
2. **Bottom-nav loses Configuración**: Acceptable trade-off, but user should be aware
3. **NextAuth v5 signOut**: Current beta API — need to ensure `signOut({ callbackUrl: "/login" })` works correctly in the new context
