# Ganancias Netas — SDD Spec

> Reporte de ganancias netas con filtro por rango de fechas. Solo accesible para SUPERADMIN.

## Requisitos Funcionales

### RF-01: Reporte de Ganancias Netas

El SUPERADMIN DEBE poder ver un reporte de ganancias netas con las siguientes métricas:

**Métricas calculadas:**
| Métrica | Cálculo | Fuente |
|---------|---------|--------|
| **Ganancia Bruta** | Suma de `ganancia` de PedidoItem en pedidos ENTREGADOS | `PedidoItem.ganancia` |
| **Costo de Ventas** | Suma de `costo` de PedidoItem en pedidos ENTREGADOS | `PedidoItem.costo` |
| **Gastos Operativos** | Suma de `monto` de Movimiento tipo GASTO (no eliminados) | `Movimiento.monto` |
| **Ganancia Neta** | `Ganancia Bruta - Gastos Operativos` | Cálculo |

### RF-02: Filtro por Rango de Fechas

El SUPERADMIN DEBE poder filtrar el reporte por:

- **Hoy** — desde inicio del día hasta fin del día
- **Esta semana** — desde lunes hasta domingo
- **Este mes** — desde 1ro del mes hasta fin del mes
- **Rango personalizado** — selector de fecha Desde / Hasta

**Reglas de negocio:**
- El rango por defecto DEBE ser "Hoy" (consistente con el comportamiento actual)
- Al cambiar el rango, las métricas DEBEN actualizarse inmediatamente
- Las fechas DEBEN manejarse en timezone Colombia (COT, UTC-5) usando `date-fns`

### RF-03: Visualización

El reporte DEBE mostrar:

- **4 cards** con las métricas principales (Ganancia Bruta, Costo Ventas, Gastos Operativos, Ganancia Neta) — exactamente como existe hoy
- **Selector de rango de fechas** visible arriba de las cards
- **Indicador de período** mostrando el rango actual (ej: "Hoy 4 de junio" o "Semana del 1 al 7 de junio")
- La card de Ganancia Neta DEBE colorearse verde si es positiva, roja si es negativa

### RF-04: Seguridad

- Solo usuarios con rol SUPERADMIN pueden ver la página
- Si un ADMIN o DOMICILIARIO intenta acceder, DEBE mostrar mensaje "No autorizado"

## Escenarios de Aceptación

### Escenario 1: Rango Semanal
```
Given: Usuario logueado con rol SUPERADMIN
When: Está en la página de ganancias
  AND Selecciona rango "Esta semana"
Then: Se muestran las 4 métricas para la semana actual
  AND La card de Ganancia Neta indica si es positiva o negativa
```

### Escenario 2: Rango Personalizado
```
Given: Usuario logueado con rol SUPERADMIN
When: Selecciona rango "Personalizado"
  AND Elige fecha Desde "2026-06-01" y Hasta "2026-06-15"
Then: Se muestran las métricas para ese período específico
```

### Escenario 3: Sin datos en el período
```
Given: Usuario logueado con rol SUPERADMIN
When: Selecciona un rango sin pedidos ni movimientos
Then: Todas las métricas muestran $0
  AND NO muestra errores
```

### Escenario 4: Admin intenta acceder
```
Given: Usuario logueado con rol ADMIN
When: Navega a /informes/ganancias
Then: Muestra "No autorizado"
  AND "Solo los usuarios SUPERADMIN pueden ver este reporte"
```

## Technical Notes

- Extender la función `getGanancias()` existente en `lib/services/informes.ts`
- El parámetro `dateRange` ya existe como patrón (ver `getVentas`, `getResumenDelDia`)
- Reutilizar el componente `GananciasCards.tsx` sin cambios
- Crear componente `DateRangeFilter` o reutilizar si ya existe un patrón
- El filtro DEBE ser un SERVER COMPONENT o usar search params para mantener la URL compartible
