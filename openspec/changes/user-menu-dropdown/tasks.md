# Tasks — UserMenu Dropdown

## Change
`user-menu-dropdown`

## Delivery Strategy
- **Type**: force-chained PRs
- **Chain strategy**: stacked-to-main
- **Review budget**: 400 lines

## Review Workload Forecast

| Metric | Value |
|--------|-------|
| Files changed | 5 |
| Estimated lines | ~180-220 |
| 400-line budget risk | **Low** |
| Chained PRs recommended | **No** — fits in a single PR |
| Decision needed before apply | **No** |

## Work Units

### T1 — Create UserMenu component ✅
**Files**: `components/layout/user-menu.tsx` (NEW)
**Description**: Create the `UserMenu` component with Base UI Menu, avatar with initial, dropdown with user info, Configuración link, and Cerrar Sesión action.

### T2 — Integrate into sidebar + layout ✅
**Files**:
- `components/layout/sidebar.tsx` (MODIFY)
- `app/(dashboard)/layout.tsx` (MODIFY)
**Description**: Replace bottom section of sidebar with UserMenu. Pass userEmail from session.

### T3 — Integrate into mobile header ✅
**Files**:
- `components/layout/mobile-header.tsx` (MODIFY)
**Description**: Replace logout button with UserMenu. Pass userEmail prop.

### T4 — Remove Configuración from nav-links ✅
**Files**:
- `components/layout/nav-links.tsx` (MODIFY)
**Description**: Remove Configuración entry from links array and its icon import.

## Dependencies
- T1 → T2, T3 (components must exist before integration)
- T2, T3 → T4 (no dependency, can run in parallel or any order)

## Execution Order
1. T1 (UserMenu component)
2. T2 + T3 (sidebar + mobile-header integration, parallel-safe)
3. T4 (nav-links cleanup)

## Verification
- UserMenu renders in sidebar desktop (expanded and collapsed)
- UserMenu renders in mobile header
- Dropdown opens correctly at each position
- Configuración link navigates to /configuracion
- Cerrar Sesión signs out and redirects to /login
- Configuración is gone from sidebar nav and bottom-nav
- Build passes with `npm run build`
