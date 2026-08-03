# Delta for Artículos

## ADDED Requirements

### Requirement: Dirty-Field Tracking en Edición Parcial

`ArticleForm` en edición MUST tomar un snapshot de valores iniciales al montar y, al enviar, MUST transmitir únicamente los campos cuyo valor difiere del snapshot. El modo creación MUST seguir requiriendo el esquema completo.

- GIVEN artículo existente en edición / WHEN se edita solo `precio` / THEN el payload contiene únicamente `{ precio }`
- GIVEN artículo con `costo = 2250` / WHEN se edita `nombre` sin tocar `costo` / THEN `costo` no viaja ni dispara validación
- GIVEN formulario en modo creación / WHEN se omite `costo` / THEN la validación falla por campo requerido

### Requirement: Ajuste Manual de Stock

`ArticleForm` MUST incluir un input `stockActual` visible solo en edición (oculto en creación). El valor MUST ser entero `>= 0`. El formulario SHOULD mostrar una nota advirtiendo que el ajuste manual no se registra en el historial. El input se envía como campo dirty del payload parcial.

- GIVEN edición con `stockActual` precargado / WHEN se cambia a `30` y guarda / THEN el payload incluye `stockActual: 30`
- GIVEN modo creación / THEN el input `stockActual` NO se renderiza
- GIVEN input `stockActual` = `-5` / WHEN se guarda / THEN falla la validación de valor inválido
- GIVEN input `stockActual` visible / THEN se muestra nota: el ajuste manual no aparece en el historial

### Requirement: Filtros Avanzados con Drawer Mobile-First

El listado MUST reemplazar la barra horizontal por: (a) búsqueda y (b) botón "Filtros" siempre visibles, con badge del conteo de filtros activos. Al pulsar "Filtros" MUST abrirse un drawer con categoría, presentación, activo/inactivo, stock status (todos/sin stock/bajo/ok), precio mín y máx. Los filtros activos MUST mostrarse como chips removibles; MUST existir "Limpiar todo". El filtrado MUST permanecer client-side. El drawer MUST ser mobile-first: desliza desde abajo en mobile, panel o sidebar en desktop.

- GIVEN listado renderizado / WHEN se pulsa "Filtros" / THEN abre el drawer con todos los filtros avanzados
- GIVEN filtro categoría = "PAPA" activo / THEN chip "PAPA" visible / WHEN se pulsa su "x" / THEN el filtro se elimina y la lista reactualiza
- GIVEN dos filtros activos / THEN el botón "Filtros" muestra badge "2" / AND al limpiar ambos el badge desaparece
- GIVEN stock 0, bajo el mínimo y sobre el mínimo / WHEN se selecciona "Sin Stock" / THEN solo aparecen los de `stockActual = 0`
- GIVEN precios entre 1000 y 5000 / WHEN se fija mín 2000 y máx 4000 / THEN solo aparecen los de precio en ese rango
- GIVEN múltiples filtros activos / WHEN se pulsa "Limpiar todo" / THEN todos se reinician y se muestra el catálogo completo
- GIVEN catálogo en memoria / WHEN se aplica cualquier combinación de filtros / THEN el resultado se actualiza sin llamada al servidor

## MODIFIED Requirements

### Requirement: Validación precio > costo en Actualización

`updateArticuloSchema` MUST aplicar `precio > costo` de forma condicional: SOLO cuando ambos campos están en el payload. Si solo uno está presente, la validación MUST omitirse. `createArticuloSchema` MUST conservar la validación obligatoria.

(Previously: la validación `precio > costo` se ejecutaba sin considerar el payload parcial con un solo campo modificado.)

- GIVEN payload de edición con `{ precio: 1000, costo: 2000 }` / WHEN se valida con `updateArticuloSchema` / THEN falla porque `precio <= costo`
- GIVEN payload de edición con `{ precio: 3000 }` (sin `costo`) / WHEN se valida / THEN `precio > costo` NO se ejecuta y pasa la validación de precios
- GIVEN payload de edición con `{ costo: 1500 }` (sin `precio`) / WHEN se valida / THEN `precio > costo` NO se ejecuta
- GIVEN modo creación con `precio = 1000` y `costo = 2000` / WHEN se envía / THEN la validación `precio > costo` falla como siempre