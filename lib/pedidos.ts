import { randomBytes, randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import type { Estado } from "./constants";
import { ensureDb } from "./db";
import { AppError } from "./errors";
import { reservasAbiertas } from "./format";
import { publicarPedido } from "./events";
import { detectarImagen } from "./images";
import type { BoletaSubpedido, Session } from "./types";
import { mediaUrl, writeUpload } from "./uploads";

type DatabaseHandle = Database.Database;

type RawSub = {
  id: string;
  codigo: string;
  pedido_codigo: string;
  created_at: string;
  acudiente: string;
  estudiante: string;
  curso: string;
  metodo_pago: "efectivo" | "qr";
  estado: Estado;
  subtotal: number;
  comprobante_numero: string | null;
  comprobante_ext: string | null;
  emprendimiento_id: string;
  emp_codigo: string;
  emp_nombre: string;
  banco: string;
  numero_cuenta: string;
  titular: string;
  qr_ext: string | null;
  stand: string;
  grado: string;
  color: string;
};

type RawItem = {
  id: string;
  subpedido_id: string;
  nombre: string;
  precio: number;
  cantidad: number;
};

type RawHist = {
  id: string;
  subpedido_id: string;
  estado_anterior: string | null;
  estado_nuevo: Estado;
  actor: string;
  usuario_id: string | null;
  created_at: string;
};

export type Boleta = {
  codigo: string;
  createdAt: string;
  acudiente: string;
  estudiante: string;
  curso: string;
  subpedidos: BoletaSubpedido[];
};

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function code4() {
  const bytes = randomBytes(4);
  let value = "";
  for (const byte of bytes) value += ALPHABET[byte % ALPHABET.length];
  return value;
}

function nuevoCodigo(database: DatabaseHandle) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const codigo = `FG-${code4()}`;
    const exists = database.prepare("SELECT 1 FROM pedidos WHERE codigo = ?").get(codigo);
    if (!exists) return codigo;
  }
  throw new AppError("No pudimos asignar un código de pedido. Intenta de nuevo.");
}

function cargar(
  database: DatabaseHandle,
  where: string,
  params: unknown[],
  comprobante: "panel" | "boleta",
): BoletaSubpedido[] {
  const subs = database
    .prepare(
      `SELECT s.id, s.codigo, s.created_at, s.metodo_pago, s.estado, s.subtotal,
              s.comprobante_numero, s.comprobante_ext, s.emprendimiento_id,
              p.codigo AS pedido_codigo, p.acudiente, p.estudiante, p.curso,
              e.codigo AS emp_codigo, e.nombre AS emp_nombre, e.banco, e.numero_cuenta,
              e.titular, e.qr_ext, e.stand, e.grado, e.color
       FROM subpedidos s
       JOIN pedidos p ON p.id = s.pedido_id
       JOIN emprendimientos e ON e.id = s.emprendimiento_id
       WHERE ${where}
       ORDER BY s.created_at DESC`,
    )
    .all(...params) as RawSub[];
  if (subs.length === 0) return [];
  const ids = subs.map((sub) => sub.id);
  const marks = ids.map(() => "?").join(",");
  const items = database
    .prepare(
      `SELECT id, subpedido_id, nombre, precio, cantidad
       FROM subpedido_items WHERE subpedido_id IN (${marks})`,
    )
    .all(...ids) as RawItem[];
  const historial = database
    .prepare(
      `SELECT id, subpedido_id, estado_anterior, estado_nuevo, actor, usuario_id, created_at
       FROM historial_estados WHERE subpedido_id IN (${marks})
       ORDER BY created_at ASC`,
    )
    .all(...ids) as RawHist[];

  return subs.map((sub) => ({
    id: sub.id,
    codigo: sub.codigo,
    pedidoCodigo: sub.pedido_codigo,
    createdAt: sub.created_at,
    acudiente: sub.acudiente,
    estudiante: sub.estudiante,
    curso: sub.curso,
    metodo: sub.metodo_pago,
    estado: sub.estado,
    subtotal: sub.subtotal,
    comprobanteNumero: sub.comprobante_numero,
    comprobanteUrl: sub.comprobante_ext
      ? comprobante === "boleta"
        ? `/api/boletas/${sub.pedido_codigo}/comprobante/${sub.id}`
        : mediaUrl("comprobantes", sub.id)
      : null,
    emprendimientoId: sub.emprendimiento_id,
    emprendimientoCodigo: sub.emp_codigo,
    emprendimientoNombre: sub.emp_nombre,
    banco: sub.banco,
    numeroCuenta: sub.numero_cuenta,
    titular: sub.titular,
    qrUrl: sub.qr_ext ? mediaUrl("qrs", sub.emprendimiento_id) : null,
    stand: sub.stand,
    grado: sub.grado,
    color: sub.color,
    items: items
      .filter((item) => item.subpedido_id === sub.id)
      .map((item) => ({
        id: item.id,
        nombre: item.nombre,
        precio: item.precio,
        cantidad: item.cantidad,
      })),
    historial: historial
      .filter((entry) => entry.subpedido_id === sub.id)
      .map((entry) => ({
        id: entry.id,
        estadoAnterior: entry.estado_anterior,
        estadoNuevo: entry.estado_nuevo,
        actor: entry.actor,
        usuarioId: entry.usuario_id,
        createdAt: entry.created_at,
      })),
  }));
}

