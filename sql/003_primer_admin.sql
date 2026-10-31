-- Primer administrador
--
-- 1. En Supabase: Authentication → Users → Add user.
--    Correo: el de coordinación, por ejemplo admin@colegio.edu.co
--    Contraseña: la que definan. No la pongas en este archivo.
--    Copia el UUID del usuario (User UID).
--
-- 2. En el SQL editor, reemplaza el UUID y el correo, y ejecuta:

insert into public.perfiles (user_id, email, nombre, rol, emprendimiento_id)
values (
  '00000000-0000-0000-0000-000000000000',
  'admin@colegio.edu.co',
  'Coordinación de feria',
  'admin',
  null
);

-- 3. Entra a /ingreso con ese correo. Desde Administración → Equipos
--    crea cada emprendimiento y la cuenta de los estudiantes.
--    El código (E01, E02…) se asigna solo.
--
-- Demo local, sin Supabase:
--   npm run create-admin -- admin@colegio.edu.co "Coordinación de feria" "una-clave-larga"
-- La base de demostración ya trae admin@feriago.edu.co / FeriaAdmin2026.
