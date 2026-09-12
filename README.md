# PisoPro 🏠

> Aplicación PWA mobile-first completa y en tiempo real para la gestión inteligente de la convivencia en pisos compartidos.

[![Next.js 16](https://img.shields.io/badge/Next.js-16%20(Turbopack)-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20Realtime-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-68%20tests%20passed-729B1B?style=flat-square&logo=vitest)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-30%20E2E%20tests%20passed-45ba4b?style=flat-square&logo=playwright)](https://playwright.dev/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable%20%2B%20Offline-orange?style=flat-square&logo=pwa)](https://developer.mozilla.org/es/docs/Web/Progressive_web_apps)

---

## 👥 Perfiles del Piso

El piso cuenta con 3 perfiles preconfigurados con concurrencia atómica garantizada en PostgreSQL:

- **Jorge**: Administrador del piso (`admin`) — Gestión de tareas, supervisión y liberación de sesiones.
- **Samuel**: Compañero (`member`)
- **David**: Compañero (`member`)

---

## 🚀 Módulos y Funcionalidades Principales

### 1. 🔐 Selección de Usuario y Concurrencia Atómica
- Sistema de **leases temporales** (60s) en PostgreSQL con heartbeat en segundo plano cada 25s (`useHeartbeat`).
- Prevención de uso simultáneo del mismo perfil desde diferentes dispositivos en tiempo real.
- Liberación automática al cerrar sesión o por inactividad.

### 2. 🛡️ Rol de Administrador y Control de Sesiones
- Exclusivo para Jorge: acceso al **Panel de Administración**.
- Vista de dispositivos conectados y capacidad de forzar la liberación de perfiles bloqueados mediante RPC seguro.

### 3. 🧹 Tareas del Hogar, Rotación Semanal y Puntos
- Asignación de tareas por zonas (Cocina, Baño, Salón, Basuras).
- Puntuación gamificada por tarea completada con historial.
- Algoritmo de **rotación semanal cíclica** (`Jorge` ➔ `Samuel` ➔ `David`).
- Sincronización instantánea con Supabase Realtime.

### 4. 💰 Gastos Compartidos y Minimización de Deudas
- Registro de tickets de compra y facturas con categorización.
- Cálculo de balances netos individuales con desglose al céntimo.
- Algoritmo voraz de **simplificación de deudas** (*greedy debt minimization*) que reduce las transferencias al mínimo número posible de pagos.
- Botón de acción directa **"Saldar Deuda"**.

### 5. 🛒 Lista de la Compra Compartida
- Lista colaborativa en caliente: añade productos y márcalos como comprados desde el supermercado.
- Clasificador inteligente de productos por categorías (Frutas/Verduras, Carnicería, Lácteos, Limpieza, etc.).
- Sugerencias rápidas de artículos habituales del piso y limpieza en bloque de comprados.

### 6. 💬 Chat del Piso y Menciones
- Canal de comunicación interno en tiempo real sin salir de la app.
- Sistema de menciones directas con resaltado visual: `@Jorge`, `@Samuel`, `@David` y `@todos`.
- Chips de inserción rápida para un solo toque en móvil.

### 7. 🏠 Gestión del Piso, Habitaciones y Convivencia (`/piso`)
- **WiFi Card**: Consulta de SSID y contraseña con copiado rápido en 1 click al portapapeles.
- **Compañeros**: Listado con habitaciones asignadas, medallas del ranking (🥇, 🥈, 🥉) y puntos acumulados.
- **Normas de la Casa**: 5 acuerdos fundamentales de descanso, limpieza, visitas y convivencia.
- **Contactos de Emergencia**: Resumen del contrato de alquiler y directorio con llamada telefónica directa (112, seguro, fontanero, portería).

### 8. 🔔 PWA, Notificaciones Push y Modo Offline
- **PWA Instalable**: Manifest completo con shortcuts directos a Tareas, Gastos, Compra y Chat.
- **Offline Banner**: Detección reactiva de red (`useSyncExternalStore`) con indicador de cambios guardados y aviso esmeralda de reconexión.
- **Notificaciones Web**: Alertas locales para tareas asignadas, nuevos gastos compartidos y menciones prioritarias en el chat.

---

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 16 (Turbopack, App Router, React 19)
- **Lenguaje**: TypeScript (Strict Mode con `noUncheckedIndexedAccess`)
- **Estilos**: Tailwind CSS con safe-area insets y componentes mobile-first
- **Backend & Realtime**: PostgreSQL + Supabase (RLS, RPCs, Channels)
- **Validación**: Zod
- **Testing**: Vitest (Unitarios) + Playwright (E2E multiplataforma)
- **CI/CD**: GitHub Actions

---

## 🏛️ Estructura del Código

```
src/
├── app/                  # Rutas App Router (/tareas, /gastos, /compra, /chat, /piso)
├── components/           # Componentes UI reutilizables
│   ├── common/           # OfflineBanner, AdminGuard, StatCard
│   ├── layout/           # MobileContainer, BottomNav, TopHeader
│   ├── pwa/              # PwaProvider
│   └── ui/               # Botones, tarjetas, badges, modales
├── features/             # Módulos verticales de negocio
│   ├── admin/            # Panel de control de sesiones y forzado
│   ├── auth/             # Contexto de sesión, leases y permisos RBAC
│   ├── chat/             # Burbujas de chat, menciones y useChat
│   ├── chores/           # Tareas, rotación semanal y useChores
│   ├── expenses/         # Balances, simplificación de deudas y useExpenses
│   ├── flat/             # WiFi, normas, directorio y useFlat
│   ├── notifications/    # notificationService y NotificationToggle
│   ├── offline/          # useNetworkStatus
│   └── shopping/         # Lista de compra, categorizador y useShopping
├── services/             # Clientes Supabase y RPCs
├── types/                # Definiciones TypeScript completas del dominio
└── tests/                # Tests unitarios Vitest
tests/e2e/                # Tests end-to-end Playwright (Desktop y Mobile)
supabase/                 # Migraciones SQL, funciones RPC y seed determinista
```

---

## 🚀 Puesta en Marcha Local

### Prerrequisitos

- Node.js >= 20 LTS (v22 o v24 recomendado)
- Cuenta o proyecto en [Supabase](https://supabase.com/)

### 1. Clonar e Instalar Dependencias

```bash
git clone https://github.com/jorgerdb08/PisoPro.git
cd PisoPro
npm install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Configurar Base de Datos en Supabase

Ejecuta el script SQL integral [supabase/all_in_one_setup.sql](./supabase/all_in_one_setup.sql) en el **SQL Editor** de tu panel de Supabase. Este script:
1. Crea las 11 tablas relacionales y sus índices.
2. Activa RLS y las políticas de seguridad.
3. Define las funciones RPC atómicas (`claim_profile`, `heartbeat_session`, `release_profile`, etc.).
4. Inserta el seed con Jorge, Samuel, David, el piso y las tareas/gastos iniciales.

### 4. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🧪 Batería de Pruebas y Calidad

PisoPro cuenta con una cobertura completa en todas las capas:

```bash
# 1. Comprobación de sintaxis y buenas prácticas ESLint (React 19)
npm run lint

# 2. Verificación estricta de tipos TypeScript
npm run typecheck

# 3. Pruebas unitarias de servicios, algoritmos y permisos (68 tests)
npm run test

# 4. Pruebas End-to-End con Playwright (30 tests Desktop + Mobile Chrome)
npx playwright test --project="Desktop Chrome" --project="Mobile Chrome" --workers=1

# 5. Compilación para producción
npm run build
```

---

## 🚢 Despliegue en Producción (Vercel)

1. Conecta el repositorio de GitHub con [Vercel](https://vercel.com).
2. Añade las variables de entorno en la configuración del proyecto:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (URL pública de tu despliegue)
3. Despliega con el framework preset por defecto (`Next.js`).

---

## 🌿 Flujo de Ramas Git

- `main`: Rama de producción lista para despliegue.
- `develop`: Rama de integración continua de features.
- `feature/*`: Ramas de trabajo aisladas bajo la convención de *Conventional Commits*.

