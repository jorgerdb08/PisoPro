-- ==============================================================================
-- PISOPRO: VACIADO DE DATOS DE PRUEBA PARA PRODUCCIÓN / PRUEBAS REALES
-- Pega este script en el SQL Editor de tu proyecto Supabase y pulsa "Run".
-- ==============================================================================
-- Este script es 100% seguro y resiliente:
-- Comprueba automáticamente si cada tabla existe antes de truncarla para evitar
-- cualquier error si una tabla opcional (como notifications) aún no ha sido creada.
--
-- CONSERVA INTACTA LA ESTRUCTURA BASE:
--   - Los 3 perfiles (Jorge como admin, Samuel y David)
--   - El hogar ("Nuestro piso") y la pertenencia de los miembros
--   - Las 3 zonas de limpieza (Cocina, Salón, Baño) y las tareas de cada zona
--   - Las tareas fijas del piso (reseteadas a estado 'pending')
-- ==============================================================================

DO $$
DECLARE
  tbl text;
  tables_to_truncate text[] := ARRAY[
    'expense_participants',
    'expenses',
    'user_sessions',
    'messages',
    'shopping_items',
    'notifications',
    'task_completions',
    'cleaning_lottery',
    'initial_zone_assignments',
    'cleaning_assignment_overrides',
    'cleaning_weekly_task_checks',
    'cleaning_completions',
    'cleaning_help_requests',
    'cleaning_helpers',
    'trash_events',
    'point_transactions'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables_to_truncate LOOP
    IF EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = tbl
    ) THEN
      EXECUTE 'TRUNCATE TABLE public.' || quote_ident(tbl) || ' CASCADE';
    END IF;
  END LOOP;
END $$;

-- Resetear estado de las tareas preconfiguradas a 'pending' si la tabla existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
    UPDATE public.tasks SET status = 'pending';
  END IF;
END $$;

-- Mensaje de bienvenida inicial en el chat del piso
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    INSERT INTO public.messages (id, household_id, user_id, content)
    VALUES (
      '99999999-9999-4999-8999-999999999999',
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      '¡Bienvenidos a PisoPro! El piso está listo para empezar.'
    )
    ON CONFLICT (id) DO UPDATE 
    SET content = EXCLUDED.content;
  END IF;
END $$;
