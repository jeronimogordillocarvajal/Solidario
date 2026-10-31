export const SQLITE_SCHEMA = `
CREATE TABLE IF NOT EXISTS configuracion (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  nombre_feria TEXT NOT NULL,
  color_principal TEXT NOT NULL,
  color_secundario TEXT NOT NULL,
  cierre_reservas TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS emprendimientos (
  id TEXT PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  logo_ext TEXT,
  color TEXT NOT NULL,
  stand TEXT NOT NULL DEFAULT '',
  grado TEXT NOT NULL DEFAULT '',
  meta_ventas INTEGER NOT NULL DEFAULT 0,
  acepta_efectivo INTEGER NOT NULL DEFAULT 1,
  acepta_qr INTEGER NOT NULL DEFAULT 0,
  qr_ext TEXT,
  numero_cuenta TEXT NOT NULL DEFAULT '',
  titular TEXT NOT NULL DEFAULT '',
  banco TEXT NOT NULL DEFAULT '',
  integrantes TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS perfiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'emprendedor')),
  emprendimiento_id TEXT REFERENCES emprendimientos(id),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS productos (
  id TEXT PRIMARY KEY,
  emprendimiento_id TEXT NOT NULL REFERENCES emprendimientos(id),
  codigo TEXT NOT NULL UNIQUE,
  secuencia INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  precio INTEGER NOT NULL CHECK (precio > 0),
  categoria TEXT NOT NULL CHECK (categoria IN ('comestibles', 'ropa', 'accesorios', 'otros')),
  stock INTEGER NOT NULL CHECK (stock >= 0),
  foto_ext TEXT,
  visible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  UNIQUE (emprendimiento_id, secuencia)
);

CREATE TABLE IF NOT EXISTS pedidos (
  id TEXT PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  acudiente TEXT NOT NULL,
  estudiante TEXT NOT NULL,
  curso TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subpedidos (
  id TEXT PRIMARY KEY,
  pedido_id TEXT NOT NULL REFERENCES pedidos(id),
  emprendimiento_id TEXT NOT NULL REFERENCES emprendimientos(id),
  codigo TEXT NOT NULL UNIQUE,
  metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('efectivo', 'qr')),
  estado TEXT NOT NULL CHECK (estado IN ('por_cobrar', 'pago_reportado', 'pagado', 'entregado', 'cancelado')),
  subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
  comprobante_numero TEXT,
  comprobante_ext TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subpedido_items (
  id TEXT PRIMARY KEY,
  subpedido_id TEXT NOT NULL REFERENCES subpedidos(id),
  producto_id TEXT NOT NULL REFERENCES productos(id),
  nombre TEXT NOT NULL,
  precio INTEGER NOT NULL CHECK (precio > 0),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0)
);

CREATE TABLE IF NOT EXISTS historial_estados (
  id TEXT PRIMARY KEY,
  subpedido_id TEXT NOT NULL REFERENCES subpedidos(id),
  estado_anterior TEXT,
  estado_nuevo TEXT NOT NULL,
  usuario_id TEXT REFERENCES perfiles(id),
  actor TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS soporte (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('abierto', 'resuelto')),
  respuesta TEXT,
  created_at TEXT NOT NULL,
  resuelto_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_productos_emp ON productos(emprendimiento_id);
CREATE INDEX IF NOT EXISTS idx_subpedidos_emp ON subpedidos(emprendimiento_id);
CREATE INDEX IF NOT EXISTS idx_subpedidos_pedido ON subpedidos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_items_sub ON subpedido_items(subpedido_id);
CREATE INDEX IF NOT EXISTS idx_historial_sub ON historial_estados(subpedido_id);
CREATE INDEX IF NOT EXISTS idx_perfiles_emp ON perfiles(emprendimiento_id);

CREATE TRIGGER IF NOT EXISTS impedir_cambio_precio
BEFORE UPDATE OF precio ON subpedido_items
FOR EACH ROW
WHEN NEW.precio != OLD.precio
BEGIN
  SELECT RAISE(ABORT, 'No se puede cambiar el precio de un pedido ya hecho');
END;

CREATE TRIGGER IF NOT EXISTS impedir_cambio_subtotal
BEFORE UPDATE OF subtotal ON subpedidos
FOR EACH ROW
WHEN NEW.subtotal != OLD.subtotal
BEGIN
  SELECT RAISE(ABORT, 'No se puede cambiar el valor de un pedido ya hecho');
END;

CREATE TRIGGER IF NOT EXISTS impedir_cambio_codigo_producto
BEFORE UPDATE OF codigo ON productos
FOR EACH ROW
WHEN NEW.codigo != OLD.codigo
BEGIN
  SELECT RAISE(ABORT, 'El código del producto no se puede cambiar');
END;

CREATE TRIGGER IF NOT EXISTS impedir_cambio_codigo_emprendimiento
BEFORE UPDATE OF codigo ON emprendimientos
FOR EACH ROW
WHEN NEW.codigo != OLD.codigo
BEGIN
  SELECT RAISE(ABORT, 'El código del emprendimiento no se puede cambiar');
END;
`;
