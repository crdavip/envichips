# SDD Design: Fase 6 — Usuarios, Ganancias Netas, Configuración Global

## Decisiones Arquitectónicas

### D1: 3 PRs stackeados contra main

Justificación: las 3 features son independientes en dominio pero comparten la misma rama de features. Cada PR ~250-350 líneas, dentro del budget de 400.

| PR | Feature | Archivos estimados | Líneas |
|----|---------|--------------------|--------|
| PR 1 | CRUD Usuarios | 8-10 archivos nuevos | ~350 |
| PR 2 | Ganancias Netas (date range) | 2-3 archivos modificados | ~150 |
| PR 3 | Configuración Global | 5-6 archivos nuevos | ~250 |

### D2: Servicio único por feature con validación Zod

Mismo patrón que artículos y clientes:
- `lib/services/usuarios.ts` — CRUD + bcrypt hash
- `lib/services/configuracion.ts` — get/upsert singleton
- `lib/services/informes.ts` — extender `getGanancias()` con dateRange

### D3: Páginas server-render con Suspense

Cada página sigue el patrón existente: server component wrapper → async content function → Suspense boundary con Skeleton.

### D4: BusinessConfig como Prisma model singleton

Modelo dedicado con campos fijos. La función `getConfig()` usa `findFirst()` y crea defaults si no existe (para evitar errores en facturas antes de la primera configuración).

## CRUD Usuarios — Diseño Detallado

### Flujo de Creación

```
User (Browser)          Server Action          Service              Prisma
     │                      │                    │                    │
     │  Submit form         │                    │                    │
     │─────────────────────>│                    │                    │
     │                      │  Validar Zod       │                    │
     │                      │  Verificar rol     │                    │
     │                      │  SUPERADMIN        │                    │
     │                      │  Verificar email   │                    │
     │                      │  único             │                    │
     │                      │────────────────────>│                   │
     │                      │                    │ bcrypt.hash(pass)  │
     │                      │                    │───────────────────>│
     │                      │                    │  user.create()     │
     │                      │                    │───────────────────>│
     │                      │                    │ <── User           │
     │                      │<────────────────────│                   │
     │  revalidate + redirect│                    │                    │
     │<─────────────────────│                    │                    │
```

### Páginas

```
app/(dashboard)/
└── usuarios/
    ├── page.tsx           → Lista de usuarios (tabla)
    ├── new/page.tsx       → Formulario crear
    └── [id]/
        ├── page.tsx       → Formulario editar
        └── actions.ts     → Toggle activo
```

### Validaciones (Zod)

```typescript
// lib/validations/usuarios.ts
const createUsuarioSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  rol: z.nativeEnum(Rol),
  telefono: z.string().optional(),
});

const editUsuarioSchema = createUsuarioSchema.extend({
  password: z.string().min(6).optional().or(z.literal("")),
});
```

## Ganancias Netas con Date Range — Diseño Detallado

### Extensión de getGanancias()

```typescript
// En lib/services/informes.ts — función existente, se extiende
export async function getGanancias(
  dateRange: DateRange = "today",   // ← NUEVO parámetro
  customDesde?: Date,                // ← NUEVO parámetro
  customHasta?: Date,                // ← NUEVO parámetro
): Promise<ResumenGanancias>
```

Ya existe el helper `getDateRange()` y el tipo `DateRange` — se reutilizan.

### Página Modificada

```
app/(dashboard)/informes/ganancias/page.tsx
├── Selector rango (search params: ?range=today&desde=&hasta=)
├── GananciasCards (sin cambios)
└── Indicador de período actual
```

### Componentes

```
components/ganancias/
└── DateRangeFilter.tsx   → Selector de rango (hoy/semana/mes/personalizado)
```

## Configuración Global — Diseño Detallado

### Modelo Prisma

```prisma
model BusinessConfig {
  id               String   @id @default(uuid())
  nombreNegocio    String
  telefonoFactura  String?
  actualizadoEn    DateTime @default(now()) @updatedAt
  actualizadoPorId String
  actualizadoPor   User     @relation(fields: [actualizadoPorId], references: [id])
}
```

### Servicio

```typescript
// lib/services/configuracion.ts
export async function getConfig(): Promise<BusinessConfig>
// Siempre devuelve algo. Si no existe fila, crea defaults y devuelve.

export async function upsertConfig(
  data: ConfigInput,
  userId: string,
): Promise<BusinessConfig>
// Upsert: si no existe, create; si existe, update.
```

### Página

```
app/(dashboard)/configuracion/
└── page.tsx   → Formulario único con nombreNegocio + telefonoFactura
```

### Nav

Agregar en `nav-links.tsx`:

```typescript
const links = [
  // ... existentes
  { href: "/usuarios", label: "Usuarios", icon: Users },      // solo SUPERADMIN
  { href: "/configuracion", label: "Config", icon: Settings }, // solo SUPERADMIN
];
```

## Decisiones de Implementación

| Decisión | Opción | Justificación |
|----------|--------|---------------|
| Soft-delete usuarios | `activo = false` | Ya existe el campo, no se pierde referencia en pedidos |
| Hash de password | `bcryptjs` (existente) | Ya en el proyecto, usado en auth |
| Singleton BusinessConfig | `findFirst()` + create defaults | Evita errores si no hay config |
| Date range | Search params | URL compartible, consistente con patterns de Next.js |
| Role check en usuarios | Server-side (server action + layout) | Seguridad, no confiar en client |
| Icono para usuarios | `UserCog` o `Users` | lucide-react, ambos disponibles |
| Icono para config | `Settings` | lucide-react |

## Secuencia de Implementación

```
PR 1: CRUD Usuarios
  ├── Migración: ninguna (User ya existe)
  ├── lib/services/usuarios.ts
  ├── lib/validations/usuarios.ts
  ├── lib/actions/usuarios.ts (server actions)
  ├── app/(dashboard)/usuarios/page.tsx (lista)
  ├── app/(dashboard)/usuarios/new/page.tsx (crear)
  ├── app/(dashboard)/usuarios/[id]/page.tsx (editar)
  └── components/layout/nav-links.tsx (link Usuarios)

PR 2: Ganancias Netas
  ├── lib/services/informes.ts (extender getGanancias)
  ├── components/ganancias/DateRangeFilter.tsx
  └── app/(dashboard)/informes/ganancias/page.tsx (modificar)

PR 3: Configuración Global
  ├── prisma/schema.prisma (+ BusinessConfig)
  ├── Migración Prisma
  ├── lib/services/configuracion.ts
  ├── lib/validations/configuracion.ts
  ├── app/(dashboard)/configuracion/page.tsx
  └── components/layout/nav-links.tsx (link Config)
```
