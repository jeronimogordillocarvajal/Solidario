import { randomUUID } from "node:crypto";
import type { Categoria } from "./constants";
import { CATEGORIAS, STOCK_BAJO } from "./constants";
import { ensureDb } from "./db";
import { AppError } from "./errors";
import { diaBogota, reservasAbiertas, ultimosDias } from "./format";
import type { EmprendimientoPublico, ProductoVista, Session } from "./types";
import { mediaUrl, writeUpload } from "./uploads";

type EmpRow = {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  logo_ext: string | null;
  color: string;
  stand: string;
  grado: string;
  meta_ventas: number;
  acepta_efectivo: number;
  acepta_qr: number;
  qr_ext: string | null;
  numero_cuenta: string;
  titular: string;
  banco: string;
  integrantes: string;
};

function integrantesDe(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function productoDe(row: {
  id: string;
  codigo: string;
  secuencia: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: Categoria;
  stock: number;
  visible: number;
  foto_ext: string | null;
  emprendimiento_id: string;
}): ProductoVista {
  return {
    id: row.id,
    codigo: row.codigo,
    secuencia: row.secuencia,
    nombre: row.nombre,
    descripcion: row.descripcion,
    precio: row.precio,
    categoria: row.categoria,
    stock: row.stock,
    visible: row.visible === 1,
    fotoUrl: row.foto_ext ? mediaUrl("productos", row.id) : null,
    emprendimientoId: row.emprendimiento_id,
  };
}

export async function obtenerConfig() {
  const database = await ensureDb();
  const row = database.prepare("SELECT * FROM configuracion WHERE id = 1").get() as {
    nombre_feria: string;
    color_principal: string;
    color_secundario: string;
    cierre_reservas: string;
  };
  return {
    nombre: row.nombre_feria,
    colorPrincipal: row.color_principal,
    colorSecundario: row.color_secundario,
    cierre: row.cierre_reservas,
    abiertas: reservasAbiertas(row.cierre_reservas),
  };
}

export async function fijarCierre(iso: string) {
  if (Number.isNaN(new Date(iso).getTime())) throw new AppError("La fecha de cierre no es válida.");
  const database = await ensureDb();
  database
    .prepare("UPDATE configuracion SET cierre_reservas = ?, updated_at = ? WHERE id = 1")
    .run(new Date(iso).toISOString(), new Date().toISOString());
}

export async function guardarConfiguracion(input: {
  nombre: string;
  colorPrincipal: string;
  colorSecundario: string;
  cierreLocal: string;
}) {
  const nombre = input.nombre.trim();
  if (nombre.length < 3 || nombre.length > 60) throw new AppError("El nombre de la feria es muy corto.");
  if (!/^#[0-9a-fA-F]{6}$/.test(input.colorPrincipal)) {
    throw new AppError("El color principal debe ser un hexadecimal, por ejemplo #0F6E56.");
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(input.colorSecundario)) {
    throw new AppError("El color secundario debe ser un hexadecimal, por ejemplo #E3A008.");
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input.cierreLocal)) {
    throw new AppError("La fecha de cierre no es válida.");
  }
  const cierre = new Date(`${input.cierreLocal}:00-05:00`);
  if (Number.isNaN(cierre.getTime())) throw new AppError("La fecha de cierre no es válida.");
  const database = await ensureDb();
  database
    .prepare(
      `UPDATE configuracion
       SET nombre_feria = ?, color_principal = ?, color_secundario = ?, cierre_reservas = ?, updated_at = ?
       WHERE id = 1`,
    )
    .run(
      nombre,
      input.colorPrincipal,
      input.colorSecundario,
      cierre.toISOString(),
      new Date().toISOString(),
    );
}

export async function listarVitrina() {
  const database = await ensureDb();
  const emps = database
    .prepare("SELECT * FROM emprendimientos ORDER BY codigo")
    .all() as EmpRow[];
  return emps.map((emp) => {
    const stats = database
      .prepare(
        `SELECT COUNT(*) AS n, MIN(precio) AS desde
         FROM productos WHERE emprendimiento_id = ? AND visible = 1`,
      )
      .get(emp.id) as { n: number; desde: number | null };
    return {
      id: emp.id,
      codigo: emp.codigo,
      nombre: emp.nombre,
      descripcion: emp.descripcion,
      color: emp.color,
      stand: emp.stand,
      grado: emp.grado,
      logoUrl: emp.logo_ext ? mediaUrl("logos", emp.id) : null,
      productos: stats.n,
      desde: stats.desde,
    };
  });
}

