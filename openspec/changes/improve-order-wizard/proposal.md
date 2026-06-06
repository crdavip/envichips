# Proposal: improve-order-wizard

## Intent

Redesign the order creation wizard to be intuitive and efficient, especially for mobile-first usage. Replace the search-only pattern with a browse + search approach so users can always see available options. Fix the Venta rápida toggle behavior.

## Scope

### In scope
- Step 1 (Cliente): client list with inline search filter + Venta rápida toggle
- Step 2 (Productos): product grid/list with inline search filter + cart
- Server actions: remove 2-char minimum, support browse mode
- State management: fix venta rápida toggle, preserve clienteNombre across mode switches
- Mobile layout: larger touch targets, better spacing

### Out of scope
- Step 3 (Resumen): no UX changes, only minor layout if needed
- New fields or data model changes
- New dependencies
- Animations or micro-interactions
- Domiciliario management (already works)

## Approach

### Phase 1 — Server Actions (enabler)
Modify `getClientesAction` and `getArticulosForPedidoAction`:
- When `query` is empty → return first 15-20 items ordered by name
- When `query` has content → filter as before (current behavior)
- Remove the `query.length < 2` guard

This is a minimal change but enables the entire browse pattern.

### Phase 2 — Step 1: Cliente
- On mount, call `getClientesAction("")` to load initial list
- Show search input at top, list below
- As user types, debounce and call `getClientesAction(query)` to filter
- Venta rápida toggle: separate `clienteNombre` state from mode. When toggling OFF → ON, preserve the typed name. Only clear when explicitly changing client.

### Phase 3 — Step 2: Productos
- On mount, call `getArticulosForPedidoAction("")` to load initial list
- Show products in a card-like layout with larger touch targets
- Search bar at top filters results
- Cart section below, collapsible on mobile

### Phase 4 — Toggle Fix
- Use `useCallback` for toggle handler with functional state
- Don't clear `clienteNombre` when toggling modes, only when explicitly unselecting

## Success Criteria

1. User lands on Step 1 and immediately sees client list — no typing needed
2. User can filter clients by typing in search bar
3. Venta rápida toggle works without losing typed name
4. User lands on Step 2 and immediately sees products
5. Products have larger touch targets on mobile
6. All existing functionality preserved (create order, validation, etc.)
