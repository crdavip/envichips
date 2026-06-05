# Spec — UserMenu Dropdown

## Change
`user-menu-dropdown`

## Requirements

### R1: Avatar Display
- The trigger MUST show a circular avatar with the first letter of `userName` in uppercase
- The avatar MUST use `bg-primary` background and `text-primary-foreground` text color
- Default size: `size-8` (2rem) in the trigger, `size-9` (2.25rem) in the dropdown header

### R2: Dropdown Trigger
- When sidebar is **expanded**: show `[Avatar] Nombre ▼` (avatar + name + chevron-down icon)
- When sidebar is **collapsed**: show only `[Avatar]` (no name, no chevron)
- In **mobile header**: show only `[Avatar]` (no name, no chevron)

### R3: Dropdown Content
When opened, the dropdown MUST contain:
- **Header section**: avatar (`size-9`) + user's full name + user's email (non-interactive, visual-only)
- **Separator** line
- **Configuración item**: Settings icon + label "Configuración", navigates to `/configuracion`
- **Cerrar Sesión item**: LogOut icon + label "Cerrar Sesión", calls `signOut({ callbackUrl: "/login" })`

### R4: Dropdown Positioning
- Sidebar expanded: open **upward** (`side="top"`), right-aligned (`align="end"`)
- Sidebar collapsed: open **rightward** (`side="right"`), top-aligned (`align="start"`)
- Mobile header: open **downward** (`side="bottom"`), right-aligned (`align="end"`)

### R5: Configuración Removal
- The "Configuración" link MUST be removed from the `links` array in `nav-links.tsx`
- It MUST remain accessible ONLY through the UserMenu dropdown

### R6: Layout Integration
- `sidebar.tsx`: bottom section MUST render `<UserMenu />` instead of `<p>{userName}</p>` + logout button
- `mobile-header.tsx`: right section MUST render `<UserMenu />` instead of the logout button
- `app/(dashboard)/layout.tsx`: MUST pass both `userName` and `userEmail` to both consumers

## Scenarios

### S1: Desktop — Expanded Sidebar
1. User sees avatar circle with initial + name + chevron at bottom of sidebar
2. User clicks trigger → dropdown opens upward
3. Dropdown shows: avatar, name, email, separator, Configuración, Cerrar Sesión
4. User clicks outside → dropdown closes
5. User clicks Configuración → navigates to /configuracion
6. User clicks Cerrar Sesión → signs out and redirects to /login

### S2: Desktop — Collapsed Sidebar
1. User sees only avatar circle at bottom of narrow sidebar
2. User clicks avatar → dropdown opens to the right
3. Dropdown content is identical to S1
4. All interactions behave the same

### S3: Mobile
1. User sees avatar circle in top-right header
2. User taps avatar → dropdown opens downward
3. Dropdown content is identical to S1
4. User taps Configuración → navigates
5. User taps Cerrar Sesión → signs out

### S4: Long Name
1. User has a long name (e.g., "María del Carmen Rodríguez")
2. Avatar shows only first letter "M"
3. Full name displays in dropdown header, truncated if necessary with ellipsis

### S5: Short Name / Single Character
1. User has name "A" or similar
2. Avatar shows "A"
3. No edge case issues

## Edge Cases

### EC1: Empty Name
- If `userName` is empty string or null, fallback to "?" for the avatar letter
- Display "Usuario" as fallback name in dropdown

### EC2: Empty Email
- If `userEmail` is empty or null, hide the email line entirely

### EC3: Menu Closing on Navigation
- When clicking Configuración, the menu MUST close before navigation completes
- Use `Menu.Item`'s built-in close-on-click behavior

### EC4: Keyboard Navigation
- Menu MUST support keyboard navigation (Arrow keys, Enter, Escape)
- Provided by Base UI Menu component by default
