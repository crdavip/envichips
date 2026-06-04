# Design: Eliminar prefijo `/dashboard` de las rutas

## Approach

Usar Route Groups de Next.js App Router. Mover `app/dashboard/` → `app/(dashboard)/`. El paréntesis en el nombre del directorio le indica a Next.js que agrupe layouts sin agregar segmento a la URL.

## Estructura destino

```
app/
├── (auth)/                  # Sin cambios
│   ├── layout.tsx
│   └── login/
├── (dashboard)/             # MOVER: antes era dashboard/
│   ├── layout.tsx           # auth guard + sidebar + bottom-nav
│   ├── page.tsx             # dashboard home (estadísticas)
│   ├── articulos/
│   ├── pedidos/
│   ├── clientes/
│   └── informes/
├── layout.tsx               # root layout (font, html, body)
└── page.tsx                 # ELIMINAR: redirect ya no necesario
```

## Plan de migración

### Fase 1: Mover carpeta
```bash
git mv app/dashboard app/\(dashboard\)
```

### Fase 2: Eliminar redirect raíz
Eliminar `app/page.tsx` — el dashboard layout ya maneja auth.

### Fase 3: Actualizar imports
`@/app/dashboard/...` → `@/app/(dashboard)/...` en componentes que importan server actions.

### Fase 4: Actualizar links
`/dashboard/...` → `/...` en todos los href, router.push, y revalidatePath.

### Fase 5: Limpiar auth checks redundantes
Algunas pages (`dashboard/page.tsx`, `informes/page.tsx`) tienen `auth()` + `redirect("/login")` que ahora hace el layout. Podemos removerlos (opcional, no rompe si quedan).

## Consideraciones técnicas

- Route groups no afectan imports entre ellos: `@/app/(dashboard)/articulos/actions` funciona.
- El layout de dashboard es un server component con `auth()` — se ejecuta antes que cualquier page hija.
- `app/page.tsx` y `app/(dashboard)/page.tsx` compiten por `/`. Hay que eliminar `app/page.tsx`.
- `(auth)` y `(dashboard)` son sibling route groups, no hay conflicto.

## Archivos a modificar (~56 referencias)

Todas las referencias a `/dashboard/` en href, router.push, revalidatePath, e import paths.
