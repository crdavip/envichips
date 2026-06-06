# 🏪 Envichips SaaS

Envichips SaaS es un sistema de punto de venta y gestión empresarial diseñado para **Envichips**, una distribuidora colombiana de snacks. Reemplaza el flujo 100% manual en Excel con una plataforma web centralizada, mobile-first, con gestión de pedidos, inventario, clientes, cartera, domiciliarios y caja en tiempo real.

Construido con Next.js + TypeScript + Prisma + PostgreSQL.

## 🧰 Tecnologías utilizadas

![Next.js](https://img.shields.io/badge/Next.js%2016-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS%204-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![NextAuth.js](https://img.shields.io/badge/NextAuth.js-000000?style=for-the-badge&logo=nextauth&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)

---

## ⚙️ Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/crdavip/envichips.git
cd envichips
```

### 2. Instalar dependencias

```bash
# Instalar dependencias de Node.js
npm install
```

### 3. Configurar las variables de entorno

Duplica el archivo de ejemplo `.env.example` y renómbralo a `.env`.

```bash
cp .env.example .env
```

Luego, configura las variables de entorno en tu archivo `.env`:

```env
DATABASE_URL="postgresql://postgres:root@localhost:5432/envichips_db?schema=public"
NEXTAUTH_SECRET="super-secret-change-in-production"
```

Asegurate de tener PostgreSQL corriendo y la base de datos `envichips_db` creada.

### 4. Ejecutar las migraciones

```bash
# Generar el cliente de Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Poblar la base de datos con datos de prueba
npm run db:seed
```

### 5. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Accede a la aplicación en: http://localhost:3000

---

## 🥷 Accesos de Prueba

Después de ejecutar los seeders, podés iniciar sesión con los siguientes usuarios de prueba:

### SuperAdmin

```bash
admin@envichips.com   # Email
password               # Contraseña
```

### Admin

```bash
julian@envichips.com   # Email
password               # Contraseña
```

### Domiciliario

```bash
carlos@envichips.com   # Email
pedro@envichips.com    # Email
password               # Contraseña (para todos)
```

### Verificar el funcionamiento

Después de ejecutar los seeders, iniciá sesión con cualquiera de los roles para probar:
- **SuperAdmin/Admin**: acceso completo a artículos, pedidos, clientes, informes y usuarios.
- **Domiciliario**: solo ve sus pedidos asignados y puede marcar entregas.

---

## 🧪 Scripts útiles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo (Next.js)
npm run build            # Compilar para producción
npm run start            # Iniciar servidor de producción
npm run lint             # Ejecutar ESLint

# Base de datos
npm run db:generate      # Generar cliente de Prisma
npm run db:migrate       # Ejecutar migraciones
npm run db:push          # Sincronizar schema sin migración
npm run db:studio        # Abrir Prisma Studio (UI de BD)
npm run db:seed          # Poblar BD con datos de prueba

# Testing
npm run test             # Ejecutar tests (Vitest)
npm run test:watch       # Tests en modo watch
```

---

## 🧱 Módulos principales

### 📦 Artículos
Catálogo de productos con categorías (`PAPA`, `PLATANO`, `MADURO`, `CHICHARRON`, `ROSQUITA`, `ROSCA`, `DETODITO`, `ARITOS`, `OTRO`) y presentaciones (`G50`, `G65`, `G250`, `G500`, `OTRO`). Control de stock automático, alertas de stock bajo y registro de compras (entradas de inventario).

### 📋 Pedidos
Flujo completo: creación → asignación a domiciliario → seguimiento de estados (`PENDIENTE` → `EN_CAMINO` → `ENTREGADO` / `CANCELADO`). Ciclo de cobro separado: el domiciliario registra el cobro, el Admin confirma la recepción del efectivo. Factura imprimible para térmicas de 58mm/80mm y A4.

### 👥 Clientes
Registro de clientes con sistema de cartera y deuda en tiempo real. Pedidos `FIADO` se reflejan automáticamente como deuda. Registro de abonos con historial. Estados: `AL_DÍA` / `EN_DEUDA`.

### 📊 Informes
Dashboard con resumen del día, ventas por producto, movimientos de caja (ingresos/gastos/préstamos), inventario, rendimiento por domiciliario y ganancias (visible solo para SuperAdmin).

### 👤 Usuarios (Admin)
Gestión de usuarios con tres roles: `SUPERADMIN`, `ADMIN` y `DOMICILIARIO`. Solo el SuperAdmin puede crear y gestionar usuarios. No existe registro público.

---

## 👨‍💻 Autor
Desarrollado con ❤️ por **Cristian David**
🔗 [GitHub](https://github.com/crdavip)
