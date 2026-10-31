-- Políticas de fila. Un emprendedor solo toca su emprendimiento_id.
-- El acudiente no inicia sesión: reserva y consulta la boleta por funciones
-- security definer. No hay select abierto de pedidos para el rol anon.

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfiles
    where user_id = auth.uid() and rol = 'admin'
  );
$$;

create or replace function public.emprendimiento_actual()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select emprendimiento_id from public.perfiles
  where user_id = auth.uid() and rol = 'emprendedor';
$$;

alter table public.emprendimientos enable row level security;
alter table public.perfiles enable row level security;
alter table public.productos enable row level security;
alter table public.pedidos enable row level security;
alter table public.subpedidos enable row level security;
alter table public.subpedido_items enable row level security;
alter table public.historial_estados enable row level security;
alter table public.configuracion enable row level security;
alter table public.soporte enable row level security;

-- Emprendimientos: la tienda los lee. Solo el dueño o admin los editan.
drop policy if exists emprendimientos_lectura on public.emprendimientos;
create policy emprendimientos_lectura on public.emprendimientos
for select using (true);

drop policy if exists emprendimientos_admin_escribe on public.emprendimientos;
create policy emprendimientos_admin_escribe on public.emprendimientos
for insert with check (public.es_admin());

drop policy if exists emprendimientos_update on public.emprendimientos;
create policy emprendimientos_update on public.emprendimientos
for update using (public.es_admin() or id = public.emprendimiento_actual())
with check (public.es_admin() or id = public.emprendimiento_actual());

-- Perfiles: cada quien el suyo. Admin ve todos. Nadie lista los ajenos.
drop policy if exists perfiles_lectura on public.perfiles;
create policy perfiles_lectura on public.perfiles
for select using (public.es_admin() or user_id = auth.uid());

drop policy if exists perfiles_admin_inserta on public.perfiles;
create policy perfiles_admin_inserta on public.perfiles
for insert with check (public.es_admin());

drop policy if exists perfiles_update on public.perfiles;
create policy perfiles_update on public.perfiles
for update using (public.es_admin() or user_id = auth.uid())
with check (public.es_admin() or user_id = auth.uid());

-- Productos visibles para la tienda. Los ocultos solo los ve su equipo o admin.
drop policy if exists productos_lectura on public.productos;
create policy productos_lectura on public.productos
for select using (
  visible
  or public.es_admin()
  or emprendimiento_id = public.emprendimiento_actual()
);

drop policy if exists productos_inserta_dueno on public.productos;
create policy productos_inserta_dueno on public.productos
for insert with check (
  public.es_admin() or emprendimiento_id = public.emprendimiento_actual()
);

drop policy if exists productos_update_dueno on public.productos;
create policy productos_update_dueno on public.productos
for update using (
  public.es_admin() or emprendimiento_id = public.emprendimiento_actual()
)
with check (
  public.es_admin() or emprendimiento_id = public.emprendimiento_actual()
);

-- Pedidos y subpedidos: el equipo solo ve los suyos. Admin ve todos.
-- No hay política de select para anon. La boleta pública sale por ver_boleta().
drop policy if exists pedidos_lectura on public.pedidos;
create policy pedidos_lectura on public.pedidos
for select using (
  public.es_admin()
  or exists (
    select 1 from public.subpedidos s
    where s.pedido_id = pedidos.id
      and s.emprendimiento_id = public.emprendimiento_actual()
  )
);

drop policy if exists subpedidos_lectura on public.subpedidos;
create policy subpedidos_lectura on public.subpedidos
for select using (
  public.es_admin() or emprendimiento_id = public.emprendimiento_actual()
);

drop policy if exists subpedidos_update_dueno on public.subpedidos;
create policy subpedidos_update_dueno on public.subpedidos
for update using (
  public.es_admin() or emprendimiento_id = public.emprendimiento_actual()
)
with check (
  public.es_admin() or emprendimiento_id = public.emprendimiento_actual()
);

drop policy if exists items_lectura on public.subpedido_items;
create policy items_lectura on public.subpedido_items
for select using (
  exists (
    select 1 from public.subpedidos s
    where s.id = subpedido_items.subpedido_id
      and (public.es_admin() or s.emprendimiento_id = public.emprendimiento_actual())
  )
);

-- Nadie actualiza el precio de un ítem ya vendido. El trigger también lo impide.
revoke update on public.subpedido_items from authenticated, anon;

drop policy if exists historial_lectura on public.historial_estados;
create policy historial_lectura on public.historial_estados
for select using (
  public.es_admin()
  or exists (
    select 1 from public.subpedidos s
    where s.id = historial_estados.subpedido_id
      and s.emprendimiento_id = public.emprendimiento_actual()
  )
);

drop policy if exists historial_inserta_dueno on public.historial_estados;
create policy historial_inserta_dueno on public.historial_estados
for insert with check (
  public.es_admin()
  or exists (
    select 1 from public.subpedidos s
    join public.perfiles p on p.id = historial_estados.usuario_id
    where s.id = historial_estados.subpedido_id
      and s.emprendimiento_id = public.emprendimiento_actual()
      and p.user_id = auth.uid()
  )
);

drop policy if exists config_lectura on public.configuracion;
create policy config_lectura on public.configuracion
for select using (true);

drop policy if exists config_admin on public.configuracion;
create policy config_admin on public.configuracion
for update using (public.es_admin())
with check (public.es_admin());

drop policy if exists soporte_inserta on public.soporte;
create policy soporte_inserta on public.soporte
for insert with check (true);

drop policy if exists soporte_admin on public.soporte;
create policy soporte_admin on public.soporte
for select using (public.es_admin());

drop policy if exists soporte_admin_update on public.soporte;
create policy soporte_admin_update on public.soporte
for update using (public.es_admin())
with check (public.es_admin());

-- La reserva, el comprobante y la cancelación del acudiente no pasan por insert
-- directo: usan funciones security definer para bajar y devolver el stock en la
-- misma transacción, y para no abrir la tabla de pedidos al público.
revoke insert, update, delete on public.pedidos from anon, authenticated;
revoke insert, delete on public.subpedidos from anon, authenticated;
revoke insert, update, delete on public.subpedido_items from anon, authenticated;
