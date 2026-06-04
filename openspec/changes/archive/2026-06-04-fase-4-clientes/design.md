# Design: Fase 4 - Gestión de Clientes

## Technical Approach

Implementar el módulo de clientes siguiendo los patrones establecidos en el módulo de articulos/pedidos:
- Rutas en `app/dashboard/clientes/` con App Router
- Server actions en `app/dashboard/clientes/actions.ts` para operaciones CRUD y registro de abonos
- Servicio de negocio en `lib/services/clientes.ts` encapsulando lógica de Prisma
- Validaciones Zod en `lib/validations/clientes.ts`
- Componentes UI reutilizables en `components/clientes/` (Lista, Formulario, Detalle, Diálogo de Abono)
- Cálculo de deuda en tiempo real mediante agregación Prisma (SUM(pedidos FIADO) - SUM(abonos))
- Registro de abono como diálogo dentro del detalle de cliente para mantener contexto
- Generación de ID cliente secuencial (CLI-2026-0001) siguiendo patrón del modelo Sequence
- Control de acceso basado en roles: SUPERADMIN/ADMIN para CRUD completo, DOMICILIARIO solo lectura
- Validación de límite de crédito al crear pedidos FIADO

## Architecture Decisions

### Decision: Deuda cálculo - tiempo real vs campo almacenado

**Choice**: Cálculo en tiempo real mediante agregación en consulta
**Alternatives considered**: 
  - Campo almacenado `deuda` actualizado vía triggers o transacciones
  - Campo almacenado con actualización en eventos de pedido/abono
**Rationale**: 
  - Elimina riesgo de inconsistencia entre deuda almacenada y cálculos reales
  - Simplifica arquitectura al evitar mecanismos de sincronización complejos
  - Patrón existente en módulo de articulos (sin campos calculados almacenados)
  - Propuesta especifica "cálculo en tiempo real de deuda mediante agregación"
  - Índices adecuados en Prisma mitigarán preocupaciones de rendimiento (ver riesgos en proposal)

### Decision: Formato de ID cliente

**Choice**: CLI-{year}-{counter} (ej: CLI-2026-0001) usando modelo Sequence existente
**Alternatives considered**:
  - UUID puro (como id actual)
  - Secuencia simple sin año (CLI-0001)
  - Formato alfanumérico personalizado
**Rationale**:
  - Reutiliza modelo Sequence existente (evita duplicación de lógica)
  - Consistencia con formato de numeroPedido (ENV-2026-00001)
  - Permite reinicio anual automático mediante año en secuencia
  - Fácil de leer y comunicar (ej: CLI-2026-0001)
  - Modelo Sequence ya tiene unicidad compuesta [year, type]

### Decision: Registro de abono - UX

**Choice**: Diálogo modal dentro de página de detalle de cliente
**Alternatives considered**:
  - Página separada `/dashboard/clientes/[id]/abono/nuevo`
  - Sección expandible en detalle de cliente
  - Dropdown en fila de lista de clientes
**Rationale**:
  - Mantiene contexto visual del cliente cuyo abono se registra
  - Menos navegación que página separada
  - Patrón establecido en articulos (PurchaseModal dentro de ArticleList)
  - Propuesta explícitamente especifica este enfoque
  - Evita pérdida de estado al navegar entre páginas

### Decision: Permisos por rol

**Choice**: 
  - SUPERADMIN/ADMIN: CRUD completo de clientes y registro de abonos
  - DOMICILIARIO: Solo lectura de clientes y su deuda (no puede crear/editar/eliminar ni registrar abonos)
**Alternatives considered**:
  - Permitir a DOMICILIARIO registrar abonos (rol de cobro)
  - Todos los roles autenticados pueden registrar abonos
  - Ninguna restricción (todos pueden CRUD)
**Rationale**:
  - Seguridad: Limitar operaciones financieras críticas a roles de confianza
  - Consistencia con principio de menor privilegio
  - DOMICILIARIO enfocado en entregas, no en gestión de cartera
  - Posibilidad futura de extender permisos mediante sistema de roles más granular
  - Simplifica implementación inicial (puede evolucionar en fases posteriores)

### Decision: Límite de crédito en pedidos FIADO

