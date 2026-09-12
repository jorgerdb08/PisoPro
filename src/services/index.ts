/**
 * Capa de Servicios de PisoPro
 * Las implementaciones de servicios (AuthService, TaskService, ExpenseService, etc.)
 * se conectarán a Supabase en las fases subsiguientes.
 */

export interface IServiceResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}
