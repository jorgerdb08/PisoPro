import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vvnntrgmcfrcwyqhefta.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bm50cmdtY2ZyY3d5cWhlZnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMzk3NDUsImV4cCI6MjEwNDYxNTc0NX0.2O7s9yq4c8F1fI5AdBLhkePMYeucoSMQr_0LByRCRd4";

const supabase = createClient(url, key);

async function clean() {
  console.log("🧹 Iniciando purga de datos de prueba en Supabase...");

  // 1. Limpiar sesiones de usuarios (dejar a todos libres)
  const { error: errSessions } = await supabase.from("user_sessions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("1. Sesiones eliminadas:", errSessions ? errSessions.message : "OK");

  // 2. Limpiar completados de tareas
  const { error: errCompletions } = await supabase.from("task_completions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("2. Historial de tareas completadas eliminado:", errCompletions ? errCompletions.message : "OK");

  // 3. Limpiar tareas extras creadas durante los tests (dejar solo las 6 originales)
  const originalTaskIds = [
    "a1111111-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "b2222222-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    "c3333333-cccc-4ccc-8ccc-cccccccccccc",
    "d4444444-dddd-4ddd-8ddd-dddddddddddd",
    "e5555555-eeee-4eee-8eee-eeeeeeeeeeee",
    "f6666666-ffff-4fff-8fff-ffffffffffff",
  ];
  const { data: allTasks } = await supabase.from("tasks").select("id");
  if (allTasks) {
    const extraTaskIds = allTasks
      .map((t) => t.id)
      .filter((id) => !originalTaskIds.includes(id));
    if (extraTaskIds.length > 0) {
      await supabase.from("tasks").delete().in("id", extraTaskIds);
      console.log(`3. Eliminadas ${extraTaskIds.length} tareas de prueba.`);
    } else {
      console.log("3. Tareas extras: ninguna.");
    }
  }

  // Resetear estado de tareas originales a 'pending'
  await supabase.from("tasks").update({ status: "pending" }).in("id", originalTaskIds);
  console.log("4. Tareas originales reseteadas a pendientes: OK");

  // 4. Limpiar gastos de prueba y participantes
  const { error: errPart } = await supabase.from("expense_participants").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("5. Participantes de gastos eliminados:", errPart ? errPart.message : "OK");

  const { error: errExp } = await supabase.from("expenses").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("6. Gastos de prueba eliminados:", errExp ? errExp.message : "OK");

  // 5. Limpiar items de compra extras (dejar solo los 3 originales limpios)
  const originalShoppingIds = [
    "10101010-1010-4010-8010-101010101010",
    "20202020-2020-4020-8020-202020202020",
    "30303030-3030-4030-8030-303030303030",
  ];
  const { data: allShopping } = await supabase.from("shopping_items").select("id");
  if (allShopping) {
    const extraShoppingIds = allShopping
      .map((s) => s.id)
      .filter((id) => !originalShoppingIds.includes(id));
    if (extraShoppingIds.length > 0) {
      await supabase.from("shopping_items").delete().in("id", extraShoppingIds);
      console.log(`7. Eliminados ${extraShoppingIds.length} productos de prueba en lista de compra.`);
    }
  }
  await supabase.from("shopping_items").update({ completed: false, completed_by: null, completed_at: null }).in("id", originalShoppingIds);
  console.log("8. Productos originales reseteados a no comprados: OK");

  // 6. Limpiar mensajes de chat extras (dejar solo el mensaje de bienvenida)
  const welcomeMsgId = "99999999-9999-4999-8999-999999999999";
  const { data: allMessages } = await supabase.from("messages").select("id");
  if (allMessages) {
    const extraMsgIds = allMessages
      .map((m) => m.id)
      .filter((id) => id !== welcomeMsgId);
    if (extraMsgIds.length > 0) {
      await supabase.from("messages").delete().in("id", extraMsgIds);
      console.log(`9. Eliminados ${extraMsgIds.length} mensajes de prueba.`);
    }
  }

  // Asegurar que los 3 perfiles tienen avatares limpios
  await supabase.from("profiles").update({ avatar_url: null }).neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("10. Avatares reseteados: OK");

  console.log("✨ ¡Base de datos limpia y reseteada al estado inicial!");
}

clean().catch(console.error);
