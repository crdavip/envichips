# Archive: routing-sin-prefijo-dashboard

## Status
✅ **Completado** — 9/9 tasks, build exitoso

## Resumen
Se eliminó el prefijo `/dashboard` de todas las rutas usando Route Groups de Next.js:
- `app/dashboard/` → `app/(dashboard)/`
- `app/page.tsx` eliminado (redirect ya no necesario)
- 56 referencias a `/dashboard/` actualizadas (links, revalidatePath, imports)
- ~25 archivos modificados
- Build exitoso, TypeScript limpio, 15 rutas sirviendo correctamente

## Rutas finales
```
/                    → Dashboard
/articulos           → Artículos
/articulos/[id]      → Detalle del artículo
/articulos/[id]/historial → Historial
/pedidos             → Pedidos
/pedidos/create      → Nuevo pedido
/pedidos/[id]        → Detalle del pedido
/pedidos/[id]/imprimir → Imprimir
/clientes            → Clientes
/clientes/[id]       → Detalle del cliente
/informes            → Informes
/informes/ventas     → Ventas
/informes/inventario → Inventario
/informes/caja       → Caja
/informes/ganancias  → Ganancias
/informes/domiciliarios → Domiciliarios
/login               → Login
```

## Artifacts
- `openspec/changes/routing-sin-prefijo-dashboard/proposal.md`
- `openspec/changes/routing-sin-prefijo-dashboard/delta-routing.md`
- `openspec/changes/routing-sin-prefijo-dashboard/design.md`
- `openspec/changes/routing-sin-prefijo-dashboard/tasks.md`