**Choice**: Validación en server action de creación de pedido
**Alternatives considered**:
  - Validación a nivel de base de datos (check constraint)
  - Validación en capa de servicio de pedidos
  - Validación solo en cliente (UI)
**Rationale**:
  - Aprovecha capa existente de validación en server actions de pedidos
  - Centraliza lógica de negocio donde ya se valida stock y otros campos
  - Permite mensajería de error específica al usuario
  - Evita sobrecarga de base de datos con lógica compleja
  - Fácil de testear y mantener
  - Patrón seguido por otras validaciones en server actions existentes

## Data Flow

### Creación de Cliente
```
User Interface ──→ Server Action (createClienteAction)
     │                           │
     │                           ▼
     │                   Validation (Zod schema)
     │                           │
     │                           ▼
     │                   Service (createCliente)
     │                           │
     │                           ▼
     │                   Prisma (db.cliente.create)
     │                           │
     ▼                           ▼
Revalidate Path ←─ Success  ←─ Generated ID (CLI-2026-0001)
```

### Registro de Abono
```
User Interface ──→ Server Action (registerAbonoAction)
     │                           │
     │                           ▼
     │                   Validation (Zod schema + auth check)
     │                           │
     │                           ▼
     │                   Service (registerAbono)
     │                           │
     │                           ▼
     │                   Prisma Transaction:
     │                       1. db.abono.create
     │                       2. (Opcional) Actualizar campo deuda si se decidiera almacenar
     │                           ▼
     │                   Revalidate Paths:
     │                       - /dashboard/clientes/[id]
     │                       - /dashboard/pedidos (para actualizar advertencias)
     │                           ▼
     ▼                           ▼
Success ←─ Updated State  ←─ New Abono Record
```

### Cálculo de Deuda en Tiempo Real
```
Service (getDeudaCliente) ────► Prisma Aggregation
     │                           │
     │                           ▼
     │                   $sum([
     │                       { 
     │                           $match: {
     │                               clienteId: id,
     │                               metodoPago: 'FIADO'
     │                           }
     │                       },
     │                       { $group: { _id: null, total: { $sum: '$total' } } }
     │                   ]) -
     │                   $sum([
     │                       { 
     │                           $match: { clienteId: id }
     │                       },
     │                       { $group: { _id: null, total: { $sum: '$monto' } } }
     │                   ])
     │                           ▼
     ◄────────────── Deuda Calculada ────────────────┘
```

### Advertencia de Deuda en Pedido FIADO
```
Server Action (createPedidoAction) ────► Servicio de Clientes
     │                                       │
     │                                       ▼
     │                               getClienteById(clienteId)
     │                                       │
     │                                       ▼
     │                               getDeudaCliente(clienteId)
     │                                       │
     │                                       ▼
     │               Validar: (deudaActual + pedido.total) <= limiteCredito
     │                                       │
     │                                       ▼
     │               Si falla: retornar error de límite excedido
     │                                       │
     ▼                                       ▼
Continuar creación pedido ←───── Aprobado ────┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `app/dashboard/clientes/page.tsx` | Create | Lista de clientes con filtros, botón nuevo, tabla/grid responsive |
| `app/dashboard/clientes/actions.ts` | Create | Server actions: getClientesAction, getClienteByIdAction, createClienteAction, updateClienteAction, deleteClienteAction, registerAbonoAction |
| `lib/services/clientes.ts` | Create | Servicio de negocio: getClientes, getClienteById, createCliente, updateCliente, deleteCliente, registerAbono, getDeudaCliente |
| `lib/validations/clientes.ts` | Create | Esquemas Zod: createClienteSchema, updateClienteSchema, registerAbonoSchema, tipo de filtros ClienteFilters |
| `components/clientes/ClienteList.tsx` | Create | Componente reutilizable para lista de clientes (similar a ArticleList) |
| `components/clientes/ClienteForm.tsx` | Create | Formulario para crear/editar cliente (similar a ArticleForm) |
| `components/clientes/ClienteDetail.tsx` | Create | Vista detalle de cliente con historial de abonos y botón registrar abono |
| `components/clientes/AbonoForm.tsx` | Create | Formulario dentro de modal para registrar abono (similar a PurchaseModal) |
| `app/dashboard/pedidos/actions.ts` | Modify | Añadir validación de deuda y límite de crédito en createPedidoAction |
| `lib/services/pedidos.ts` | Modify | Actualizar lógica para llamar validación de deuda al crear pedido FIADO |
| `prisma/schema.prisma` | Modify | Eliminar campo `deuda` del modelo Cliente (calculado en tiempo real) |
| `components/layout/nav-links.tsx` | Modify | Asegurar que enlace a `/dashboard/clientes` esté activo (ya existe, verificar) |

## Interfaces / Contracts

```typescript
// lib/services/clientes.ts
export interface ClienteFilters {
  nombre?: string;
  telefono?: string;
  estado?: 'AL_DIA' | 'EN_DEUDA';
  activo?: boolean;
  sortBy?: 'nombre' | 'idCliente' | 'creadoEn';
  sortOrder?: 'asc' | 'desc';
}

