# Specs: Fase 5 — Dashboard (Delta)

> Envichips SaaS · Especificación delta
> Cambio: `fase-5-informes`
> Capacidad: `dashboard`

---

## Capability: dashboard

### Files affected

| File | Change |
|------|--------|
| `app/dashboard/page.tsx` | Modificado — reemplazar cards estáticas con datos reales |

### Changes from current

**Current state**: `app/dashboard/page.tsx` muestra 3 cards estáticas con valores fijos (`$0`) para Ventas del día, Ganancia del día y Pedidos pendientes. También incluye accesos rápidos hardcodeados. No consulta la base de datos.

**Target state**: El dashboard principal (`/dashboard`) consume datos reales desde `lib/services/informes.ts`. Cada card se carga con `Suspense` y fallback `Skeleton`. El layout existente y los accesos rápidos se mantienen sin cambios.

### Purpose
Reemplazar el dashboard estático (cards con $0) con métricas reales del negocio: ventas del día, ganancia, pedidos pendientes, stock bajo y clientes en deuda. Mantiene el layout y accesos rápidos actuales.

### Acceptance Criteria
- [ ] Las cards de métricas MUST cargar datos reales desde `getResumenAction()`
- [ ] Cada card individual MUST estar envuelta en `<Suspense>` con fallback `<Skeleton>`
- [ ] MUST mantener el layout existente (grid de cards + accesos rápidos)
- [ ] MUST mantener los accesos rápidos actuales sin cambios
- [ ] Las cards MUST mostrar:
  - Ventas del día (COP)
  - Ganancia del día (COP)
  - Pedidos pendientes (count)
  - Productos con stock bajo (count + hint "X productos")
  - Clientes en deuda (count)
- [ ] MUST usar `formatCOP()` existente para valores monetarios
- [ ] Las cards de alerta (stock bajo, deuda) MUST tener color distintivo
- [ ] MUST mostrar estado de carga (Skeleton) mientras se resuelven las promesas
- [ ] MUST manejar caso sin datos (0 en todas las métricas)
- [ ] NO MUST introducir cambios en el layout del dashboard existente
- [ ] NO MUST modificar los accesos rápidos ni su funcionamiento

### Technical Notes
- Server Component existente sigue siendo Server Component
- Extraer cards a componente `DashboardCardsGrid.tsx` (opcional) o inyectar data en cards inline
- Usar `Promise.all()` para resolver todas las queries en paralelo
- Skeleton cards: `<div className="h-24 w-full animate-pulse bg-gray-200 rounded-lg" />`
- Layout grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4` (el existente)

### Test Scenarios
1. **Carga con datos**: 3 pedidos ENTREGADO hoy, 2 PENDIENTES, 1 stock bajo → dashboard muestra valores reales en cada card
2. **Carga sin datos**: sin pedidos, sin stock bajo, sin deudas → todas las cards en 0
3. **Skeleton durante carga**: recargar página → skeletons visibles durante < 1s antes de mostrar datos reales
4. **Regresión en accesos rápidos**: accesos rápidos (Crear pedido, Ver artículos, etc.) siguen funcionando idéntico a antes
5. **Formato COP correcto**: ventas = 1500000 → card muestra `$1.500.000`
6. **Stock bajo con hint**: 3 productos con stock bajo → card muestra "3" con texto "3 productos por reabastecer"
