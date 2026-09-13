-- ==============================================================================
-- PISOPRO: RESTABLECER DATOS DE PRUEBA (LIMPIEZA, SORTEO Y BASURA)
-- Ejecuta este script en el SQL Editor de Supabase si deseas reiniciar
-- el sorteo inicial a cero y limpiar el historial de tareas y basura.
-- ==============================================================================

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
