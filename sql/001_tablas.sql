-- Feria Go · esquema para Postgres / Supabase
-- Incluye perfiles, historial_estados y configuracion, más las tablas de la feria.
-- En el demo local la contraseña vive en SQLite. En Supabase la guarda Authentication
-- y perfiles solo apunta a auth.users.

create extension if not exists pgcrypto;

create table if not exists public.emprendimientos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre text not null,
  descripcion text not null default '',
  logo_path text,
  color text not null default '#0F6E56',
  stand text not null default '',
  grado text not null default '',
  meta_ventas integer not null default 0 check (meta_ventas >= 0),
  acepta_efectivo boolean not null default true,
  acepta_qr boolean not null default false,
  qr_path text,
  numero_cuenta text not null default '',
  titular text not null default '',
  banco text not null default '',
  integrantes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.perfiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  email text not null unique,
  nombre text not null,
  rol text not null check (rol in ('admin', 'emprendedor')),
  emprendimiento_id uuid references public.emprendimientos (id),
  created_at timestamptz not null default now(),
  check (
    (rol = 'admin' and emprendimiento_id is null)
    or (rol = 'emprendedor' and emprendimiento_id is not null)
  )
);

create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  emprendimiento_id uuid not null references public.emprendimientos (id),
  codigo text not null unique,
  secuencia integer not null check (secuencia > 0),
  nombre text not null,
  descripcion text not null default '',
  precio integer not null check (precio > 0),
  categoria text not null check (categoria in ('comestibles', 'ropa', 'accesorios', 'otros')),
  stock integer not null check (stock >= 0),
  foto_path text,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  unique (emprendimiento_id, secuencia)
);

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  acudiente text not null,
  estudiante text not null,
  curso text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.subpedidos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id),
  emprendimiento_id uuid not null references public.emprendimientos (id),
  codigo text not null unique,
  metodo_pago text not null check (metodo_pago in ('efectivo', 'qr')),
  estado text not null check (estado in ('por_cobrar', 'pago_reportado', 'pagado', 'entregado', 'cancelado')),
  subtotal integer not null check (subtotal >= 0),
  comprobante_numero text,
  comprobante_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subpedido_items (
  id uuid primary key default gen_random_uuid(),
  subpedido_id uuid not null references public.subpedidos (id),
  producto_id uuid not null references public.productos (id),
  nombre text not null,
  precio integer not null check (precio > 0),
  cantidad integer not null check (cantidad > 0)
);

create table if not exists public.historial_estados (
  id uuid primary key default gen_random_uuid(),
  subpedido_id uuid not null references public.subpedidos (id),
  estado_anterior text,
  estado_nuevo text not null,
  usuario_id uuid references public.perfiles (id),
  actor text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.configuracion (
  id integer primary key default 1 check (id = 1),
  nombre_feria text not null,
  color_principal text not null default '#0F6E56',
  color_secundario text not null default '#E3A008',
  -- Medianoche que cierra el 19 de noviembre de 2026, hora de Bogotá.
  cierre_reservas timestamptz not null default '2026-11-20 00:00:00-05',
  updated_at timestamptz not null default now()
);

create table if not exists public.soporte (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  correo text not null,
  mensaje text not null,
  estado text not null default 'abierto' check (estado in ('abierto', 'resuelto')),
  respuesta text,
  created_at timestamptz not null default now(),
  resuelto_at timestamptz
);

insert into public.configuracion (id, nombre_feria)
values (1, 'Feria Go')
on conflict (id) do nothing;

create index if not exists idx_productos_emp on public.productos (emprendimiento_id);
create index if not exists idx_subpedidos_emp on public.subpedidos (emprendimiento_id);
create index if not exists idx_subpedidos_pedido on public.subpedidos (pedido_id);
create index if not exists idx_items_sub on public.subpedido_items (subpedido_id);
create index if not exists idx_historial_sub on public.historial_estados (subpedido_id);
create index if not exists idx_perfiles_emp on public.perfiles (emprendimiento_id);

-- Un pedido ya hecho conserva el precio y el subtotal con los que se reservó.
create or replace function public.impedir_cambio_precio_pedido()
returns trigger
language plpgsql
as $$
begin
  if new.precio is distinct from old.precio then
    raise exception 'No se puede cambiar el precio de un pedido ya hecho';
  end if;
  return new;
end;
$$;

drop trigger if exists impedir_cambio_precio on public.subpedido_items;
create trigger impedir_cambio_precio
before update of precio on public.subpedido_items
for each row execute function public.impedir_cambio_precio_pedido();

create or replace function public.impedir_cambio_subtotal()
returns trigger
language plpgsql
as $$
begin
  if new.subtotal is distinct from old.subtotal then
    raise exception 'No se puede cambiar el valor de un pedido ya hecho';
  end if;
  return new;
end;
$$;

drop trigger if exists impedir_cambio_subtotal on public.subpedidos;
create trigger impedir_cambio_subtotal
before update of subtotal on public.subpedidos
for each row execute function public.impedir_cambio_subtotal();

create or replace function public.impedir_cambio_codigo_producto()
returns trigger
language plpgsql
as $$
begin
  if new.codigo is distinct from old.codigo then
    raise exception 'El código del producto no se puede cambiar';
  end if;
  return new;
end;
$$;

drop trigger if exists impedir_cambio_codigo_producto on public.productos;
create trigger impedir_cambio_codigo_producto
before update of codigo on public.productos
for each row execute function public.impedir_cambio_codigo_producto();

create or replace function public.impedir_cambio_codigo_emprendimiento()
returns trigger
language plpgsql
as $$
begin
  if new.codigo is distinct from old.codigo then
    raise exception 'El código del emprendimiento no se puede cambiar';
  end if;
  return new;
end;
$$;

drop trigger if exists impedir_cambio_codigo_emprendimiento on public.emprendimientos;
create trigger impedir_cambio_codigo_emprendimiento
before update of codigo on public.emprendimientos
for each row execute function public.impedir_cambio_codigo_emprendimiento();