export interface Cliente {
  id: string;
  idCliente: string; // CLI-2026-0001
  nombreCompleto: string;
  telefono?: string;
  direccion?: string;
  tipoDoc?: string;
  numeroDoc?: string;
  estado: 'AL_DIA' | 'EN_DEUDA';
  limiteCredito?: number; // COP
  activo: boolean;
  notas?: string;
  creadoEn: Date;
  pedidos: Pedido[];
  abonos: Abono[];
}

export interface Abono {
  id: string;
  clienteId: string;
  monto: number; // COP
  fecha: Date;
  metodoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'FIADO';
  registradoPorId: string;
  notas?: string;
}
```

```typescript
// lib/validations/clientes.ts
export const createClienteSchema = z.object({
  nombreCompleto: z.string().min(1, "El nombre es requerido").max(200),
  telefono: z.string().max(20).optional(),
  direccion: z.string().max(200).optional(),
  tipoDoc: z.nativeEnum(TipoDoc).optional(),
  numeroDoc: z.string().max(50).optional(),
  limiteCredito: z.number().int().nonnegative().optional().default(0),
});

export const updateClienteSchema = createClienteSchema.partial();

export const registerAbonoSchema = z.object({
  monto: z.number().int().positive("El monto debe ser mayor a 0"),
  metodoPago: z.nativeEnum(MetodoPago),
  notas: z.string().max(500).optional(),
});
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Esquemas de validación Zod | Tests de casos válidos e inválidos para cada campo |
| Unit | Funciones de servicio (mockeando Prisma) | Creación, actualización, eliminación, cálculo de deuda, registro de abono |
| Unit | Server actions (mockeando servicio y auth) | Flujo exitoso y manejo de errores (validación, auth, base de datos) |
| Integration | API routes de Next.js (usando jest o vitest con msw) | Endpoints completos con base de datos de prueba |
| E2E | Flujos de usuario críticos | Crear cliente → verificar lista → editar cliente → registrar abono → verificar deuda actualizada |
| E2E | Validación de límite de crédito | Intentar crear pedido FIADO que exceda límite → ver error apropiado |
| E2E | Control de acceso | Probar como DOMICILIARIO intenta crear cliente → ver denegado |
| Visual | Responsividad y estados de UI | Pruebas de snapshot para componentes en diferentes tamaños de pantalla |

## Migration / Rollout

**No migration required.** 
- El campo `deuda` se elimina del modelo Cliente pero no se usan datos existentes (ámbito de fase 4 asume datos limpios)
- Se elimina la columna mediante migración de Prisma (down migration disponible si fuera necesario)
- Los datos de clientes existentes se asumen nulos o se migrarán en fase anterior si fuera necesario
- El modelo Sequence se reutiliza sin cambios estructurales (solo se agregarán registros para type='CLIENTE')

## Open Questions

- [ ] ¿Debe el campo `limiteCredito` ser requerido para clientes que van a comprar a crédito (FIADO)? Actualmente es opcional.
- [ ] ¿Debería el sistema notificar automáticamente cuando un cliente se acerca al 80% de su límite de crédito?
- [ ] ¿Cómo manejar el caso donde un cliente tiene múltiplos domiciliarios registrando abonos simultáneamente? (Transacciones ya lo cubren)
- [ ] ¿Debe el historial de abonos mostrar el saldo restante después de cada abono? (Requiría cálculo acumulativo en consulta)
- [ ] ¿Se debería implementar paginación en la lista de clientes para grandes volúmenes de datos?