# PisoPro 🏠

> Aplicación PWA mobile-first completa y en tiempo real para la gestión inteligente de la convivencia en pisos compartidos.

---

## 👥 Perfiles Iniciales del Piso

El piso inicial cuenta con exactamente 3 perfiles preconfigurados:

- **Jorge**: Administrador (`admin`)
- **Samuel**: Compañero (`member`)
- **David**: Compañero (`member`)

---

## 🛠️ Stack Tecnológico

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Components & Client Components donde corresponda)
- **Lenguaje**: TypeScript (Strict Mode con `noUncheckedIndexedAccess`)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/) & componentes base inspirados en [shadcn/ui](https://ui.shadcn.com/)
- **Base de Datos & Realtime**: PostgreSQL + [Supabase](https://supabase.com/) + Supabase Realtime (Fase 2+)
- **Validación de Datos**: [Zod](https://zod.dev/)
- **PWA**: Service Worker (`public/sw.js`), Manifest nativo (`manifest.ts`), soporte offline y eventos push preparados
- **Testing**: [Vitest](https://vitest.dev/), [Testing Library](https://testing-library.com/) y [Playwright](https://playwright.dev/) para E2E
- **Linter & Formatter**: ESLint y Prettier con ordenación de clases Tailwind
- **CI/CD**: GitHub Actions

---

## 🏛️ Arquitectura del Proyecto

El código está estructurado siguiendo una arquitectura desacoplada y mantenible:

```
src/
├── app/                  # Rutas App Router, layout, manifest y temas
├── components/           # Componentes UI reutilizables y layout móvil
│   ├── ui/               # Primitivas de diseño (Button, Card, Badge, etc.)
│   ├── layout/           # MobileContainer, BottomNav, TopHeader
│   └── pwa/              # InstallBanner, OfflineIndicator, PwaProvider
├── features/             # Módulos verticales de negocio (Auth, Tasks, Expenses, Chat, Shopping)
├── hooks/                # Custom hooks (usePWA, useOnlineStatus, etc.)
├── lib/                  # Utilidades globales (cn, formatters, helpers)
├── services/             # Capa de servicios para comunicación con backend/Supabase
├── types/                # Modelos de dominio y tipado TypeScript
├── validations/          # Esquemas de validación Zod
└── database/             # Migraciones SQL y seeds
```

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos

- Node.js >= 20 (recomendado v22 o v24 LTS)
- npm >= 10

### Pasos

1. Clonar el repositorio y entrar al proyecto:
   ```bash
   git clone <repo-url>
   cd PisoPro
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar variables de entorno:
   ```bash
   cp .env.example .env.local
   ```
4. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   Abrir [http://localhost:3000](http://localhost:3000) en el navegador o emulador móvil.

---

## 🧪 Pruebas y Validación de Calidad

```bash
# Ejecutar linter
npm run lint

# Comprobación de tipos TypeScript
npm run typecheck

# Pruebas unitarias con Vitest
npm run test

# Pruebas E2E con Playwright
npm run test:e2e

# Build de producción
npm run build
```

---

## 📱 Capacidades PWA

PisoPro incluye una configuración completa para Progressive Web Apps:

- **Instalación:** Banner de instalación nativo que captura el evento `beforeinstallprompt`.
- **Standalone:** Optimizado para pantalla completa en Android e iOS (respetando las áreas seguras `safe-area-inset`).
- **Modo sin conexión:** Detección de conectividad en tiempo real mediante `OfflineIndicator` y cache de shell mediante `sw.js`.
- **Iconografía:** Iconos adaptativos y maskables para home screen en 192x192 y 512x512.

---

## 🌿 Flujo Git

Seguimos una metodología estricta basada en ramas:

- `main`: Código en producción.
- `develop`: Rama base de desarrollo e integración continua.
- `feature/*`, `fix/*`, `chore/*`: Ramas de trabajo temporales.
- Commits bajo el estándar de **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `test:`, etc.).

Consulta [CONTRIBUTING.md](./CONTRIBUTING.md) para más detalles.
