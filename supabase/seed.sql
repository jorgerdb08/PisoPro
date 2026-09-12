-- ==============================================================================
-- seed.sql
-- PisoPro: Initial Seed Data for Household, Profiles, Tasks, Shopping & Chat
-- ==============================================================================

-- 1. Insert Initial Household ("Nuestro piso")
INSERT INTO households (id, name, created_at, updated_at)
VALUES (
  '11111111-1111-4111-8111-111111111111',
  'Nuestro piso',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert 3 Preconfigured Profiles
-- Jorge (Admin)
INSERT INTO profiles (id, name, role, avatar_url, created_at, updated_at)
VALUES (
  '22222222-2222-4222-8222-222222222222',
  'Jorge',
  'admin',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Jorge',
  now(),
  now()
)
ON CONFLICT (name) DO NOTHING;

-- Samuel (Member)
INSERT INTO profiles (id, name, role, avatar_url, created_at, updated_at)
VALUES (
  '33333333-3333-4333-8333-333333333333',
  'Samuel',
  'member',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Samuel',
  now(),
  now()
)
ON CONFLICT (name) DO NOTHING;

-- David (Member)
INSERT INTO profiles (id, name, role, avatar_url, created_at, updated_at)
VALUES (
  '44444444-4444-4444-8444-444444444444',
  'David',
  'member',
  'https://api.dicebear.com/7.x/bottts/svg?seed=David',
  now(),
  now()
)
ON CONFLICT (name) DO NOTHING;

-- 3. Link all 3 members to the household
INSERT INTO household_members (household_id, user_id, joined_at)
VALUES
  ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', now()),
  ('11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333', now()),
  ('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444', now())
ON CONFLICT (household_id, user_id) DO NOTHING;

-- 4. Insert Initial Standard Chore Tasks
INSERT INTO tasks (id, household_id, title, description, category, points, frequency, assigned_user_id, status)
VALUES
  (
    'a1111111-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    'Limpiar baño',
    'Lavabo, ducha, inodoro y reposición de toallas limpias',
    'bathroom',
    4,
    'weekly',
    '22222222-2222-4222-8222-222222222222', -- Asignado inicialmente a Jorge
    'pending'
  ),
  (
    'b2222222-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '11111111-1111-4111-8111-111111111111',
    'Limpiar cocina',
    'Encimera, fuegos, fregadero y vaciar el lavavajillas',
    'kitchen',
    3,
    'weekly',
    '33333333-3333-4333-8333-333333333333', -- Asignado inicialmente a Samuel
    'pending'
  ),
  (
    'c3333333-cccc-4ccc-8ccc-cccccccccccc',
    '11111111-1111-4111-8111-111111111111',
    'Sacar basura',
    'Orgánico, envases, papel y vidrio a los contenedores',
    'trash',
    1,
    'daily',
    '44444444-4444-4444-8444-444444444444', -- Asignado inicialmente a David
    'pending'
  ),
  (
    'd4444444-dddd-4ddd-8ddd-dddddddddddd',
    '11111111-1111-4111-8111-111111111111',
    'Barrer zonas comunes',
    'Pasillo, salón y entrada principal',
    'cleaning',
    2,
    'weekly',
    '22222222-2222-4222-8222-222222222222',
    'pending'
  ),
  (
    'e5555555-eeee-4eee-8eee-eeeeeeeeeeee',
    '11111111-1111-4111-8111-111111111111',
    'Fregar suelo',
    'Fregar suelo de cocina, baño y pasillo',
    'cleaning',
    2,
    'weekly',
    '33333333-3333-4333-8333-333333333333',
    'pending'
  ),
  (
    'f6666666-ffff-4fff-8fff-ffffffffffff',
    '11111111-1111-4111-8111-111111111111',
    'Ordenar salón',
    'Mesa de centro, cojines y ventilar la estancia',
    'living',
    2,
    'weekly',
    '44444444-4444-4444-8444-444444444444',
    'pending'
  )
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Initial Shopping Items
INSERT INTO shopping_items (id, household_id, name, quantity, added_by, completed)
VALUES
  (
    '10101010-1010-4010-8010-101010101010',
    '11111111-1111-4111-8111-111111111111',
    'Papel higiénico',
    '1 paquete',
    '22222222-2222-4222-8222-222222222222',
    false
  ),
  (
    '20202020-2020-4020-8020-202020202020',
    '11111111-1111-4111-8111-111111111111',
    'Leche entera',
    '6 briks',
    '33333333-3333-4333-8333-333333333333',
    false
  ),
  (
    '30303030-3030-4030-8030-303030303030',
    '11111111-1111-4111-8111-111111111111',
    'Café en grano',
    '500g',
    '44444444-4444-4444-8444-444444444444',
    false
  )
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Welcome Chat Message
INSERT INTO messages (id, household_id, user_id, content, created_at)
VALUES (
  '99999999-9999-4999-8999-999999999999',
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '¡Bienvenidos a PisoPro! Aquí organizaremos las tareas, los gastos y las compras del piso.',
  now()
)
ON CONFLICT (id) DO NOTHING;
