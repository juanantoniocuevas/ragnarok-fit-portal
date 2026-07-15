## Objetivo

Reemplazar el modelo actual (invitación entrenador↔cliente con `trainer_clients.accepted_at`) por un modelo de administración directo: cualquier usuario con rol `trainer` es administrador y puede ver, crear, editar y gestionar la contraseña/estado de todos los clientes.

## 1. Base de datos (migración)

- **Trigger `handle_new_user`**: verificar que sigue creando `profiles` + `user_roles(client)` para cada nuevo `auth.users`. Añadir `ON CONFLICT DO NOTHING` (ya está) y confirmar `SECURITY DEFINER`.
- **Profiles**: agregar columnas `avatar_url text`, `status text default 'active' check (status in ('active','disabled'))`, `disabled_at timestamptz`. Ya existe `created_at`.
- **RLS de `profiles`**:
  - Eliminar la política "Trainers can update assigned client profiles" (basada en `trainer_clients`).
  - Nueva política `profiles_trainer_select_all`: `has_role(auth.uid(), 'trainer')` → SELECT todos.
  - Nueva política `profiles_trainer_update_all`: `has_role(auth.uid(), 'trainer')` → UPDATE todos.
- **RLS de `physical_profiles`, `measurements`, `recommendations`**: reemplazar `is_trainer_of(...)` por `has_role(auth.uid(),'trainer')` para SELECT/INSERT/UPDATE administrativa.
- **`user_roles`**: agregar política `SELECT` para trainers (ver roles de todos), sin permitir modificar.
- Mantener `trainer_clients` para no romper datos históricos, pero la app dejará de usarla. (No la eliminamos en esta iteración.)
- Función `admin_reset_client(_client_id uuid)`: no necesaria; se hará con `supabase.auth.admin` desde server fn.

## 2. Server functions (admin, con service role)

Nuevo archivo `src/lib/admin-clients.functions.ts`:

- `adminCreateClient({ email, password, fullName, phone })`: valida caller es trainer vía `requireSupabaseAuth` + `has_role`. Usa `supabaseAdmin.auth.admin.createUser` con `email_confirm: true` y `user_metadata.full_name`. El trigger crea profile+rol.
- `adminUpdateClient({ clientId, patch })`: actualiza `profiles` (nombre, email, teléfono). Si cambia email, actualiza también en `auth.users` con `supabaseAdmin.auth.admin.updateUserById`.
- `adminResetClientPassword({ clientId })`: genera password temporal (`crypto.randomUUID().slice(0,12)`) con `supabaseAdmin.auth.admin.updateUserById` y la devuelve al trainer para compartirla. Alternativa: enviar magic link con `generateLink`.
- `adminSetClientStatus({ clientId, status })`: actualiza `profiles.status` y llama `supabaseAdmin.auth.admin.updateUserById` con `ban_duration: '876000h'` para deshabilitar o `'none'` para reactivar.
- `adminGetClientLastSignIn({ clientId })`: devuelve `last_sign_in_at` de `auth.admin.getUserById`.

Todas las funciones cargan `client.server` dentro del `.handler()` con `await import()` para no romper el bundling del cliente.

## 3. UI: panel admin

### `/admin/clients` (listado)

- Query única: `profiles` de todos los usuarios con rol `client` (join vía `user_roles`) + búsqueda por nombre/email.
- Botón **"Crear cliente"** abre modal con: nombre, email, teléfono, contraseña temporal (autogenerada si se deja vacío). Al enviar → `adminCreateClient` → recarga lista → toast con la contraseña temporal.
- Cada fila: nombre, email, estado (activo/deshabilitado), fecha creación, acciones (ver ficha, deshabilitar/reactivar).
- Se elimina la lógica de invitación (`trainer_clients` insert / accepted).

### `/admin/clients/$clientId` (ficha completa)

Reordenar en tres secciones:

**Sección 1 – Resumen general** (arriba)
- Avatar, nombre, edad, peso actual, estatura, objetivo, fecha creación, último inicio de sesión (`adminGetClientLastSignIn`), estado. Botones: editar datos, restablecer contraseña, activar/desactivar.

**Sección 2 – Progreso** (misma info que ve el cliente)
- Todos los gráficos de `MEASUREMENT_FIELDS` (ya existentes) + IMC calculado + línea de tiempo idéntica a `/dashboard/progress`.

**Sección 3 – Historial**
- Tabla completa de evaluaciones (ya existe).
- Recomendaciones (crear/editar/borrar) – ya existe.

### `/dashboard/*` (cliente)

- Eliminar el bloque de "invitaciones de preparador" del dashboard cliente (ya no aplica).
- Todo lo demás se mantiene tal cual.

## 4. Registro público (`/signup`)

- Sin cambios en el flujo salvo confirmar que el trigger crea profile + rol correctamente. Añadir un toast/log si el profile no existe tras 2s (verificación defensiva).

## 5. Sincronización en tiempo real

- En `/admin/clients` y `/admin/clients/$clientId`, suscribir realtime a los cambios de `profiles`, `physical_profiles`, `measurements`, `recommendations` para el/los clientId con `supabase.channel(...).on('postgres_changes', ...)`. Al recibir evento → recargar.
- En `/dashboard/*` igualmente, para reflejar cambios administrativos al instante.

## 6. Seguridad

- RLS de clientes: siguen restringidos a `auth.uid()`.
- RLS de trainers: SELECT/UPDATE globales solo si `has_role(auth.uid(),'trainer')`.
- Server fns admin: validan rol antes de cualquier operación privilegiada.
- `SUPABASE_SERVICE_ROLE_KEY` solo dentro del `.handler()` vía `await import('@/integrations/supabase/client.server')`.

## 7. Fuera de alcance

- Filtros avanzados por entrenador/estado (solo búsqueda por nombre, como pediste).
- Eliminar tablas legadas (`trainer_clients`) — se conservan intactas para no perder datos.

## Detalles técnicos

- Middleware bearer (`attachSupabaseAuth`) ya registrado en `src/start.ts`.
- Uso de `supabase.auth.admin.createUser({ email_confirm: true })` para que el cliente pueda entrar directo con la contraseña temporal (sin verificación de correo).
- Password temporal generada con `crypto.randomUUID().replace(/-/g,'').slice(0,12)` si el admin no proporciona una.
- Realtime: canales con cleanup en `useEffect` return.

¿Aprobado para implementar?
