# Guía de Contribución a PisoPro

Gracias por colaborar en **PisoPro**. Para asegurar la calidad, fiabilidad y trazabilidad del código, seguimos estrictamente las siguientes directrices de desarrollo.

---

## Modelo de Ramas (Git Flow Simplificado)

1. **`main`**: Rama de producción. Nunca se trabaja directamente en ella. Solo recibe merges desde `develop` validados.
2. **`develop`**: Rama de integración. Todo nuevo desarrollo parte y se integra aquí.
3. **Ramas de trabajo**:
   - `feature/<nombre-descriptivo>`: Nuevas funcionalidades (ej. `feature/project-setup`, `feature/tasks`).
   - `fix/<nombre-descriptivo>`: Corrección de bugs (ej. `fix/profile-lock-timeout`).
   - `refactor/<nombre-descriptivo>`: Refactorizaciones sin cambios en el comportamiento externo.
   - `chore/<nombre-descriptivo>`: Tareas de mantenimiento, dependencias o configuración.

---

## Conventional Commits

Los commits deben seguir la especificación [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nuevas funcionalidades visibles para el usuario.
- `fix:` Corrección de errores.
- `refactor:` Cambios de código que ni añaden funcionalidad ni corrigen errores.
- `test:` Inclusión o ajuste de pruebas unitarias o E2E.
- `chore:` Tareas rutinarias, dependencias, tooling o configuración de CI.
- `docs:` Modificaciones en documentación (`README.md`, `CONTRIBUTING.md`).

Ejemplo:

```bash
feat(pwa): register service worker and add install prompt
fix(auth): prevent concurrent user claim race condition
test(expenses): add unit tests for debt minimization algorithm
```

---

## Flujo de Trabajo para Cada Funcionalidad

1. Asegúrate de tener la rama `develop` al día:
   ```bash
   git checkout develop
   git pull origin develop
   ```
2. Crea tu rama de trabajo:
   ```bash
   git checkout -b feature/mi-funcionalidad
   ```
3. Desarrolla la funcionalidad manteniendo la arquitectura en capas.
4. Ejecuta y valida las comprobaciones locales obligatorias:
   ```bash
   npm run lint
   npm run typecheck
   npm run test
   npm run build
   ```
5. Realiza tus commits respetando Conventional Commits.
6. Sube la rama y crea una Pull Request hacia `develop`.
7. Verifica que los checks de GitHub Actions concluyan en verde antes de mergear.
