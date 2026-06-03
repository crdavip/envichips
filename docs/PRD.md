# PRD — Envichips SaaS
> Product Requirements Document · v1.1  
> Fecha: Junio 2026  
> Autor: [Cristian]  
> Estado: **Draft para revisión**
>
> **Cambios v1.1**: El domiciliario ya no crea pedidos — solo consulta los suyos, marca entregas y registra cobros. El Admin cierra el ciclo marcando el dinero como recibido. PostgreSQL local sin Docker.

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Contexto y Problema](#2-contexto-y-problema)
3. [Objetivos y Métricas de Éxito](#3-objetivos-y-métricas-de-éxito)
4. [Usuarios y Roles](#4-usuarios-y-roles)
5. [Arquitectura de Módulos](#5-arquitectura-de-módulos)
6. [Módulo: Artículos](#6-módulo-artículos)
7. [Módulo: Pedidos](#7-módulo-pedidos)
8. [Módulo: Clientes](#8-módulo-clientes)
9. [Módulo: Informes](#9-módulo-informes)
10. [Módulo: Usuarios (Admin)](#10-módulo-usuarios-admin)
11. [Facturación e Impresión](#11-facturación-e-impresión)
12. [Modelo de Datos](#12-modelo-de-datos)
13. [Requerimientos No Funcionales](#13-requerimientos-no-funcionales)
14. [Stack Tecnológico](#14-stack-tecnológico)
15. [Fuera de Alcance (v1)](#15-fuera-de-alcance-v1)
16. [Plan de Fases](#16-plan-de-fases)
17. [Riesgos y Mitigaciones](#17-riesgos-y-mitigaciones)

---

## 1. Resumen Ejecutivo

**Envichips SaaS** es una aplicación web Mobile-First de punto de venta y gestión de negocio diseñada específicamente para **Envichips**, una empresa distribuidora de snacks con sede en Colombia. La plataforma reemplaza un flujo de trabajo 100% manual en Excel —con hojas de Productos, Compras, Ventas, Inventario, Domicilios, Clientes y Movimientos de caja— por una solución centralizada, en tiempo real, accesible desde celular y computador.

La referencia de experiencia de usuario es **Square POS**, adoptando únicamente los módulos de **Pedidos, Informes, Artículos y Clientes**, adaptados al modelo de negocio de distribución de Envichips (ventas por domicilio, cartera de clientes, múltiples domiciliarios, divisa COP).

---

## 2. Contexto y Problema

### 2.1 Situación actual

El equipo de Envichips gestiona hoy la operación completa en un archivo Excel con las siguientes hojas:

| Hoja Excel         | Propósito actual                                                 | Problema principal                                  |
|--------------------|------------------------------------------------------------------|-----------------------------------------------------|
| `Productos`        | Catálogo con costo, precio y ganancia por presentación           | Sin control de versiones ni historial de precios    |
| `Compras`          | Registro manual de entradas de mercancía                         | Fórmulas frágiles, sin validación de cantidades     |
| `Ventas`           | Registro manual de salidas de producto por fecha                 | Sin vínculo directo con pedidos o clientes          |
| `Inventario`       | Stock calculado por diferencia entrada/salida                    | No es tiempo real; depende de actualización manual  |
| `Domicilios`       | Pedidos por domiciliario, cliente, valor y estado                | Sin impresión de factura, sin asignación formal     |
| `Clientes`         | Lista de clientes con deuda y estado (EN DEUDA / AL DÍA)         | Sin historial de pagos detallado por pedido         |
| `Movimientos`      | Caja: ingresos, gastos y préstamos con descripción libre         | Sin categorías formales, conciliación imposible     |
| `Horario`          | Horas trabajadas y efectivo por domiciliario                     | Cálculos manuales susceptibles a errores            |
| `Ganancias`        | Resumen diario de ganancia y distribución entre socios           | Depende de todas las hojas anteriores siendo exactas|
| `Estado Financiero`| Panorama macro del negocio                                       | Estático, requiere actualización manual             |

### 2.2 Dolores clave identificados

- **Duplicación de datos**: el mismo producto aparece en Compras, Ventas, Inventario y Ganancias.
- **Riesgo operacional**: una celda editada por error afecta en cascada toda la contabilidad.
- **Sin impresión de facturas**: los domiciliarios anotan pedidos a mano o en mensajes de WhatsApp.
- **Cartera desactualizada**: los abonos de clientes se registran manualmente sin un historial estructurado.
- **Nula visibilidad en tiempo real**: el dueño no puede ver el estado del negocio desde el celular mientras los domiciliarios están en calle.

---

## 3. Objetivos y Métricas de Éxito

### 3.1 Objetivos de negocio

| # | Objetivo                                                                           |
|---|------------------------------------------------------------------------------------|
| O1| Eliminar la dependencia del archivo Excel para la gestión diaria del negocio       |
| O2| Que el domiciliario consulte sus pedidos asignados, marque entregas y gestione cobros desde su celular sin capacitación|
| O3| El Admin vea inventario, caja y cartera en tiempo real desde cualquier dispositivo  |
| O4| Generar informes semanales/mensuales automáticos que hoy toman horas de trabajo     |

### 3.2 Métricas de éxito (KPIs)

| Métrica                                               | Meta al 3er mes de uso |
|-------------------------------------------------------|------------------------|
| Tiempo para consultar y marcar un pedido como entregado (domiciliario) | < 1 minuto             |
| Tiempo para generar informe semanal                   | < 30 segundos          |
| Errores de inventario por conciliación                | 0 (automatizado)       |
| Adopción por domiciliarios                            | 100% (todos los activos)|
| Facturas impresas correctamente desde móvil           | > 95% de los pedidos   |

---

## 4. Usuarios y Roles

El sistema **no permite registro público**. El SuperAdmin crea y gestiona todos los usuarios.

### 4.1 Definición de roles

| Rol           | Descripción                                                                                  | Alcance de acceso                                   |
|---------------|----------------------------------------------------------------------------------------------|-----------------------------------------------------|
| `SuperAdmin`  | Dueño o socio principal del negocio. Acceso total al sistema.                                | Todo                                                |
| `Admin`       | Persona de confianza que gestiona la operación diaria (puede ser el mismo dueño).            | Todo excepto gestión de usuarios SuperAdmin          |
| `Domiciliario`| Repartidor de pedidos. Solo consulta sus pedidos asignados, marca entregas y registra si cobró el dinero al cliente. No crea pedidos.| Solo sus pedidos asignados |

### 4.2 Matriz de permisos

| Funcionalidad                                      | SuperAdmin | Admin | Domiciliario |
|----------------------------------------------------|:----------:|:-----:|:------------:|
| Crear/editar/eliminar artículos                    | ✅         | ✅    | ❌           |
| Ver catálogo de artículos                          | ✅         | ✅    | ❌           |
| Ver stock de inventario                            | ✅         | ✅    | ❌           |
| Registrar compras (entradas)                       | ✅         | ✅    | ❌           |
| Crear pedido                                       | ✅         | ✅    | ❌           |
| Asignar domiciliario a un pedido                   | ✅         | ✅    | ❌           |
| Ver todos los pedidos                              | ✅         | ✅    | ❌           |
| Ver solo sus pedidos asignados                     | ✅         | ✅    | ✅           |
| Marcar pedido como en camino                       | ✅         | ✅    | ✅           |
| Marcar pedido como entregado + registrar cobro     | ✅         | ✅    | ✅           |
| Confirmar recepción de dinero del domiciliario     | ✅         | ✅    | ❌           |
| Imprimir factura de pedido                         | ✅         | ✅    | ✅           |
| Crear/editar clientes                              | ✅         | ✅    | ❌           |
| Ver clientes y cartera                             | ✅         | ✅    | ❌           |
| Registrar abonos de clientes                       | ✅         | ✅    | ❌           |
| Ver informes de ventas                             | ✅         | ✅    | ❌           |
| Ver informes financieros                           | ✅         | ❌    | ❌           |
| Gestionar usuarios                                 | ✅         | ❌    | ❌           |
| Configuración global del negocio                   | ✅         | ❌    | ❌           |

---

## 5. Arquitectura de Módulos

```
┌─────────────────────────────────────────────────────────┐
│                    ENVICHIPS SAAS                        │
├──────────────┬──────────────┬──────────────┬────────────┤
│  ARTÍCULOS   │   PEDIDOS    │   CLIENTES   │  INFORMES  │
│              │              │              │            │
│ • Catálogo   │ • Crear      │ • Registro   │ • Ventas   │
│ • Inventario │ • Asignar    │ • Cartera    │ • Compras  │
│ • Compras    │ • Imprimir   │ • Historial  │ • Inv.     │
│ • Precios    │ • Seguimiento│ • Abonos     │ • Caja     │
│              │ • Cobros     │              │ • Ganancias│
└──────────────┴──────────────┴──────────────┴────────────┘
                      ↕                      
         ┌────────────────────────┐
         │   USUARIOS (Admin)     │
         │ • Crear usuarios       │
         │ • Roles y permisos     │
         └────────────────────────┘
```

---

## 6. Módulo: Artículos

### 6.1 Descripción

Gestión completa del catálogo de productos de Envichips, control de inventario en tiempo real y registro de compras (entradas de mercancía al inventario).

### 6.2 Estructura de un Artículo

Basado en el archivo Excel (`Hoja: Productos`), cada artículo tiene:

| Campo            | Tipo       | Descripción                                             | Ejemplo               |
|------------------|------------|---------------------------------------------------------|-----------------------|
| `id`             | UUID       | Identificador único                                     | —                     |
| `nombre`         | String     | Nombre descriptivo del producto                         | Papa Limón 65g        |
| `categoria`      | Enum       | Categoría del producto                                  | `PAPA`, `PLATANO`, etc.|
| `presentacion`   | Enum       | Tamaño/peso del empaque                                 | `65G`, `250G`, `500G` |
| `costo`          | Int (COP)  | Precio de compra al proveedor                           | 2250                  |
| `precio`         | Int (COP)  | Precio de venta al cliente                              | 2800                  |
| `ganancia`       | Int (COP)  | Campo calculado: `precio - costo` (solo lectura)        | 550                   |
| `stockActual`    | Int        | Unidades disponibles (calculado automáticamente)        | 150                   |
| `stockMinimo`    | Int        | Alerta de stock bajo (equivale al campo "sueño")        | 100                   |
| `activo`         | Boolean    | Permite ocultar productos sin eliminarlos               | true                  |
| `creadoEn`       | DateTime   | Timestamp de creación                                   | —                     |

**Categorías disponibles:** `PAPA`, `PLATANO`, `MADURO`, `CHICHARRON`, `ROSQUITA`, `ROSCA`, `DETODITO`, `ARITOS`, `OTRO`

### 6.3 Funcionalidades requeridas

**6.3.1 Listado de artículos**
- Vista en grilla (mobile) y tabla (desktop)
- Filtro por categoría y presentación
- Ordenar por nombre, precio, stock
- Indicador visual de stock bajo (cuando `stockActual < stockMinimo`)
- Buscador por nombre en tiempo real
- Badge de estado: `Stock OK` (verde) · `Stock Bajo` (amarillo) · `Sin Stock` (rojo)

**6.3.2 Crear / Editar artículo**
- Formulario con todos los campos del artículo
- El campo `ganancia` se calcula automáticamente y es de solo lectura
- Validación: precio debe ser mayor al costo
- Confirmación antes de eliminar (soft delete: `activo = false`)

**6.3.3 Inventario — Registrar Entrada (Compra)**

Basado en `Hoja: Compras`. Cuando llega mercancía del proveedor:

| Campo           | Tipo     | Descripción                                           |
|-----------------|----------|-------------------------------------------------------|
| `fecha`         | Date     | Fecha de la compra                                    |
| `proveedor`     | String   | Nombre del proveedor (libre, ej: "Frades", "Tucanas") |
| `items`         | Array    | Lista de productos con cantidad y costo unitario      |
| `totalCompra`   | Int(COP) | Suma total pagada                                     |
| `metodoPago`    | Enum     | `EFECTIVO` · `TRANSFERENCIA`                          |
| `observaciones` | String?  | Notas adicionales                                     |

- Al confirmar la compra, el `stockActual` de cada artículo se incrementa automáticamente.
- La compra queda registrada en el historial de movimientos (visible en Informes).

**6.3.4 Historial de inventario**
- Por artículo: ver entradas (compras), salidas (pedidos) y stock actual.
- Timeline de movimientos con fecha, tipo (entrada/salida), cantidad y referencia del pedido o compra.

### 6.4 UX / UI Notes

- **Mobile**: las tarjetas de artículos muestran nombre, precio, ganancia y stock. El stock bajo muestra un ícono de alerta.
- **Desktop**: tabla con todas las columnas visibles, acciones inline (editar, inactivar).
- **Flujo de compra**: modal de 2 pasos — (1) seleccionar productos y cantidades, (2) confirmar totales y método de pago.

---

## 7. Módulo: Pedidos

### 7.1 Descripción

El corazón operativo de Envichips. Gestiona los pedidos de domicilio desde su creación hasta la entrega, con generación de factura imprimible. Reemplaza la `Hoja: Domicilios` y complementa `Hoja: Ventas`.

### 7.2 Estructura de un Pedido

| Campo                 | Tipo       | Descripción                                                         |
|-----------------------|------------|---------------------------------------------------------------------|
| `id`                  | UUID       | Identificador único del pedido                                      |
| `numeroPedido`        | String     | Número legible autogenerado: `ENV-2026-00001`                       |
| `fecha`               | DateTime   | Fecha y hora de creación                                            |
| `cliente`             | FK         | Referencia al cliente (opcional: puede ser "Venta rápida")          |
| `domiciliario`        | FK (User)  | Usuario domiciliario asignado                                       |
| `items`               | Array      | Productos, cantidades y precios del pedido                          |
| `subtotal`            | Int (COP)  | Suma de items                                                       |
| `descuento`           | Int (COP)  | Descuento aplicado (opcional)                                       |
| `total`               | Int (COP)  | `subtotal - descuento`                                              |
| `metodoPago`          | Enum       | `EFECTIVO` · `TRANSFERENCIA` · `FIADO`                              |
| `estado`              | Enum       | Ver estados abajo                                                   |
| `dineroCobrado`       | Boolean?   | El domiciliario indica si recibió el dinero del cliente al entregar |
| `montoCobrado`        | Int? (COP) | Monto que realmente recibió el domiciliario (puede diferir del total si hubo cambio) |
| `pagoEntregadoAdmin`  | Boolean    | `false` por defecto. El Admin lo marca cuando el domiciliario le entrega el efectivo |
| `pagoEntregadoEn`     | DateTime?  | Timestamp del momento en que el Admin confirmó recibir el dinero    |
| `observaciones`       | String?    | Notas del domiciliario o admin                                      |
| `creadoPor`           | FK (User)  | Usuario que creó el pedido                                          |
| `creadoEn`            | DateTime   | Timestamp                                                           |

**Estados del pedido:**

```
PENDIENTE → EN_CAMINO → ENTREGADO
                ↓
            CANCELADO
```

| Estado      | Descripción                                                              | Quién puede cambiar       |
|-------------|--------------------------------------------------------------------------|---------------------------|
| `PENDIENTE` | Pedido creado y asignado, el domiciliario aún no lo ha tomado            | Admin / SuperAdmin        |
| `EN_CAMINO` | Domiciliario confirmó que salió con el pedido                            | Domiciliario / Admin      |
| `ENTREGADO` | Pedido entregado. Domiciliario indica si cobró dinero y cuánto           | Domiciliario / Admin      |
| `CANCELADO` | Pedido anulado. No descuenta inventario                                  | Admin / SuperAdmin        |

> **Ciclo de cobro de efectivo** (separado del estado de entrega):
> 1. Al marcar `ENTREGADO`, el domiciliario indica si cobró (`dineroCobrado: true/false`) y el monto (`montoCobrado`).
> 2. El campo `pagoEntregadoAdmin` permanece en `false` hasta que el domiciliario entregue físicamente el dinero al Admin.
> 3. El **Admin** (o SuperAdmin) cambia `pagoEntregadoAdmin: true` confirmando que recibió el efectivo.
>
> **Regla de inventario**: el stock se descuenta automáticamente cuando el pedido pasa a `ENTREGADO`.

### 7.3 Items de un Pedido

| Campo        | Tipo    | Descripción                           |
|--------------|---------|---------------------------------------|
| `articulo`   | FK      | Referencia al artículo                |
| `cantidad`   | Int     | Unidades pedidas                      |
| `precio`     | Int(COP)| Precio al momento del pedido (snapshot)|
| `costo`      | Int(COP)| Costo al momento (para calcular ganancia)|
| `subtotal`   | Int(COP)| `cantidad × precio`                   |
| `ganancia`   | Int(COP)| `cantidad × (precio - costo)`         |

> El precio y costo se guardan como snapshot para que reportes históricos no se afecten si los precios cambian.

### 7.4 Funcionalidades requeridas

**7.4.1 Crear pedido (Flujo principal)**

El flujo está optimizado para mobile (domiciliario creando el pedido desde el celular en casa del cliente o antes de salir):

1. **Paso 1 — Cliente**: seleccionar cliente existente o escribir nombre para "venta rápida" sin cliente registrado.
2. **Paso 2 — Productos**: buscador de artículos con imagen de texto (nombre + presentación). Teclado numérico para cantidad. Ver subtotal actualizado en tiempo real.
3. **Paso 3 — Resumen**: total del pedido, campo de descuento (opcional), método de pago, domiciliario asignado, observaciones.
4. **Confirmación**: vista previa de la factura → botón **Confirmar y Guardar** + opción **Imprimir**.

> Si el método de pago es `FIADO`, el monto se agrega automáticamente a la deuda del cliente en el módulo de Clientes.

**7.4.2 Listado de pedidos**

- **Para Domiciliario**: solo ve sus pedidos del día actual. Vista de tarjetas con estado visible.
- **Para Admin/SuperAdmin**: ve todos los pedidos, con filtros por fecha, domiciliario, estado y cliente.
- Indicadores de color por estado: Pendiente (gris), En Camino (amarillo), Entregado (verde), Cancelado (rojo).
- Paginación o scroll infinito.

**7.4.3 Detalle del pedido**

- Ver todos los items, totales, datos del cliente y domiciliario.
- Botón para cambiar estado (según rol y estado actual).
- Botón de **Imprimir Factura** siempre visible.
- Historial de cambios de estado con timestamp y usuario.

**7.4.4 Editar pedido**

- Solo disponible en estado `PENDIENTE`.
- Admin/SuperAdmin pueden editar cualquier pedido pendiente.
- No se puede editar un pedido `ENTREGADO` o `CANCELADO` (se debe anular y recrear).

**7.4.5 Cancelar pedido**

- Requiere confirmación + motivo de cancelación (texto libre).
- Si estaba en `EN_CAMINO`, se revierte el inventario descontado.
- Registro del motivo queda en historial.

**7.4.6 Venta Directa (sin domicilio)**

- El Admin puede registrar pedidos de mostrador o venta directa sin asignar domiciliario.
- Campo `domiciliario` queda como `null` y el pedido va directo a `ENTREGADO`.

### 7.5 UX / UI Notes

- **Mobile-First crítico aquí**: el domiciliario debe poder crear un pedido completo en 2 minutos con una mano.
- El selector de artículos debe funcionar con un scroll rápido y teclado numérico nativo.
- El botón de "Agregar producto" debe ser un FAB (floating action button) visible en todo momento.
- **Sin internet**: idealmente con soporte offline básico (PWA con service worker) para registrar pedidos y sincronizar al recuperar conexión — _nice to have v1.5_.

---

## 8. Módulo: Clientes

### 8.1 Descripción

Registro y gestión de clientes con seguimiento de cartera (crédito / deuda). Reemplaza la `Hoja: Clientes` y el registro de abonos disperso en `Hoja: Movimientos`.

### 8.2 Estructura de un Cliente

| Campo           | Tipo       | Descripción                                             | Ejemplo                    |
|-----------------|------------|---------------------------------------------------------|----------------------------|
| `id`            | UUID       | Identificador único                                     | —                          |
| `idCliente`     | String     | Código legible: `CLI-1001`                              | CLI-1001                   |
| `nombreCompleto`| String     | Nombre del negocio o persona                            | Isaac Arguelles            |
| `telefono`      | String?    | Número de contacto                                      | 3162548104                 |
| `direccion`     | String?    | Dirección de entrega habitual                           | Cr 39a #40f sur 02         |
| `tipoDoc`       | Enum?      | CC · TI · CE · NIT · Pasaporte                          | CC                         |
| `numeroDoc`     | String?    | Número del documento                                    | —                          |
| `estado`        | Enum       | `AL_DIA` · `EN_DEUDA`                                   | EN_DEUDA                   |
| `deuda`         | Int (COP)  | Saldo de deuda actual (calculado automáticamente)       | 1000000                    |
| `limiteCredito` | Int? (COP) | Monto máximo de crédito permitido (configurable)        | 500000                     |
| `activo`        | Boolean    | Soft delete                                             | true                       |
| `creadoEn`      | DateTime   | —                                                       | —                          |
| `notas`         | String?    | Observaciones generales del cliente                     | —                          |

### 8.3 Cartera y Deuda

La deuda de un cliente es la suma de todos sus pedidos en estado `FIADO` menos sus abonos. Se calcula en tiempo real.

```
deudaActual = Σ(pedidos FIADO entregados) - Σ(abonos registrados)
estado = deudaActual > 0 ? "EN_DEUDA" : "AL_DIA"
```

**Abono / Pago:**

| Campo        | Tipo       | Descripción                    |
|--------------|------------|--------------------------------|
| `cliente`    | FK         | Cliente que paga               |
| `monto`      | Int (COP)  | Valor del abono                |
| `fecha`      | DateTime   | Fecha del abono                |
| `metodoPago` | Enum       | `EFECTIVO` · `TRANSFERENCIA`   |
| `registradoPor` | FK      | Usuario que lo registró        |
| `notas`      | String?    | Descripción libre              |

### 8.4 Funcionalidades requeridas

**8.4.1 Listado de clientes**
- Filtro rápido: Todos · Al Día · En Deuda
- Buscador por nombre, teléfono o dirección
- Vista de tarjeta (mobile): nombre, teléfono, estado (badge) y deuda actual
- Vista de tabla (desktop): todas las columnas
- Ordenar por deuda (mayor a menor) para priorizar cobros

**8.4.2 Ficha del cliente**
- Datos completos del cliente
- Resumen de deuda: monto total, fecha del último pedido, fecha del último abono
- **Historial de pedidos**: todos los pedidos del cliente con fecha, total, estado de pago y estado de entrega
- **Historial de abonos**: fecha, monto, método de pago y quién lo registró
- Botón **Registrar Abono** (acceso rápido desde la ficha)

**8.4.3 Registrar abono**
- Modal simple: monto, método de pago, fecha (default: hoy), notas
- Muestra la deuda antes y después del abono
- No permite ingresar un abono mayor a la deuda actual (validación con confirmación si se desea sobrepagar)

**8.4.4 Alertas de cartera**
- El Admin ve un resumen en el dashboard: "X clientes en deuda · Total a cobrar: $COP"
- En la ficha del cliente, alerta si supera el límite de crédito configurado
- No bloquea ventas automáticamente (decisión del Admin), pero muestra advertencia visible

**8.4.5 Crear / Editar cliente**
- Formulario con todos los campos
- Validación de teléfono (formato colombiano)
- Posibilidad de registrar una deuda inicial (migración desde Excel)

### 8.5 UX / UI Notes

- El badge de estado debe ser visible y con color fuerte: rojo para EN_DEUDA, verde para AL_DÍA.
- La deuda actual debe mostrarse siempre en formato COP con separadores de miles: `$1.500.000`.
- Al crear un pedido en modo `FIADO`, el sistema debe mostrar la deuda actual del cliente como contexto.

---

## 9. Módulo: Informes

### 9.1 Descripción

Panel de reportes y análisis del negocio. Consolida la información de los módulos de Pedidos, Artículos y Clientes. Reemplaza las hojas `Ventas`, `Ganancias`, `Movimientos` y `Estado Financiero`.

### 9.2 Filtros globales

Todos los informes tienen los siguientes filtros disponibles:

- **Rango de fechas**: Hoy · Esta semana · Este mes · Rango personalizado
- **Domiciliario**: Todos · Individual (filtrar por ruta)
- **Exportar**: Botón para descargar el reporte activo en PDF o CSV

### 9.3 Informe: Resumen del Día (Dashboard principal)

Visible al ingresar para Admin y SuperAdmin. Muestra:

| Métrica                        | Descripción                                            |
|-------------------------------|--------------------------------------------------------|
| Ventas del día                | Total en COP de pedidos entregados hoy                 |
| Ganancia del día              | Suma de ganancias de todos los pedidos entregados hoy  |
| Pedidos entregados            | Cantidad de pedidos completados                        |
| Pedidos pendientes            | Cantidad en estado PENDIENTE o EN_CAMINO               |
| Productos con stock bajo      | Lista rápida de artículos bajo el mínimo               |
| Clientes en deuda hoy         | Nuevas deudas generadas (pedidos FIADO de hoy)         |
| Total a cobrar (cartera)      | Deuda acumulada de todos los clientes                  |

### 9.4 Informe: Ventas

Basado en `Hoja: Ventas` y `Hoja: Ganancias`.

**Tabla de ventas por producto:**

| Columna                  | Descripción                                          |
|--------------------------|------------------------------------------------------|
| Producto                 | Nombre y presentación                                |
| Unidades vendidas        | Total de unidades en el período                      |
| Ingresos (COP)           | Total facturado por el producto                      |
| Ganancia (COP)           | `Σ (precio - costo) × cantidad`                      |
| % del total de ventas    | Participación en ventas totales                      |

**Resumen del período:**
- Total vendido (COP)
- Total ganancia (COP)
- Producto más vendido (unidades)
- Producto más rentable (ganancia COP)
- Gráfico de barras: top 10 productos por ingreso (desktop)

**Por domiciliario:**
- Filtrar tabla por domiciliario para ver el rendimiento de cada ruta

### 9.5 Informe: Inventario

| Columna          | Descripción                                                   |
|------------------|---------------------------------------------------------------|
| Producto         | Nombre y presentación                                         |
| Ingresos         | Unidades compradas en el período                              |
| Egresos          | Unidades vendidas (pedidos ENTREGADOS) en el período          |
| Stock actual     | Unidades disponibles ahora                                    |
| Stock mínimo     | Valor de alerta configurado                                   |
| Estado           | Stock OK · Stock Bajo · Sin Stock                             |
| Valor inventario | `stockActual × costo` (valorización del inventario actual)    |

**Resumen:**
- Total unidades en inventario
- Valor total del inventario a costo (COP)
- Lista de productos agotados o bajo mínimo

### 9.6 Informe: Movimientos de Caja

Basado en `Hoja: Movimientos`. Reemplaza el registro manual de ingresos y gastos.

**Registro de movimiento:**

| Campo           | Tipo     | Descripción                                           |
|-----------------|----------|-------------------------------------------------------|
| `fecha`         | DateTime | Fecha del movimiento                                  |
| `tipo`          | Enum     | `INGRESO` · `GASTO` · `PRESTAMO`                      |
| `categoria`     | Enum     | `COMPRA_MERCANCIA` · `PAGO_DOMICILIARIO` · `ARRIENDO` · `SERVICIOS` · `PRESTAMO` · `OTRO` |
| `monto`         | Int(COP) | Valor en COP                                          |
| `descripcion`   | String   | Texto libre descriptivo                               |
| `metodoPago`    | Enum     | `EFECTIVO` · `TRANSFERENCIA`                          |
| `registradoPor` | FK       | Usuario que lo registró                               |

**Vista del informe:**
- Tabla de movimientos del período con filtros por tipo y categoría
- Resumen: Total Ingresos vs Total Gastos → **Flujo neto del período**
- Saldo de caja actual (calculado desde el inicio del historial)

> **Nota**: Los abonos de clientes y los pagos de pedidos FIADO se registran automáticamente como `INGRESO`. Las compras de mercancía se registran como `GASTO` al confirmar una entrada de inventario. Los movimientos manuales (arriendo, gastos varios) los registra el Admin directamente aquí.

### 9.7 Informe: Ganancias (Solo SuperAdmin)

Basado en `Hoja: Ganancias`. Vista del desempeño financiero del negocio.

| Métrica                       | Descripción                                          |
|-------------------------------|------------------------------------------------------|
| Ganancia bruta del período    | Suma de ganancias de todos los pedidos entregados    |
| Costo de ventas               | Suma de costos de los productos vendidos             |
| Gastos operativos             | Total de gastos registrados en Movimientos           |
| **Ganancia neta**             | `Ganancia bruta - Gastos operativos`                 |
| Comparativo vs período anterior| Variación porcentual                                |

**Distribución de ganancias (si aplica):**
- El SuperAdmin puede configurar porcentajes de distribución entre socios (ej: 60% Envichips / 40% domiciliarios). Esta configuración alimenta el cálculo de liquidación de cada domiciliario.

### 9.8 Informe: Domiciliarios

Vista del rendimiento por domiciliario en el período.

| Columna                  | Descripción                                     |
|--------------------------|-------------------------------------------------|
| Domiciliario             | Nombre                                          |
| Pedidos entregados       | Cantidad                                        |
| Total vendido (COP)      | Suma de pedidos entregados                      |
| Efectivo recolectado     | Total cobrado en efectivo                       |
| Transferencias           | Total cobrado por transferencia                 |
| Pedidos cancelados       | Cantidad                                        |

---

## 10. Módulo: Usuarios (Admin)

### 10.1 Descripción

Gestión de acceso al sistema. Solo el SuperAdmin puede crear, editar y desactivar usuarios. **No existe registro público ni botón de "Crear cuenta"**.

### 10.2 Estructura de un Usuario

| Campo         | Tipo     | Descripción                                  |
|---------------|----------|----------------------------------------------|
| `id`          | UUID     | Identificador único                           |
| `nombre`      | String   | Nombre completo                               |
| `email`       | String   | Email para inicio de sesión (único)           |
| `password`    | String   | Hash bcrypt                                   |
| `rol`         | Enum     | `SUPERADMIN` · `ADMIN` · `DOMICILIARIO`       |
| `activo`      | Boolean  | Soft delete (desactivar sin borrar historial) |
| `telefono`    | String?  | Contacto del domiciliario                     |
| `creadoPor`   | FK       | SuperAdmin que lo creó                        |
| `creadoEn`    | DateTime | Timestamp                                     |
| `ultimoAcceso`| DateTime | Registro del último login                     |

### 10.3 Funcionalidades

- **Listar usuarios**: tabla con nombre, email, rol, estado (activo/inactivo) y último acceso.
- **Crear usuario**: formulario con nombre, email, contraseña temporal, rol y teléfono.
- **Editar usuario**: actualizar datos, cambiar rol, resetear contraseña.
- **Desactivar usuario**: soft delete. El historial de pedidos y movimientos no se elimina.
- **Cambiar contraseña**: el usuario puede cambiar su propia contraseña desde configuración de perfil.
- **No existe recuperación de contraseña por email en v1**: el SuperAdmin la resetea manualmente.

---

## 11. Facturación e Impresión

### 11.1 Requisito crítico

Todos los pedidos deben poder imprimirse desde **cualquier dispositivo** (celular y PC) sin instalación de drivers ni software adicional. Se usa `window.print()` con una hoja de estilos CSS específica para impresión (`@media print`).

### 11.2 Diseño de la Factura

La factura debe funcionar con **impresoras térmicas de 58mm y 80mm** (las más comunes en Colombia) y también con impresoras estándar A4.

**Contenido de la factura:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━
        ENVICHIPS
    Distribución de Snacks
    Tel: [configurado]
━━━━━━━━━━━━━━━━━━━━━━━━━
Pedido:  ENV-2026-00123
Fecha:   02/06/2026 14:35
Cliente: Isaac Arguelles
Domiciliario: Julian
━━━━━━━━━━━━━━━━━━━━━━━━━
CANT  PRODUCTO          TOTAL
━━━━━━━━━━━━━━━━━━━━━━━━━
  30  Papa Limón 65g   $84.000
  20  Chicharrón Nat.  $50.000
  15  Rosca 50g        $37.500
━━━━━━━━━━━━━━━━━━━━━━━━━
         SUBTOTAL:    $171.500
         DESCUENTO:        $0
━━━━━━━━━━━━━━━━━━━━━━━━━
           TOTAL:     $171.500
     Pago: EFECTIVO
━━━━━━━━━━━━━━━━━━━━━━━━━
  ¡Gracias por su compra!
━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 11.3 Implementación técnica

- Ruta dedicada `/pedidos/[id]/imprimir` que renderiza solo la factura (sin navbar ni sidebar).
- CSS con `@media print { body { font-family: monospace; width: 58mm; } }` para térmicas.
- Desde el detalle del pedido: botón **🖨 Imprimir** → nueva pestaña → `window.print()` automático.
- Desde mobile: el navegador nativo maneja la impresión vía Bluetooth o WiFi a la impresora.
- **Formato de moneda**: siempre en COP con separadores de miles: `$2.800` (sin decimales, por convención colombiana para snacks).

---

## 12. Modelo de Datos

### 12.1 Diagrama de entidades (simplificado)

```
User ──────────────────┐
 └── Pedido ────────── PedidoItem ──── Articulo
      └── Cliente              └── CompraItem ── Compra
           └── Abono
                        
Movimiento (caja)
Articulo ──── Categoria
```

### 12.2 Esquema Prisma (referencia)

```prisma
// ─── USUARIOS ───────────────────────────────────────────
model User {
  id           String    @id @default(uuid())
  nombre       String
  email        String    @unique
  password     String
  rol          Rol       @default(DOMICILIARIO)
  activo       Boolean   @default(true)
  telefono     String?
  ultimoAcceso DateTime?
  creadoEn     DateTime  @default(now())
  creadoPorId  String?
  creadoPor    User?     @relation("UserCreador", fields: [creadoPorId], references: [id])
  pedidosCreados Pedido[] @relation("PedidoCreador")
  pedidosAsignados Pedido[] @relation("PedidoDomiciliario")
}

enum Rol {
  SUPERADMIN
  ADMIN
  DOMICILIARIO
}

// ─── ARTÍCULOS ──────────────────────────────────────────
model Articulo {
  id           String       @id @default(uuid())
  nombre       String
  categoria    Categoria
  presentacion Presentacion
  costo        Int          // en COP
  precio       Int          // en COP
  stockActual  Int          @default(0)
  stockMinimo  Int          @default(0)
  activo       Boolean      @default(true)
  creadoEn     DateTime     @default(now())
  pedidoItems  PedidoItem[]
  compraItems  CompraItem[]
}

enum Categoria {
  PAPA
  PLATANO
  MADURO
  CHICHARRON
  ROSQUITA
  ROSCA
  DETODITO
  ARITOS
  OTRO
}

enum Presentacion {
  G50
  G65
  G250
  G500
  OTRO
}

// ─── CLIENTES ───────────────────────────────────────────
model Cliente {
  id             String   @id @default(uuid())
  idCliente      String   @unique // CLI-1001
  nombreCompleto String
  telefono       String?
  direccion      String?
  tipoDoc        TipoDoc?
  numeroDoc      String?
  deuda          Int      @default(0) // calculado, COP
  limiteCredito  Int?     // COP
  activo         Boolean  @default(true)
  notas          String?
  creadoEn       DateTime @default(now())
  pedidos        Pedido[]
  abonos         Abono[]
}

enum TipoDoc { CC TI CE NIT PASAPORTE }

model Abono {
  id             String    @id @default(uuid())
  clienteId      String
  cliente        Cliente   @relation(fields: [clienteId], references: [id])
  monto          Int       // COP
  fecha          DateTime  @default(now())
  metodoPago     MetodoPago
  registradoPorId String
  notas          String?
}

// ─── PEDIDOS ────────────────────────────────────────────
model Pedido {
  id              String      @id @default(uuid())
  numeroPedido    String      @unique // ENV-2026-00001
  fecha           DateTime    @default(now())
  clienteId       String?
  cliente         Cliente?    @relation(fields: [clienteId], references: [id])
  domiciliarioId  String?
  domiciliario    User?       @relation("PedidoDomiciliario", fields: [domiciliarioId], references: [id])
  creadoPorId     String
  creadoPor       User        @relation("PedidoCreador", fields: [creadoPorId], references: [id])
  estado          EstadoPedido @default(PENDIENTE)
  metodoPago      MetodoPago
  subtotal        Int         // COP
  descuento       Int         @default(0)
  total           Int         // COP
  observaciones   String?
  items           PedidoItem[]
  historialEstados HistorialEstado[]
  creadoEn        DateTime    @default(now())
}

enum EstadoPedido {
  PENDIENTE
  EN_CAMINO
  ENTREGADO
  CANCELADO
}

enum MetodoPago {
  EFECTIVO
  TRANSFERENCIA
  FIADO
}

model PedidoItem {
  id         String   @id @default(uuid())
  pedidoId   String
  pedido     Pedido   @relation(fields: [pedidoId], references: [id])
  articuloId String
  articulo   Articulo @relation(fields: [articuloId], references: [id])
  cantidad   Int
  precio     Int      // snapshot COP
  costo      Int      // snapshot COP
  subtotal   Int      // COP
  ganancia   Int      // COP
}

model HistorialEstado {
  id          String       @id @default(uuid())
  pedidoId    String
  pedido      Pedido       @relation(fields: [pedidoId], references: [id])
  estadoAntes EstadoPedido
  estadoDespues EstadoPedido
  cambiadoPorId String
  motivo      String?
  creadoEn    DateTime     @default(now())
}

// ─── COMPRAS (ENTRADAS DE INVENTARIO) ───────────────────
model Compra {
  id           String       @id @default(uuid())
  fecha        DateTime     @default(now())
  proveedor    String
  metodoPago   MetodoPago
  total        Int          // COP
  observaciones String?
  registradaPorId String
  items        CompraItem[]
}

model CompraItem {
  id         String   @id @default(uuid())
  compraId   String
  compra     Compra   @relation(fields: [compraId], references: [id])
  articuloId String
  articulo   Articulo @relation(fields: [articuloId], references: [id])
  cantidad   Int
  costo      Int      // COP por unidad
  subtotal   Int      // COP
}

// ─── MOVIMIENTOS DE CAJA ────────────────────────────────
model Movimiento {
  id              String          @id @default(uuid())
  fecha           DateTime        @default(now())
  tipo            TipoMovimiento
  categoria       CategoriaMovimiento
  monto           Int             // COP
  descripcion     String
  metodoPago      MetodoPago
  registradoPorId String
  creadoEn        DateTime        @default(now())
}

enum TipoMovimiento {
  INGRESO
  GASTO
  PRESTAMO
}

enum CategoriaMovimiento {
  COMPRA_MERCANCIA
  PAGO_DOMICILIARIO
  ARRIENDO
  SERVICIOS
  COBRO_CARTERA
  PRESTAMO
  OTRO
}
```

---

## 13. Requerimientos No Funcionales

### 13.1 Performance

| Criterio                                      | Target                    |
|-----------------------------------------------|---------------------------|
| Tiempo de carga inicial (LCP)                 | < 2.5 segundos en 4G      |
| Tiempo de respuesta de API                    | < 500ms para el 95% de peticiones |
| Creación de pedido (end-to-end)               | < 2 segundos              |
| Carga de informe de ventas mensual            | < 3 segundos              |

### 13.2 Disponibilidad

- Uptime objetivo: **99.5%** (Vercel garantiza esto para deployments de producción).
- Mantenimiento planificado solo en horario nocturno (00:00–06:00 COT).

### 13.3 Seguridad

- Autenticación con **NextAuth.js** + JWT (httpOnly cookies).
- Contraseñas hasheadas con **bcrypt** (salt rounds: 12).
- Protección de rutas por rol en middleware de Next.js (verificación server-side).
- Variables de entorno sensibles en Vercel Environment Variables (nunca en el repositorio).
- HTTPS obligatorio (gestionado por Vercel).
- Rate limiting en endpoints de autenticación.
- Validación de inputs con **Zod** en cliente y servidor.

### 13.4 Escalabilidad

- Base de datos PostgreSQL en **Neon** o **Supabase** (serverless-compatible con Prisma).
- Arquitectura de API Routes de Next.js stateless — escala horizontal automáticamente en Vercel.
- Imágenes de productos (futuro): almacenamiento en Vercel Blob o Cloudinary.

### 13.5 Usabilidad

- **Mobile-First**: todos los flujos críticos (crear pedido, imprimir factura, ver estado) deben funcionar perfectamente en pantallas de 375px de ancho.
- **Accesibilidad básica**: contraste mínimo WCAG AA en textos, tamaño mínimo de botones táctiles 44×44px.
- **Idioma**: interfaz completamente en español.
- **Moneda**: todos los montos en COP (pesos colombianos) con formato `$1.500.000` (sin decimales).
- **Zona horaria**: Colombia (COT, UTC-5) como zona horaria por defecto.
- **Sin tutorial requerido**: el domiciliario debe poder crear su primer pedido sin capacitación.

### 13.6 Mantenibilidad

- Tipado estricto con TypeScript (`strict: true` en `tsconfig.json`).
- Separación clara de capas: UI Components · Server Actions / API Routes · Prisma Services.
- Código comentado en bloques de lógica de negocio compleja (cálculo de inventario, deuda).

---

## 14. Stack Tecnológico

| Capa                  | Tecnología                          | Justificación                                           |
|-----------------------|-------------------------------------|---------------------------------------------------------|
| **Frontend / SSR**    | Next.js 14+ (App Router) + TypeScript | Mobile-First, SSR para SEO, server actions, file-based routing |
| **Estilos**           | Tailwind CSS                        | Utility-first, mobile-first nativo, rápido de iterar   |
| **Componentes UI**    | shadcn/ui                           | Accesible, sin lock-in, compatible con Tailwind         |
| **ORM**               | Prisma                              | Type-safe, migraciones controladas, excelente DX        |
| **Base de datos**     | PostgreSQL (Neon o Supabase)        | Serverless-compatible, free tier disponible             |
| **Autenticación**     | NextAuth.js v5                      | Sesiones seguras, compatible con Next.js App Router     |
| **Validación**        | Zod                                 | Type-safe, reutilizable cliente/servidor                |
| **Estado cliente**    | Zustand o useState/useReducer       | Liviano, sin boilerplate para estado local de pedidos   |
| **Fechas**            | date-fns                            | Liviano, localización es-CO disponible                  |
| **Impresión**         | CSS @media print + window.print()   | Sin dependencias, funciona en cualquier navegador       |
| **Deploy**            | Vercel                              | CI/CD nativo con Next.js, previews por PR, free tier    |
| **Dev local**         | Docker Compose (PostgreSQL local)   | Paridad producción/desarrollo                           |

### 14.1 Estructura de carpetas (referencia)

```
envichips/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (dashboard)/
│   │   ├── articulos/
│   │   ├── pedidos/
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx
│   │   │   │   └── imprimir/page.tsx   ← ruta de impresión
│   │   ├── clientes/
│   │   ├── informes/
│   │   └── usuarios/                   ← solo SuperAdmin
│   └── api/
│       └── [...nextauth]/
├── components/
│   ├── ui/                             ← shadcn components
│   ├── articulos/
│   ├── pedidos/
│   ├── clientes/
│   └── informes/
├── lib/
│   ├── db.ts                           ← Prisma client
│   ├── auth.ts                         ← NextAuth config
│   └── validations/                    ← Zod schemas
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── types/
    └── index.ts
```

---

## 15. Fuera de Alcance (v1)

Los siguientes elementos quedan explícitamente fuera del alcance de la versión 1 para mantener el enfoque y acelerar el delivery:

| Funcionalidad                                             | Razón / Versión futura |
|-----------------------------------------------------------|------------------------|
| App nativa iOS/Android                                    | La PWA es suficiente para v1 |
| Modo offline completo (PWA con sync)                      | v1.5 — requiere arquitectura adicional |
| Integración con WhatsApp Business API                     | v2 — enviar facturas por WhatsApp |
| Notificaciones push (pedidos nuevos)                      | v1.5 |
| Múltiples negocios / multi-tenancy                        | v3 — si se escala a otros clientes |
| Módulo de cuentas por pagar (proveedores)                 | v2 |
| Integración con pasarela de pagos (PSE, Nequi, Daviplata) | v2 |
| Portal del cliente (cliente ve su historial)              | v2 |
| Factura electrónica DIAN                                  | v2 (requiere habilitación tributaria) |
| Control de turnos y horarios de domiciliarios             | v1.5 (hoy en `Hoja: Horario`) |
| Descuentos por volumen o promociones                      | v1.5 |
| Recuperación de contraseña por email                      | v1.5 (en v1 el SuperAdmin la resetea) |
| Imágenes de productos                                     | v1.5 |
| Soporte multi-idioma                                      | No aplica |

---

## 16. Plan de Fases

### Fase 0 — Fundamentos (Semana 1–2)
- Setup del proyecto: Next.js + TypeScript + Tailwind + shadcn/ui
- Configuración de Prisma + PostgreSQL (local Docker + Neon/Supabase para producción)
- Implementación de NextAuth.js: login, logout, sesiones
- Middleware de protección de rutas por rol
- Layout base: sidebar (desktop) + bottom navigation (mobile)
- Migración inicial de datos desde Excel a la BD (script de seed)

### Fase 1 — Artículos (Semana 3)
- CRUD completo de artículos
- Catálogo con filtros y buscador
- Registro de compras (entradas de inventario)
- Control de stock automático
- Alertas de stock bajo en UI

### Fase 2 — Pedidos (Semana 4–5)
- Flujo de creación de pedido (3 pasos: cliente → productos → resumen)
- Listado de pedidos por rol
- Gestión de estados (PENDIENTE → EN_CAMINO → ENTREGADO)
- Descuento automático de inventario al entregar
- Cancelación de pedido con motivo

### Fase 3 — Factura e Impresión (Semana 5)
- Ruta `/pedidos/[id]/imprimir`
- CSS de impresión para térmica (58mm/80mm) y A4
- Pruebas en dispositivos reales (Android + iOS + PC)

### Fase 4 — Clientes (Semana 6)
- CRUD de clientes
- Sistema de cartera y deuda (FIADO)
- Registro de abonos
- Historial por cliente
- Alertas de deuda en UI

### Fase 5 — Informes (Semana 7)
- Dashboard con métricas del día
- Informe de ventas por período y por producto
- Informe de inventario
- Movimientos de caja (manual + automático)
- Informe de domiciliarios

### Fase 6 — Usuarios y Pulido (Semana 8)
- CRUD de usuarios (solo SuperAdmin)
- Informe de ganancias netas (solo SuperAdmin)
- Configuración global del negocio (nombre, teléfono para factura)
- QA en mobile y desktop
- Correcciones de UX
- Deploy a producción en Vercel

---

## 17. Riesgos y Mitigaciones

| Riesgo                                                         | Probabilidad | Impacto | Mitigación                                                      |
|----------------------------------------------------------------|:------------:|:-------:|------------------------------------------------------------------|
| El domiciliario no adopta la app (prefiere WhatsApp)           | Media        | Alto    | UX extremadamente simple; flujo de pedido en < 3 taps; capacitación breve |
| Inconsistencia de inventario si falla la red al entregar       | Media        | Medio   | Confirmar entrega localmente + reintentos automáticos; alerta visual si no hay conexión |
| Datos perdidos durante la migración desde Excel                | Baja         | Alto    | Script de migración con validación y backup del Excel original  |
| Precios cambian y afectan reportes históricos                  | Alta         | Medio   | Snapshot de precio/costo en cada PedidoItem (ya contemplado en modelo) |
| Impresora térmica no compatible con `window.print()`           | Media        | Medio   | Pruebas tempranas con impresoras reales; fallback a PDF de A4   |
| Crecimiento de la BD más rápido de lo esperado (muchos pedidos)| Baja         | Bajo    | PostgreSQL en Neon tiene auto-scaling; Prisma queries optimizadas con índices |

---

## Apéndice A — Catálogo inicial de productos (desde Excel)

El script de seed debe incluir los 50 productos documentados en `Hoja: Productos`:

- **65g**: Papa (Limón, Natural, Pimienta, Mayonesa, BBQ Dulce, BBQ, Pollo, Chili), Plátano (Limón, Natural), Maduro (Limón, Natural), Chicharrón (Natural, Limón, BBQ), Rosquita, Rosca, Detodito (Limón, Natural), Aritos
- **250g**: Papa (8 sabores), Plátano (2), Maduro (2), Chicharrín (Natural, Limón), Aritos
- **500g**: Papa (8 sabores), Plátano (2), Maduro (2), Chicharrín (Natural, Limón), Aritos
- **Otros** (sin costo registrado): Galleta girasol, Galleta corazón, Alfajor, Maní

---

## Apéndice B — Clientes iniciales (migración)

Del Excel se identificaron **36 clientes activos** con saldos de deuda registrados. El script de migración debe:
1. Crear los registros en la tabla `Cliente`.
2. Registrar la deuda inicial de cada cliente como un `Abono` con monto negativo o un campo `deudaInicial` de migración.
3. Marcar el estado: `EN_DEUDA` si `debe > 0`, `AL_DIA` en caso contrario.

Deuda total a migrar: **$2.811.000 COP** (según `Hoja: Clientes`).

---

*Documento preparado para desarrollo. Cualquier cambio de alcance debe ser evaluado contra el plan de fases y documentado como una nueva versión del PRD.*
