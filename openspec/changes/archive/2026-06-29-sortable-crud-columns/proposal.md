# Propuesta: Columnas Ordenables en Listados CRUD

## Intención

Estandarizar el ordenamiento en los 8 listados del sistema (tabla + tarjetas móviles) usando un hook compartido, agregar controles de orden en vista mobile, y preparar el contrato de server actions para ordenamiento server-side futuro. Actualmente el ordenamiento es inconsistente: algunos componentes lo tienen parcial, otros es hardcoded, y ninguno expone controles en mobile.

## Alcance

### Incluye
- Hook `useSort<T>` compartido con configuración de campos, tipos y nulls-last
- Componente `SortBar`/dropdown para vista mobile en tarjetas
- Todas las columnas ordenables en cada tabla
- Parámetros `sortBy`/`sortOrder` en server actions (preparación sin implementar)

### Excluye
- `GananciasCards` (4 tarjetas de resumen, no es listado)
- Implementación server-side del ordenamiento

## Capacidades

### Nuevas
- `sort-hook`: Hook `useSort<T>` genérico con configuración de campos, accessors para campos computados (ganancia), policy nulls-last, y payload `{ sortBy, sortOrder }` para migración server-side
- `sort-controls`: Componente `SortBar`/`SortDropdown` para vista mobile

### Modificadas
- `articulos`: Expandir ordenamiento de 3 columnas (nombre, precio, stock) a 9 columnas (agregar categoría, presentación, costo, ganancia, estado)
- `clientes`: Especificar columnas ordenables y controles mobile
- `pedidos`: Reemplazar orden hardcoded por fecha descendente → orden seleccionable por cualquier columna en las 3 variantes
- `usuarios`: Agregar ordenamiento seleccionable (actualmente solo default por creación descendente)
- `informes`: Agregar columnas faltantes (nombre en Ventas/Domiciliarios, estado en Inventario, todas en Caja) y controles mobile

## Enfoque

Hook `useSort` recibe configuración de campos con tipo (`string|number|date`), accessor opcional para campos computados, y policy de nulls. Retorna datos ordenados, handlers de toggle y payload para server actions. Cada componente reemplaza su lógica inline. Se agrega `SortBar` antes del grid de tarjetas en mobile. CajaTable aplica sort antes del slice de paginación.

## Áreas Afectadas

| Archivo | Acción |
|---------|--------|
| `lib/hooks/useSort.ts` | CREAR |
| `components/ui/sort-controls.tsx` | CREAR |
| `components/articulos/ArticleList.tsx` | MODIFICAR |
| `components/clientes/ClienteList.tsx` | MODIFICAR |
| `components/pedidos/PedidoList.tsx` | MODIFICAR |
| `components/usuarios/UsuariosTable.tsx` | MODIFICAR |
| `components/informes/InventarioTable.tsx` | MODIFICAR |
| `components/informes/VentasTable.tsx` | MODIFICAR |
| `components/informes/DomiciliariosTable.tsx` | MODIFICAR |
| `components/informes/CajaTable.tsx` | MODIFICAR |
| Server actions (articulos, clientes, pedidos, usuarios) | MODIFICAR |
| `lib/services/informes.ts` | MODIFICAR |

## Riesgos

| Riesgo | Prob. | Mitigación |
|--------|-------|------------|
| PedidoList: 3 variantes de layout | Alta | Hook unificado: mismo estado de sort para todas |
| Fechas serializadas como ISO string | Alta | `new Date(v).getTime()` en comparator |
| Ganancia es computada (precio - costo) | Media | Accessor en config del hook |
| CajaTable: paginación + sort | Media | Sort antes del slice |
| Nulos en teléfono, última visita | Media | Policy nulls-last en hook |

## Plan de Rollback

Revertir el PR completo. Los cambios son aditivos (no alteran esquema DB ni lógica de negocio). Las server actions modificadas retienen compatibilidad hacia atrás (parámetros opcionales).

## Dependencias

Ninguna externa.

## Criterios de Éxito

- [ ] Los 8 componentes usan `useSort` con todas las columnas ordenables
- [ ] Controles de orden visibles en vista mobile (tarjetas)
- [ ] Nulls siempre al final en campos anulables
- [ ] Ganancia ordenable en ArticleList (computada antes de ordenar)
- [ ] Paginación de CajaTable funciona después del ordenamiento
- [ ] Server actions aceptan `{ sortBy, sortOrder }` como parámetros opcionales
