# Spec: improve-order-wizard

## Requirements

### R1: Browse + Search for Clients
- **R1.1**: When Step 1 mounts, automatically load and display the first 20 active clients ordered by name
- **R1.2**: A search input at the top filters results as the user types (300ms debounce)
- **R1.3**: Each client result shows: nombreCompleto, telefono, deuda badge
- **R1.4**: Selecting a client shows a compact badge with name + X to unselect
- **R1.5**: Venta rápida toggle remains available and works alongside the list

### R2: Browse + Search for Products
- **R2.1**: When Step 2 mounts, automatically load and display the first 20 active articles ordered by name
- **R2.2**: A search input at the top filters results as the user types (300ms debounce)
- **R2.3**: Each product card shows: nombre, presentacion, precio, stockActual
- **R2.4**: "Agregar" button opens inline quantity input, then confirms to cart
- **R2.5**: Cart section visible below, shows items, quantity, subtotal, remove button

### R3: Venta Rápida Toggle
- **R3.1**: Toggle ON shows name input, preserves typed value when switching modes
- **R3.2**: Toggle OFF switches to client list, typed name preserved in memory
- **R3.3**: Only explicit "X" on client badge or new client selection clears the name
- **R3.4**: Validation: `clienteId !== undefined || (isVentaRapida && clienteNombre.trim().length > 0)`

### R4: Mobile UX
- **R4.1**: Touch targets minimum 44px for interactive elements
- **R4.2**: Product cards use full width on mobile, 2-column on tablet
- **R4.3**: Cart section has a visual count badge and can be collapsed
- **R4.4**: Step navigation buttons have full-width option on mobile

### R5: Server Actions
- **R5.1**: `getClientesAction(query: string)`: if query is empty, return first 20 active clients; if query has content, filter by name (case-insensitive contains)
- **R5.2**: `getArticulosForPedidoAction(query: string)`: if query is empty, return first 20 active articles; if query has content, filter by name (case-insensitive contains)
- **R5.3**: Both actions preserve existing return type interfaces

### Existing Functionality (must NOT break)
- Client search by name still works
- Article search by name still works
- Venta rápida creates order with `clienteNombre`
- Order validation (step1Valid, step2Valid)
- URL-based step navigation
- Step 3: resumen, metodoPago, domiciliario, descuento, observaciones
- Error handling and submission flow

## Scenarios

### Normal flow: Browse + Select Client
1. User opens /pedidos/create
2. Step 1 shows list of 20 clients immediately
3. User scrolls, finds "Juan Pérez", taps to select
4. List disappears, client badge shows "Juan Pérez" with X
5. User taps "Siguiente"

### Normal flow: Search Client
1. User opens Step 1, sees client list
2. User types "mar" in search bar
3. List filters to show clients containing "mar" (e.g., "Maria", "Marta")
4. User taps "Maria Rodríguez"

### Normal flow: Venta Rápida
1. User opens Step 1, sees client list
2. User toggles "Venta rápida"
3. List hides, name input appears
4. User types "Cliente mostrador"
5. User accidentally toggles OFF, sees client list again
6. User toggles ON back, name "Cliente mostrador" is still there

### Normal flow: Browse + Add Products
1. User reaches Step 2
2. Products load immediately in a grid
3. User taps "Agregar" on "Papas G250"
4. Quantity input opens, user types 2, taps "Agregar"
5. Item appears in cart below with subtotal

### Edge case: No results
1. User types "zzzz" in client search
2. Results show "No se encontraron clientes" empty state
3. User clears search, list shows initial 20 clients again

### Edge case: Toggle during search
1. User on Step 1, searches and finds a client
2. Before selecting, toggles Venta rápida ON
3. Name input appears, user types a name
4. Toggles OFF, client list shows with previous search results intact