export async function obtenerVitrina(codigo: string): Promise<EmprendimientoPublico | null> {
  const database = await ensureDb();
  const emp = database.prepare("SELECT * FROM emprendimientos WHERE codigo = ?").get(codigo) as
    | EmpRow
    | undefined;
  if (!emp) return null;
  const productos = database
    .prepare(
      `SELECT * FROM productos WHERE emprendimiento_id = ? AND visible = 1 ORDER BY secuencia`,
    )
    .all(emp.id) as Parameters<typeof productoDe>[0][];
  return {
    id: emp.id,
    codigo: emp.codigo,
    nombre: emp.nombre,
    descripcion: emp.descripcion,
    color: emp.color,
    stand: emp.stand,
    grado: emp.grado,
    logoUrl: emp.logo_ext ? mediaUrl("logos", emp.id) : null,
    integrantes: integrantesDe(emp.integrantes),
    aceptaEfectivo: emp.acepta_efectivo === 1,
    aceptaQr: emp.acepta_qr === 1,
    tieneQr: Boolean(emp.qr_ext),
    productos: productos.map(productoDe),
  };
}

export async function cotizar(ids: string[]) {
  const database = await ensureDb();
  const config = await obtenerConfig();
  const unicos = [...new Set(ids)].slice(0, 40);
  const lineas = unicos.flatMap((id) => {
    const row = database
      .prepare(
        `SELECT p.id, p.nombre, p.precio, p.stock, p.codigo, p.visible,
                e.id AS emprendimiento_id, e.codigo AS emp_codigo, e.nombre AS emp_nombre,
                e.acepta_efectivo, e.acepta_qr, e.qr_ext
         FROM productos p JOIN emprendimientos e ON e.id = p.emprendimiento_id
         WHERE p.id = ?`,
      )
      .get(id) as
      | {
          id: string;
          nombre: string;
          precio: number;
          stock: number;
          codigo: string;
          visible: number;
          emprendimiento_id: string;
          emp_codigo: string;
          emp_nombre: string;
          acepta_efectivo: number;
          acepta_qr: number;
          qr_ext: string | null;
        }
      | undefined;
    if (!row || !row.visible) return [];
    return [
      {
        productoId: row.id,
        nombre: row.nombre,
        precio: row.precio,
        stock: row.stock,
        codigo: row.codigo,
        emprendimientoId: row.emprendimiento_id,
        emprendimientoCodigo: row.emp_codigo,
        emprendimientoNombre: row.emp_nombre,
        aceptaEfectivo: row.acepta_efectivo === 1,
        aceptaQr: row.acepta_qr === 1 && Boolean(row.qr_ext),
        ofreceQr: row.acepta_qr === 1,
        tieneQr: Boolean(row.qr_ext),
      },
    ];
  });
  return { abiertas: config.abiertas, lineas };
}

