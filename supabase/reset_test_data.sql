-- ==============================================================================
-- PISOPRO: VACIADO DE DATOS DE PRUEBA PARA PRODUCCIÓN / PRUEBAS REALES
-- Pega este script en el SQL Editor de tu proyecto Supabase y pulsa "Run".
-- ==============================================================================
-- Este script ELIMINA todos los datos de prueba transaccionales:
--   - Gastos y participantes de gastos
--   - Sesiones de dispositivos (libera a Jorge, Samuel y David para loguearse en sus móviles reales)
--   - Mensajes del chat
--   - Lista de la compra
--   - Notificaciones
--   - Tareas completadas
--   - Sorteo de limpieza, rotaciones, checks semanales, ayudas, registros de basura y puntos
--
-- CONSERVA INTACTA LA ESTRUCTURA BASE:
--   - Los 3 perfiles (Jorge como admin, Samuel y David)
--   - El hogar ("Nuestro piso") y la pertenencia de los miembros
--   - Las 3 zonas de limpieza (Cocina, Salón, Baño) y las tareas de cada zona
--   - Las tareas estándar del piso (reseteadas a estado 'pending')
-- ==============================================================================

-- 1. Gastos compartidos
TRUNCATE TABLE 
  expense_participants,
  expenses 
CASCADE;

-- 2. Sesiones activas y caducadas (libera los perfiles)
TRUNCATE TABLE 
  user_sessions 
CASCADE;

-- 3. Mensajes de chat
TRUNCATE TABLE 
  messages 
CASCADE;

-- 4. Lista de compras
TRUNCATE TABLE 
  shopping_items 
CASCADE;

-- 5. Notificaciones
TRUNCATE TABLE 
  notifications 
CASCADE;

-- 6. Tareas estándar completadas y reseteo a pendientes
TRUNCATE TABLE 
  task_completions 
CASCADE;

UPDATE tasks 
SET status = 'pending';

-- 7. Limpieza por zonas, sorteo inicial, basura y ranking de puntos
TRUNCATE TABLE 
  cleaning_lottery, 
  initial_zone_assignments, 
  cleaning_assignment_overrides, 
  cleaning_weekly_task_checks, 
  cleaning_completions, 
  cleaning_help_requests, 
  cleaning_helpers, 
  trash_events, 
  point_transactions 
CASCADE;

-- 8. Mensaje de bienvenida inicial en el chat del piso
INSERT INTO messages (id, household_id, user_id, content)
VALUES (
  '99999999-9999-4999-8999-999999999999',
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '¡Bienvenidos a PisoPro! El piso está listo para empezar.'
)
ON CONFLICT (id) DO UPDATE 
SET content = EXCLUDED.content;
