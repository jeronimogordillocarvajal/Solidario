# Feria Go

Tienda de la feria empresarial para los acudientes, panel de cada emprendimiento y coordinación. Pensada para usarse desde el celular.

El color principal es `#0F6E56` y el secundario `#E3A008`. Cada equipo además elige el color de su negocio.

## Cómo correrla

```bash
npm install
npm run dev -- --port 47231
```

Abre [http://127.0.0.1:47231](http://127.0.0.1:47231). La primera vez se crea `data/feria.db` con tres emprendimientos, productos, pedidos de ejemplo y las cuentas de abajo.

Para volver a ese estado, detén el servidor y ejecuta `npm run reset-demo`.

## Cuentas de demostración

| Quién | Correo | Contraseña |
| --- | --- | --- |
| Coordinación | admin@feriago.edu.co | FeriaAdmin2026 |
| Sazón del Recreo (E01) | sazon@feriago.edu.co | Sazon2026 |
| Hilo & Tinta (E02) | hilo@feriago.edu.co | Hilo2026 |
| Broches Luna (E03) | broches@feriago.edu.co | Broches2026 |

Los acudientes no inician sesión. Reservan en la tienda y reciben una boleta por emprendimiento (`FG-XXXX-E03`).

## Qué puede hacer cada quien

- **Tienda:** armar un carrito de varios negocios, pagar uno en efectivo y otro por el QR de ese negocio, reportar el comprobante y cancelar una boleta que aún no está pagada. El stock baja al reservar y vuelve al cancelar. No se puede reservar más de lo que hay.
- **Emprendedor** (`/emprendedor`): solo ve su negocio. Confirma QR, registra efectivo, marca entregado, administra productos, sube su QR y edita el perfil. Las tablas anchas se deslizan en horizontal en el celular. Un pedido nuevo aparece sin recargar y suena si se activó el sonido.
- **Admin** (`/admin`): ve todos los pedidos, exporta Excel, resuelve soporte y crea equipos.

Las reservas se cierran solas el **19 de noviembre de 2026 a medianoche, hora de Bogotá** (el instante `2026-11-20T00:00:00-05:00`). Coordinación puede cambiar esa fecha en Ajustes.

## Primer administrador

En esta demo ya existe `admin@feriago.edu.co`. Para crear otro en la base local:

```bash
npm run create-admin -- admin@colegio.edu.co "Coordinación de feria" "una-clave-larga"
```

En Supabase el orden está en [`sql/003_primer_admin.sql`](sql/003_primer_admin.sql): se crea el usuario en Authentication y luego se inserta en `perfiles` con rol `admin`.

## SQL y acceso

- [`sql/001_tablas.sql`](sql/001_tablas.sql) crea emprendimientos, productos, pedidos, `perfiles`, `historial_estados`, `configuracion` y soporte. Un trigger impide cambiar el precio de un pedido ya hecho y el código de un producto.
- [`sql/002_politicas.sql`](sql/002_politicas.sql) activa Row Level Security por `emprendimiento_id`. Un emprendedor no lee pedidos de otro equipo.
- El demo corre con SQLite y aplica las mismas reglas en el servidor. No hace falta una cuenta de Supabase para probarlo.

La guía de una página para los estudiantes está en [`/guia`](http://127.0.0.1:47231/guia) y en [`GUIA-ESTUDIANTES.md`](GUIA-ESTUDIANTES.md).

## Pruebas

```bash
npm test
npm run lint
```