export async function resumen(emprendimientoId: string) {
  const database = await ensureDb();
  const emp = database.prepare("SELECT * FROM emprendimientos WHERE id = ?").get(emprendimientoId) as
    | EmpRow
    | undefined;
  if (!emp) throw new AppError("No encontramos el emprendimiento.", 404);
  const cifras = database
    .prepare(
      `SELECT
         SUM(CASE WHEN estado != 'cancelado' THEN 1 ELSE 0 END) AS pedidos,
         SUM(CASE WHEN estado != 'cancelado' THEN subtotal ELSE 0 END) AS vendido,
         SUM(CASE WHEN estado IN ('pagado', 'entregado') THEN subtotal ELSE 0 END) AS cobrado,
         SUM(CASE WHEN estado = 'por_cobrar' AND metodo_pago = 'efectivo' THEN subtotal ELSE 0 END) AS efectivo,
         SUM(CASE WHEN estado = 'pago_reportado' AND metodo_pago = 'qr' THEN 1 ELSE 0 END) AS qr
       FROM subpedidos WHERE emprendimiento_id = ?`,
    )
    .get(emprendimientoId) as {
    pedidos: number | null;
    vendido: number | null;
    cobrado: number | null;
    efectivo: number | null;
    qr: number | null;
  };
  const unidades = database
    .prepare(
      `SELECT COALESCE(SUM(i.cantidad), 0) AS n
       FROM subpedido_items i
       JOIN subpedidos s ON s.id = i.subpedido_id
       WHERE s.emprendimiento_id = ? AND s.estado != 'cancelado'`,
    )
    .get(emprendimientoId) as { n: number };
  const masVendido = database
    .prepare(
      `SELECT i.nombre AS nombre, SUM(i.cantidad) AS unidades
       FROM subpedido_items i
       JOIN subpedidos s ON s.id = i.subpedido_id
       WHERE s.emprendimiento_id = ? AND s.estado != 'cancelado'
       GROUP BY i.producto_id
       ORDER BY unidades DESC
       LIMIT 1`,
    )
    .get(emprendimientoId) as { nombre: string; unidades: number } | undefined;
  const pocoStock = database
    .prepare(
      `SELECT nombre, codigo, stock FROM productos
       WHERE emprendimiento_id = ? AND visible = 1 AND stock <= ?
       ORDER BY stock ASC, nombre ASC`,
    )
    .all(emprendimientoId, STOCK_BAJO) as { nombre: string; codigo: string; stock: number }[];
  const porDiaRows = database
    .prepare(
      `SELECT date(created_at, '-5 hours') AS dia, COUNT(*) AS pedidos
       FROM subpedidos
       WHERE emprendimiento_id = ? AND estado != 'cancelado'
       GROUP BY dia`,
    )
    .all(emprendimientoId) as { dia: string; pedidos: number }[];
  const mapa = new Map(porDiaRows.map((row) => [row.dia, row.pedidos]));
  const hoy = diaBogota();
  return {
    negocio: {
      id: emp.id,
      codigo: emp.codigo,
      nombre: emp.nombre,
      color: emp.color,
      stand: emp.stand,
      grado: emp.grado,
      logoUrl: emp.logo_ext ? mediaUrl("logos", emp.id) : null,
      meta: emp.meta_ventas,
    },
    pedidosRecibidos: cifras.pedidos ?? 0,
    unidadesVendidas: unidades.n,
    totalVendido: cifras.vendido ?? 0,
    cobrado: cifras.cobrado ?? 0,
    porCobrarEfectivo: cifras.efectivo ?? 0,
    porConfirmarQr: cifras.qr ?? 0,
    masVendido: masVendido ?? null,
    pocoStock,
    porDia: ultimosDias(8).map((dia) => ({
      dia,
      pedidos: mapa.get(dia) ?? 0,
      hoy: dia === hoy,
    })),
  };
}

export async function guardarMeta(session: Session, meta: number) {
  if (!session.emprendimientoId) throw new AppError("No tienes un emprendimiento.", 403);
  if (!Number.isInteger(meta) || meta < 0 || meta > 100_000_000) {
    throw new AppError("La meta debe ser un valor en pesos, sin centavos.");
  }
  const database = await ensureDb();
  database
    .prepare("UPDATE emprendimientos SET meta_ventas = ? WHERE id = ?")
    .run(meta, session.emprendimientoId);
}

export async function listarProductosEquipo(emprendimientoId: string) {
  const database = await ensureDb();
  const rows = database
    .prepare("SELECT * FROM productos WHERE emprendimiento_id = ? ORDER BY secuencia")
    .all(emprendimientoId) as Parameters<typeof productoDe>[0][];
  const emp = database
    .prepare("SELECT codigo, nombre, color FROM emprendimientos WHERE id = ?")
    .get(emprendimientoId) as { codigo: string; nombre: string; color: string };
  return { codigo: emp.codigo, nombre: emp.nombre, color: emp.color, productos: rows.map(productoDe) };
}

function validarProducto(input: {
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  stock: number;
}) {
  const nombre = input.nombre.trim().replace(/\s+/g, " ");
  const descripcion = input.descripcion.trim();
  if (nombre.length < 2 || nombre.length > 80) {
    throw new AppError("El nombre del producto debe tener entre 2 y 80 caracteres.");
  }
  if (descripcion.length > 400) throw new AppError("La descripción es muy larga.");
  if (!Number.isInteger(input.precio) || input.precio <= 0 || input.precio > 5_000_000) {
    throw new AppError("Escribe el precio en pesos, sin puntos ni centavos. Ejemplo: 4500.");
  }
  if (!CATEGORIAS.includes(input.categoria as Categoria)) {
    throw new AppError("Elige una categoría: comestibles, ropa, accesorios u otros.");
  }
  if (!Number.isInteger(input.stock) || input.stock < 0 || input.stock > 10000) {
    throw new AppError("El stock debe ser un número entre 0 y 10000.");
  }
  return {
    nombre,
    descripcion,
    precio: input.precio,
    categoria: input.categoria as Categoria,
    stock: input.stock,
  };
}