function anotarEstado(
  database: DatabaseHandle,
  subpedidoId: string,
  anterior: string | null,
  nuevo: string,
  usuarioId: string | null,
  actor: string,
) {
  database
    .prepare(
      `INSERT INTO historial_estados
        (id, subpedido_id, estado_anterior, estado_nuevo, usuario_id, actor, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(randomUUID(), subpedidoId, anterior, nuevo, usuarioId, actor, new Date().toISOString());
}

function texto(value: string, etiqueta: string, min: number, max: number) {
  const limpio = value.trim().replace(/\s+/g, " ");
  if (limpio.length < min || limpio.length > max) {
    throw new AppError(`${etiqueta} debe tener entre ${min} y ${max} caracteres.`);
  }
  return limpio;
}

export async function listarDelEmprendimiento(emprendimientoId: string) {
  const database = await ensureDb();
  return cargar(database, "s.emprendimiento_id = ?", [emprendimientoId], "panel");
}

export async function listarTodos() {
  const database = await ensureDb();
  return cargar(database, "1 = 1", [], "panel");
}

export async function obtenerBoleta(codigo: string): Promise<Boleta | null> {
  const database = await ensureDb();
  const pedido = database
    .prepare("SELECT codigo, acudiente, estudiante, curso, created_at FROM pedidos WHERE codigo = ?")
    .get(codigo) as
    | { codigo: string; acudiente: string; estudiante: string; curso: string; created_at: string }
    | undefined;
  if (!pedido) return null;
  return {
    codigo: pedido.codigo,
    createdAt: pedido.created_at,
    acudiente: pedido.acudiente,
    estudiante: pedido.estudiante,
    curso: pedido.curso,
    subpedidos: cargar(database, "p.codigo = ?", [codigo], "boleta"),
  };
}

export async function crearReserva(input: {
  acudiente: string;
  estudiante: string;
  curso: string;
  items: { productoId: string; cantidad: number }[];
  pagos: { emprendimientoId: string; metodo: "efectivo" | "qr" }[];
}) {
  const acudiente = texto(input.acudiente, "El nombre del acudiente", 3, 80);
  const estudiante = texto(input.estudiante, "El nombre del estudiante", 3, 80);
  const curso = texto(input.curso, "El curso", 1, 40);
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new AppError("Agrega al menos un producto.");
  }

  const cantidades = new Map<string, number>();
  for (const item of input.items) {
    if (!item?.productoId || !Number.isInteger(item.cantidad) || item.cantidad < 1 || item.cantidad > 99) {
      throw new AppError("Revisa las cantidades. Cada una va de 1 a 99.");
    }
    cantidades.set(item.productoId, (cantidades.get(item.productoId) ?? 0) + item.cantidad);
  }

  const database = await ensureDb();
  const reservar = database.transaction(() => {
    const config = database
      .prepare("SELECT cierre_reservas FROM configuracion WHERE id = 1")
      .get() as { cierre_reservas: string };
    if (!reservasAbiertas(config.cierre_reservas)) {
      throw new AppError("Las reservas ya cerraron. El cierre fue el 19 de noviembre a medianoche.");
    }

    type ProductoRow = {
      id: string;
      nombre: string;
      precio: number;
      stock: number;
      visible: number;
      emprendimiento_id: string;
      emp_codigo: string;
      emp_nombre: string;
      acepta_efectivo: number;
      acepta_qr: number;
      qr_ext: string | null;
      cantidad: number;
    };

    const productos: ProductoRow[] = [];
    for (const [productoId, cantidad] of cantidades) {
      const row = database
        .prepare(
          `SELECT p.id, p.nombre, p.precio, p.stock, p.visible, p.emprendimiento_id,
                  e.codigo AS emp_codigo, e.nombre AS emp_nombre,
                  e.acepta_efectivo, e.acepta_qr, e.qr_ext
           FROM productos p
           JOIN emprendimientos e ON e.id = p.emprendimiento_id
           WHERE p.id = ?`,
        )
        .get(productoId) as Omit<ProductoRow, "cantidad"> | undefined;
      if (!row || !row.visible) throw new AppError("Un producto ya no está disponible.");
      if (cantidad > row.stock) {
        throw new AppError(`Solo quedan ${row.stock} de ${row.nombre}.`);
      }
      productos.push({ ...row, cantidad });
    }

    const grupos = new Map<string, ProductoRow[]>();
    for (const producto of productos) {
      const lista = grupos.get(producto.emprendimiento_id) ?? [];
      lista.push(producto);
      grupos.set(producto.emprendimiento_id, lista);
    }
    if (input.pagos.length !== grupos.size) {
      throw new AppError("Elige cómo paga cada emprendimiento.");
    }
    const metodoPorEmp = new Map<string, "efectivo" | "qr">();
    for (const pago of input.pagos) {
      if (!grupos.has(pago.emprendimientoId)) {
        throw new AppError("Hay un método de pago que no corresponde a la reserva.");
      }
      if (pago.metodo !== "efectivo" && pago.metodo !== "qr") {
        throw new AppError("El método de pago no es válido.");
      }
      const muestra = grupos.get(pago.emprendimientoId)![0];
      if (pago.metodo === "efectivo" && !muestra.acepta_efectivo) {
        throw new AppError(`${muestra.emp_nombre} no acepta efectivo.`);
      }
      if (pago.metodo === "qr" && !muestra.acepta_qr) {
        throw new AppError(`${muestra.emp_nombre} no acepta QR.`);
      }
      if (pago.metodo === "qr" && !muestra.qr_ext) {
        throw new AppError(`${muestra.emp_nombre} aún no publica la imagen de su QR.`);
      }
      metodoPorEmp.set(pago.emprendimientoId, pago.metodo);
    }

    for (const producto of productos) {
      const updated = database
        .prepare(
          "UPDATE productos SET stock = stock - ? WHERE id = ? AND visible = 1 AND stock >= ?",
        )
        .run(producto.cantidad, producto.id, producto.cantidad);
      if (updated.changes !== 1) {
        const actual = database
          .prepare("SELECT nombre, stock FROM productos WHERE id = ?")
          .get(producto.id) as { nombre: string; stock: number } | undefined;
        throw new AppError(
          actual
            ? `Solo quedan ${actual.stock} de ${actual.nombre}.`
            : "Un producto ya no está disponible.",
        );
      }
    }

    const ahora = new Date().toISOString();
    const codigo = nuevoCodigo(database);
    const pedidoId = randomUUID();
    database
      .prepare(
        "INSERT INTO pedidos (id, codigo, acudiente, estudiante, curso, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(pedidoId, codigo, acudiente, estudiante, curso, ahora);

    const eventos: Array<{
      id: string;
      codigo: string;
      emprendimientoId: string;
      estudiante: string;
      subtotal: number;
    }> = [];

    for (const [emprendimientoId, grupo] of grupos) {
      const subtotal = grupo.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
      const subId = randomUUID();
      const subCodigo = `${codigo}-${grupo[0].emp_codigo}`;
      const metodo = metodoPorEmp.get(emprendimientoId)!;
      database
        .prepare(
          `INSERT INTO subpedidos
            (id, pedido_id, emprendimiento_id, codigo, metodo_pago, estado, subtotal,
             comprobante_numero, comprobante_ext, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'por_cobrar', ?, NULL, NULL, ?, ?)`,
        )
        .run(subId, pedidoId, emprendimientoId, subCodigo, metodo, subtotal, ahora, ahora);
      for (const item of grupo) {
        database
          .prepare(
            `INSERT INTO subpedido_items (id, subpedido_id, producto_id, nombre, precio, cantidad)
             VALUES (?, ?, ?, ?, ?, ?)`,
          )
          .run(randomUUID(), subId, item.id, item.nombre, item.precio, item.cantidad);
      }
      anotarEstado(database, subId, null, "por_cobrar", null, "acudiente");
      eventos.push({
        id: subId,
        codigo: subCodigo,
        emprendimientoId,
        estudiante,
        subtotal,
      });
    }

    return { codigo, eventos };
  });

  const resultado = reservar.immediate();
  for (const evento of resultado.eventos) {
    publicarPedido({ type: "nuevo_pedido", ...evento });
  }
  return { codigo: resultado.codigo };
}

export async function reportarComprobante(
  pedidoCodigo: string,
  subpedidoId: string,
  numero: string,
  imagen: Buffer,
) {
  const comprobante = numero.trim();
  if (comprobante.length < 3 || comprobante.length > 40) {
    throw new AppError("Escribe el número del comprobante (entre 3 y 40 caracteres).");
  }
  const ext = detectarImagen(imagen);
  const database = await ensureDb();
  const aplicar = database.transaction(() => {
    const sub = database
      .prepare(
        `SELECT s.id, s.estado, s.metodo_pago, s.emprendimiento_id, s.codigo, s.subtotal, p.estudiante
         FROM subpedidos s JOIN pedidos p ON p.id = s.pedido_id
         WHERE s.id = ? AND p.codigo = ?`,
      )
      .get(subpedidoId, pedidoCodigo) as
      | {
          id: string;
          estado: Estado;
          metodo_pago: string;
          emprendimiento_id: string;
          codigo: string;
          subtotal: number;
          estudiante: string;
        }
      | undefined;
    if (!sub) throw new AppError("No encontramos esa boleta.", 404);
    if (sub.metodo_pago !== "qr") {
      throw new AppError("Esta boleta se paga en efectivo, en el stand.");
    }
    if (sub.estado !== "por_cobrar") {
      throw new AppError("Este pago ya fue reportado o ya cambió de estado.");
    }
    const ahora = new Date().toISOString();
    const updated = database
      .prepare(
        `UPDATE subpedidos
         SET estado = 'pago_reportado', comprobante_numero = ?, comprobante_ext = ?, updated_at = ?
         WHERE id = ? AND estado = 'por_cobrar'`,
      )
      .run(comprobante, ext, ahora, sub.id);
    if (updated.changes !== 1) throw new AppError("Este pago ya cambió de estado.");
    anotarEstado(database, sub.id, "por_cobrar", "pago_reportado", null, "acudiente");
    return sub;
  });
  const sub = aplicar.immediate();
  writeUpload("comprobantes", sub.id, ext, imagen);
  publicarPedido({
    type: "pago_reportado",
    id: sub.id,
    codigo: sub.codigo,
    emprendimientoId: sub.emprendimiento_id,
    estudiante: sub.estudiante,
    subtotal: sub.subtotal,
  });
}

export async function cancelarDesdeBoleta(pedidoCodigo: string, subpedidoId: string) {
  const database = await ensureDb();
  const cancelar = database.transaction(() => {
    const sub = database
      .prepare(
        `SELECT s.id, s.estado FROM subpedidos s
         JOIN pedidos p ON p.id = s.pedido_id
         WHERE s.id = ? AND p.codigo = ?`,
      )
      .get(subpedidoId, pedidoCodigo) as { id: string; estado: Estado } | undefined;
    if (!sub) throw new AppError("No encontramos esa boleta.", 404);
    if (sub.estado !== "por_cobrar" && sub.estado !== "pago_reportado") {
      throw new AppError("Un pedido pagado o entregado ya no se puede cancelar.");
    }
    moverEstado(database, sub.id, sub.estado, "cancelado", null, "acudiente");
  });
  cancelar.immediate();
}

type Accion = "recibi_efectivo" | "confirmar_qr" | "rechazar_qr" | "entregado" | "cancelar";

function destino(estado: Estado, metodo: string, accion: Accion): Estado {
  if (accion === "recibi_efectivo") {
    if (metodo !== "efectivo" || estado !== "por_cobrar") {
      throw new AppError("Este pedido no está esperando efectivo.");
    }
    return "pagado";
  }
  if (accion === "confirmar_qr") {
    if (metodo !== "qr" || estado !== "pago_reportado") {
      throw new AppError("No hay un pago por QR pendiente de confirmar.");
    }
    return "pagado";
  }
  if (accion === "rechazar_qr") {
    if (metodo !== "qr" || estado !== "pago_reportado") {
      throw new AppError("No hay un pago por QR para devolver.");
    }
    return "por_cobrar";
  }
  if (accion === "entregado") {
    if (estado !== "pagado") {
      throw new AppError("Primero registra el pago. Después puedes marcarlo entregado.");
    }
    return "entregado";
  }
  if (estado !== "por_cobrar" && estado !== "pago_reportado") {
    throw new AppError("Un pedido pagado o entregado ya no se puede cancelar.");
  }
  return "cancelado";
}

function moverEstado(
  database: DatabaseHandle,
  subpedidoId: string,
  anterior: Estado,
  nuevo: Estado,
  usuarioId: string | null,
  actor: string,
) {
  const ahora = new Date().toISOString();
  const updated = database
    .prepare("UPDATE subpedidos SET estado = ?, updated_at = ? WHERE id = ? AND estado = ?")
    .run(nuevo, ahora, subpedidoId, anterior);
  if (updated.changes !== 1) {
    throw new AppError("Ese pedido ya cambió. Actualiza la lista.");
  }
  anotarEstado(database, subpedidoId, anterior, nuevo, usuarioId, actor);
  if (nuevo === "cancelado") {
    const items = database
      .prepare("SELECT producto_id, cantidad FROM subpedido_items WHERE subpedido_id = ?")
      .all(subpedidoId) as { producto_id: string; cantidad: number }[];
    for (const item of items) {
      database
        .prepare("UPDATE productos SET stock = stock + ? WHERE id = ?")
        .run(item.cantidad, item.producto_id);
    }
  }
}

export async function cambiarEstado(session: Session, subpedidoId: string, accion: Accion) {
  if (session.rol !== "emprendedor" || !session.emprendimientoId) {
    throw new AppError("Solo el equipo del emprendimiento puede cambiar este pedido.", 403);
  }
  const database = await ensureDb();
  const aplicar = database.transaction(() => {
    const sub = database
      .prepare("SELECT id, estado, metodo_pago, emprendimiento_id FROM subpedidos WHERE id = ?")
      .get(subpedidoId) as
      | { id: string; estado: Estado; metodo_pago: string; emprendimiento_id: string }
      | undefined;
    if (!sub || sub.emprendimiento_id !== session.emprendimientoId) {
      throw new AppError("No encontramos ese pedido en tu emprendimiento.", 404);
    }
    const nuevo = destino(sub.estado, sub.metodo_pago, accion);
    moverEstado(database, sub.id, sub.estado, nuevo, session.perfilId, session.email);
  });
  aplicar.immediate();
}

export async function comprobanteDeEquipo(
  session: Session,
  subpedidoId: string,
) {
  const database = await ensureDb();
  const row = database
    .prepare(
      "SELECT id, emprendimiento_id, comprobante_ext FROM subpedidos WHERE id = ?",
    )
    .get(subpedidoId) as
    | { id: string; emprendimiento_id: string; comprobante_ext: string | null }
    | undefined;
  if (!row?.comprobante_ext) return null;
  const permitido =
    session.rol === "admin" || session.emprendimientoId === row.emprendimiento_id;
  if (!permitido) return null;
  return { id: row.id, ext: row.comprobante_ext };
}

export async function comprobanteDeBoleta(codigo: string, subpedidoId: string) {
  const database = await ensureDb();
  const row = database
    .prepare(
      `SELECT s.id, s.comprobante_ext
       FROM subpedidos s JOIN pedidos p ON p.id = s.pedido_id
       WHERE s.id = ? AND p.codigo = ?`,
    )
    .get(subpedidoId, codigo) as { id: string; comprobante_ext: string | null } | undefined;
  if (!row?.comprobante_ext) return null;
  return { id: row.id, ext: row.comprobante_ext };
}

export async function ultimoPedidoId(emprendimientoId: string) {
  const database = await ensureDb();
  const row = database
    .prepare(
      `SELECT id FROM subpedidos WHERE emprendimiento_id = ?
       ORDER BY created_at DESC LIMIT 1`,
    )
    .get(emprendimientoId) as { id: string } | undefined;
  const conteo = database
    .prepare(
      `SELECT COUNT(*) AS n FROM subpedidos
       WHERE emprendimiento_id = ? AND estado != 'cancelado'`,
    )
    .get(emprendimientoId) as { n: number };
  return { ultimoId: row?.id ?? null, total: conteo.n };
}
