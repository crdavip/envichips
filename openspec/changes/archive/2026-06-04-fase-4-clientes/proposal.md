# Proposal: Fase 4 - Gestión de Clientes

## Intent

Implementar el módulo completo de gestión de clientes (CRUD, cartera y deuda, registro de abonos, historial) según PRD Sección 8 para completar la funcionalidad de facturación y seguimiento de clientes en Envichips SaaS.

## Scope

### In Scope
- Rutas de Next.js para listado, creación, edición y detalle de clientes
- Server actions para operaciones CRUD y registro de abonos
- Servicio capa de lógica de negocio con Prisma
- Esquemas de validación Zod
- Componentes UI reutilizables (lista, formularios, detalle, diálogo de abono)
- Cálculo en tiempo real de deuda mediante agregación (pedidos FIADO - abonos)
- Historial de abonos y cambios en el detalle de cliente

### Out of Scope
- Migración de datos de clientes existentes (asumimos datos limpios o carga previa)
- Reportes avanzados de deuda histórica (se habilita pero no se implementan UI)
- Integración con módulos externos além de pedidos (facturas, etc.)
- Optimización de caché para cálculo de deuda (se empieza con tiempo real)

## Capabilities

> Esta sección es el CONTRATO entre proposal y specs. El agente sdd-spec lee esto para saber exactamente qué archivos spec crear o actualizar.
> Se investigaron openspec/specs/ para usar nombres correctos de capacidades existentes.

### Nuevas Capacidades
- `clientes-crud`: Operaciones completas de creación, lectura, actualización y eliminación de clientes
- `clientes-abono`: Registro, visualización y gestión de abonos a clientes
- `clientes-deuda`: Cálculo y visualización de deuda en tiempo real con alertas UI

### Capacidades Modificadas
- `pedidos-fiado`: Actualización para mostrar advertencia de deuda actual al crear pedidos FIADO (ya existente en pedidos spec)
- `dashboard-navegación`: Activación de enlaces existentes a /dashboard/clientes y acción rápida "Registrar Abono"

## Enfoque

Siguiendo los patrones establecidos en el módulo de articulos:
1. Estructura de rutas en app/dashboard/clientes/ con page.tsx para listado
2. Server actions en app/dashboard/clientes/actions.ts con "use server" y revalidatePath()
3. Servicio de negocio en lib/services/clientes.ts siguiendo patrón de articulos/pedidos
4. Validaciones Zod en lib/validations/clientes.ts
5. Componentes UI en components/clientes/ (ClienteList, ClienteForm, ClienteDetail, AbonoForm)
6. Cálculo de deuda en tiempo real mediante agregación Prisma (SUM pedidos FIADO - SUM abonos)
7. Registro de abono como diálogo dentro de ClienteDetail para mantener contexto

## Áreas Afectadas

| Area | Impact | Description |
|------|--------|-------------|
| `app/dashboard/clientes/` | Nuevo | Carpeta de rutas para módulo clientes |
| `app/dashboard/clientes/actions.ts` | Nuevo | Server actions para CRUD y abonos |
| `lib/services/clientes.ts` | Nuevo | Servicio de lógica de negocio |
| `lib/validations/clientes.ts` | Nuevo | Esquemas de validación Zod |
| `components/clientes/` | Nuevo | Carpeta de componentes UI reutilizables |
| `app/dashboard/pedidos/actions.ts` | Modificado | Añadir advertencia de deuda en crearPedidoAction para FIADO |
| `lib/services/pedidos.ts` | Modificado | Actualizar lógica para referencia de deuda al crear pedidos FIADO |

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Degradación de rendimiento al calcular deuda en tiempo real con crecimiento de datos | Media | Índices adecuados en Prisma (pedidos.metodoPago, abonos.clienteId); monitorear y considerar caché solo si necesario |
| Inconsistencia entre deuda calculada y estado real si se implementa caché futuro | Baja | Empezar sin caché; si se agrega, usar transacciones y eventos para mantener consistencia |
| Complejidad en manejo de casos edge (pagos parciales, límites de crédito) | Media | Definir claramente reglas de negocio en servicio; validaciones exhaustivas en Zod y server actions |

## Plan de Rollback

1. Eliminar rutas creadas: `app/dashboard/clientes/`
2. Eliminar archivos de servicio: `lib/services/clientes.ts`
3. Eliminar validaciones: `lib/validations/clientes.ts`
4. Eliminar componentes: `components/clientes/`
5. Revertir modificaciones en pedidos actions y services a estado anterior
6. Eliminar entrada de menú si se agregó (actualmente usan enlaces existentes)
7. Verificar que no queden referencias huérfanas en código o base de datos
8. Ejecutar migrar hacia abajo si se crearon tablas nuevas (no se espera, solo se usan modelos existentes)

## Dependencias

- Módulo de pedidos existente (para referencia de deuda y modelo Abono)
- Autenticación NextAuth.js v5 ya configurada
- Prisma ORM con modelos Cliente y Abono ya definidos
- Patrón establecido en módulo de articulos/pedidos para seguir

## Criterios de Éxito

- [ ] Usuario puede crear, leer, actualizar y eliminar clientes desde la UI
- [ ] Usuario puede registrar abonos a clientes y ver historial de abonos
- [ ] Deuda del cliente se calcula correctamente en tiempo real (pedidos FIADO - abonos)
- [ ] Al crear pedido FIADO, se muestra advertencia de deuda actual del cliente
- [ ] Todos los componentes responden correctamente en móvil y desktop
- [ ] Tests unitarios y de integración pasan para nuevas funciones
- [ ] No se introduce regresiones en módulos existentes (pedidos, articulos, dashboard)