export async function guardarProducto(
  session: Session,
  input: {
    id?: string;
    nombre: string;
    descripcion: string;
    precio: number;
    categoria: string;
    stock: number;
    visible: boolean;
    foto?: { buffer: Buffer; ext: string } | null;
  },
) {
  if (!session.emprendimientoId) throw new AppError("No tienes un emprendimiento.", 403);
  const datos = validarProducto(input);
  const database = await ensureDb();
  const emp = database
    .prepare("SELECT id, codigo FROM emprendimientos WHERE id = ?")
    .get(session.emprendimientoId) as { id: string; codigo: string };
  if (input.id) {
    const actual = database
      .prepare("SELECT id, emprendimiento_id, codigo FROM productos WHERE id = ?")
      .get(input.id) as { id: string; emprendimiento_id: string; codigo: string } | undefined;
    if (!actual || actual.emprendimiento_id !== emp.id) {
      throw new AppError("No encontramos ese producto en tu emprendimiento.", 404);
    }
    database
      .prepare(
        `UPDATE productos
         SET nombre = ?, descripcion = ?, precio = ?, categoria = ?, stock = ?, visible = ?,
             foto_ext = COALESCE(?, foto_ext)
         WHERE id = ?`,
      )
      .run(
        datos.nombre,
        datos.descripcion,
        datos.precio,
        datos.categoria,
        datos.stock,
        input.visible ? 1 : 0,
        input.foto?.ext ?? null,
        actual.id,
      );
    if (input.foto) writeUpload("productos", actual.id, input.foto.ext, input.foto.buffer);
    return { id: actual.id, codigo: actual.codigo };
  }
  const secuencia = (
    database
      .prepare(
        "SELECT COALESCE(MAX(secuencia), 0) + 1 AS n FROM productos WHERE emprendimiento_id = ?",
      )
      .get(emp.id) as { n: number }
  ).n;
  const id = randomUUID();
  const codigo = `${emp.codigo}-${String(secuencia).padStart(2, "0")}`;
  database
    .prepare(
      `INSERT INTO productos
        (id, emprendimiento_id, codigo, secuencia, nombre, descripcion, precio, categoria, stock, foto_ext, visible, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      emp.id,
      codigo,
      secuencia,
      datos.nombre,
      datos.descripcion,
      datos.precio,
      datos.categoria,
      datos.stock,
      input.foto?.ext ?? null,
      input.visible ? 1 : 0,
      new Date().toISOString(),
    );
  if (input.foto) writeUpload("productos", id, input.foto.ext, input.foto.buffer);
  return { id, codigo };
}

export async function obtenerPagos(emprendimientoId: string) {
  const database = await ensureDb();
  const emp = database.prepare("SELECT * FROM emprendimientos WHERE id = ?").get(emprendimientoId) as EmpRow;
  return {
    aceptaEfectivo: emp.acepta_efectivo === 1,
    aceptaQr: emp.acepta_qr === 1,
    qrUrl: emp.qr_ext ? mediaUrl("qrs", emp.id) : null,
    numeroCuenta: emp.numero_cuenta,
    titular: emp.titular,
    banco: emp.banco,
    faltaQr: emp.acepta_qr === 1 && !emp.qr_ext,
  };
}

export async function guardarPagos(
  session: Session,
  input: {
    aceptaEfectivo: boolean;
    aceptaQr: boolean;
    numeroCuenta: string;
    titular: string;
    banco: string;
    qr?: { buffer: Buffer; ext: string } | null;
  },
) {
  if (!session.emprendimientoId) throw new AppError("No tienes un emprendimiento.", 403);
  if (!input.aceptaEfectivo && !input.aceptaQr) {
    throw new AppError("Elige al menos un método: efectivo, QR o ambos.");
  }
  if (!["Nequi", "Daviplata", "Bancolombia", ""].includes(input.banco)) {
    throw new AppError("Elige Nequi, Daviplata o Bancolombia.");
  }
  const cuenta = input.numeroCuenta.trim();
  const titular = input.titular.trim().replace(/\s+/g, " ");
  if (input.aceptaQr) {
    if (cuenta.length < 6 || cuenta.length > 20 || !/^[\d\s-]+$/.test(cuenta)) {
      throw new AppError("Escribe el número de cuenta o celular donde llega el QR.");
    }
    if (titular.length < 3 || titular.length > 80) {
      throw new AppError("Escribe el nombre del titular de la cuenta.");
    }
    if (!input.banco) throw new AppError("Elige si el QR es de Nequi, Daviplata o Bancolombia.");
  }
  const database = await ensureDb();
  database
    .prepare(
      `UPDATE emprendimientos
       SET acepta_efectivo = ?, acepta_qr = ?, numero_cuenta = ?, titular = ?, banco = ?,
           qr_ext = COALESCE(?, qr_ext)
       WHERE id = ?`,
    )
    .run(
      input.aceptaEfectivo ? 1 : 0,
      input.aceptaQr ? 1 : 0,
      cuenta,
      titular,
      input.banco,
      input.qr?.ext ?? null,
      session.emprendimientoId,
    );
  if (input.qr) writeUpload("qrs", session.emprendimientoId, input.qr.ext, input.qr.buffer);
}

export async function obtenerPerfilNegocio(emprendimientoId: string) {
  const database = await ensureDb();
  const emp = database.prepare("SELECT * FROM emprendimientos WHERE id = ?").get(emprendimientoId) as EmpRow;
  return {
    id: emp.id,
    codigo: emp.codigo,
    nombre: emp.nombre,
    descripcion: emp.descripcion,
    color: emp.color,
    stand: emp.stand,
    grado: emp.grado,
    logoUrl: emp.logo_ext ? mediaUrl("logos", emp.id) : null,
    integrantes: integrantesDe(emp.integrantes),
  };
}

export async function guardarPerfilNegocio(
  session: Session,
  input: {
    descripcion: string;
    color: string;
    integrantes: string[];
    logo?: { buffer: Buffer; ext: string } | null;
  },
) {
  if (!session.emprendimientoId) throw new AppError("No tienes un emprendimiento.", 403);
  const descripcion = input.descripcion.trim();
  if (descripcion.length > 500) throw new AppError("La descripción es muy larga.");
  if (!/^#[0-9a-fA-F]{6}$/.test(input.color)) {
    throw new AppError("Elige un color hexadecimal, por ejemplo #C2410C.");
  }
  const integrantes = input.integrantes
    .map((nombre) => nombre.trim().replace(/\s+/g, " "))
    .filter(Boolean);
  if (integrantes.length < 1 || integrantes.length > 12) {
    throw new AppError("Escribe entre 1 y 12 integrantes.");
  }
  if (integrantes.some((nombre) => nombre.length < 2 || nombre.length > 40)) {
    throw new AppError("Cada nombre debe tener entre 2 y 40 caracteres.");
  }
  const database = await ensureDb();
  database
    .prepare(
      `UPDATE emprendimientos
       SET descripcion = ?, color = ?, integrantes = ?, logo_ext = COALESCE(?, logo_ext)
       WHERE id = ?`,
    )
    .run(
      descripcion,
      input.color,
      JSON.stringify(integrantes),
      input.logo?.ext ?? null,
      session.emprendimientoId,
    );
  if (input.logo) writeUpload("logos", session.emprendimientoId, input.logo.ext, input.logo.buffer);
}

export async function archivoProducto(id: string, session: Session | null) {
  const database = await ensureDb();
  const row = database
    .prepare("SELECT id, foto_ext, visible, emprendimiento_id FROM productos WHERE id = ?")
    .get(id) as
    | { id: string; foto_ext: string | null; visible: number; emprendimiento_id: string }
    | undefined;
  if (!row?.foto_ext) return null;
  const puede =
    row.visible === 1 ||
    session?.rol === "admin" ||
    session?.emprendimientoId === row.emprendimiento_id;
  if (!puede) return null;
  return { id: row.id, ext: row.foto_ext };
}

export async function archivoEmprendimiento(kind: "logos" | "qrs", id: string) {
  const database = await ensureDb();
  const column = kind === "logos" ? "logo_ext" : "qr_ext";
  const row = database
    .prepare(`SELECT id, ${column} AS ext FROM emprendimientos WHERE id = ?`)
    .get(id) as { id: string; ext: string | null } | undefined;
  if (!row?.ext) return null;
  return { id: row.id, ext: row.ext };
}

export async function negociosConQr() {
  const database = await ensureDb();
  return database
    .prepare(
      `SELECT codigo, nombre, acepta_qr, qr_ext, numero_cuenta, titular, banco
       FROM emprendimientos ORDER BY codigo`,
    )
    .all() as {
    codigo: string;
    nombre: string;
    acepta_qr: number;
    qr_ext: string | null;
    numero_cuenta: string;
    titular: string;
    banco: string;
  }[];
}
