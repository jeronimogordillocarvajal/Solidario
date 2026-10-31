import { randomUUID } from "node:crypto";
import { hashSync } from "bcryptjs";
import { ensureDb } from "./db";
import { AppError } from "./errors";
import { fechaHora } from "./format";
import { listarTodos } from "./pedidos";
import { mediaUrl, writeUpload } from "./uploads";
import { logoSvg } from "./artwork";

export async function conteosAdmin() {
  const database = await ensureDb();
  const pedidos = database.prepare("SELECT COUNT(*) AS n FROM subpedidos").get() as { n: number };
  const qr = database
    .prepare(
      "SELECT COUNT(*) AS n FROM subpedidos WHERE estado = 'pago_reportado' AND metodo_pago = 'qr'",
    )
    .get() as { n: number };
  const abiertos = database
    .prepare("SELECT COUNT(*) AS n FROM soporte WHERE estado = 'abierto'")
    .get() as { n: number };
  const equipos = database.prepare("SELECT COUNT(*) AS n FROM emprendimientos").get() as { n: number };
  return { pedidos: pedidos.n, qr: qr.n, soporte: abiertos.n, equipos: equipos.n };
}

export async function listarSoporte() {
  const database = await ensureDb();
  return database
    .prepare("SELECT * FROM soporte ORDER BY created_at DESC")
    .all() as {
    id: string;
    nombre: string;
    correo: string;
    mensaje: string;
    estado: "abierto" | "resuelto";
    respuesta: string | null;
    created_at: string;
    resuelto_at: string | null;
  }[];
}

export async function crearSoporte(input: { nombre: string; correo: string; mensaje: string }) {
  const nombre = input.nombre.trim().replace(/\s+/g, " ");
  const correo = input.correo.trim().toLowerCase();
  const mensaje = input.mensaje.trim();
  if (nombre.length < 3 || nombre.length > 80) throw new AppError("Escribe tu nombre.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw new AppError("Escribe un correo válido.");
  if (mensaje.length < 10 || mensaje.length > 1000) {
    throw new AppError("Cuéntanos el problema en unas líneas (mínimo 10 caracteres).");
  }
  const database = await ensureDb();
  const id = randomUUID();
  database
    .prepare(
      `INSERT INTO soporte (id, nombre, correo, mensaje, estado, respuesta, created_at, resuelto_at)
       VALUES (?, ?, ?, ?, 'abierto', NULL, ?, NULL)`,
    )
    .run(id, nombre, correo, mensaje, new Date().toISOString());
  return id;
}

export async function resolverSoporte(id: string, respuesta: string) {
  const texto = respuesta.trim();
  if (texto.length < 2 || texto.length > 500) {
    throw new AppError("Escribe cómo quedó resuelta la solicitud.");
  }
  const database = await ensureDb();
  const updated = database
    .prepare(
      `UPDATE soporte SET estado = 'resuelto', respuesta = ?, resuelto_at = ?
       WHERE id = ? AND estado = 'abierto'`,
    )
    .run(texto, new Date().toISOString(), id);
  if (updated.changes !== 1) throw new AppError("Esa solicitud ya no está abierta.", 404);
}

export async function exportarExcel() {
  const pedidos = await listarTodos();
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Feria Go";
  const sheet = workbook.addWorksheet("Pedidos");
  sheet.columns = [
    { header: "Código", key: "codigo", width: 18 },
    { header: "Fecha", key: "fecha", width: 22 },
    { header: "Emprendimiento", key: "emprendimiento", width: 24 },
    { header: "Código emprendimiento", key: "emp", width: 16 },
    { header: "Acudiente", key: "acudiente", width: 24 },
    { header: "Estudiante", key: "estudiante", width: 24 },
    { header: "Curso", key: "curso", width: 12 },
    { header: "Productos", key: "productos", width: 42 },
    { header: "Subtotal", key: "subtotal", width: 14 },
    { header: "Método", key: "metodo", width: 12 },
    { header: "Estado", key: "estado", width: 18 },
    { header: "Comprobante", key: "comprobante", width: 16 },
  ];
  sheet.getRow(1).font = { bold: true };
  for (const pedido of pedidos) {
    sheet.addRow({
      codigo: pedido.codigo,
      fecha: fechaHora(pedido.createdAt),
      emprendimiento: pedido.emprendimientoNombre,
      emp: pedido.emprendimientoCodigo,
      acudiente: pedido.acudiente,
      estudiante: pedido.estudiante,
      curso: pedido.curso,
      productos: pedido.items.map((item) => `${item.nombre} x${item.cantidad}`).join(", "),
      subtotal: pedido.subtotal,
      metodo: pedido.metodo,
      estado: pedido.estado,
      comprobante: pedido.comprobanteNumero ?? "",
    });
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function listarEmprendimientosAdmin() {
  const database = await ensureDb();
  const rows = database
    .prepare(
      `SELECT e.*, p.email
       FROM emprendimientos e
       LEFT JOIN perfiles p ON p.emprendimiento_id = e.id AND p.rol = 'emprendedor'
       ORDER BY e.codigo`,
    )
    .all() as {
    id: string;
    codigo: string;
    nombre: string;
    grado: string;
    stand: string;
    acepta_qr: number;
    qr_ext: string | null;
    numero_cuenta: string;
    titular: string;
    email: string | null;
  }[];
  return rows.map((row) => ({
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    grado: row.grado,
    stand: row.stand,
    email: row.email,
    aceptaQr: row.acepta_qr === 1,
    tieneQr: Boolean(row.qr_ext),
    tieneCuenta: Boolean(row.numero_cuenta && row.titular),
    qrUrl: row.qr_ext ? mediaUrl("qrs", row.id) : null,
  }));
}

export async function crearEmprendimiento(input: {
  nombre: string;
  descripcion: string;
  grado: string;
  stand: string;
  color: string;
  email: string;
  password: string;
  responsable: string;
}) {
  const nombre = input.nombre.trim().replace(/\s+/g, " ");
  const descripcion = input.descripcion.trim();
  const grado = input.grado.trim();
  const stand = input.stand.trim();
  const email = input.email.trim().toLowerCase();
  const responsable = input.responsable.trim().replace(/\s+/g, " ");
  if (nombre.length < 3 || nombre.length > 60) throw new AppError("Escribe el nombre del emprendimiento.");
  if (descripcion.length > 500) throw new AppError("La descripción es muy larga.");
  if (!grado || !stand) throw new AppError("Faltan el grado y el stand.");
  if (!/^#[0-9a-fA-F]{6}$/.test(input.color)) throw new AppError("Elige un color hexadecimal.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError("El correo del equipo no es válido.");
  if (input.password.length < 8) throw new AppError("La contraseña del equipo debe tener al menos 8 caracteres.");
  if (responsable.length < 3) throw new AppError("Escribe el nombre de quien entra al panel.");

  const database = await ensureDb();
  const existe = database.prepare("SELECT id FROM perfiles WHERE email = ?").get(email);
  if (existe) throw new AppError("Ya existe un usuario con ese correo.");
  const codigos = database.prepare("SELECT codigo FROM emprendimientos").all() as { codigo: string }[];
  const maximo = codigos.reduce((max, row) => Math.max(max, Number(row.codigo.slice(1)) || 0), 0);
  const codigo = `E${String(maximo + 1).padStart(2, "0")}`;
  const id = randomUUID();
  const ahora = new Date().toISOString();
  const crear = database.transaction(() => {
    database
      .prepare(
        `INSERT INTO emprendimientos
          (id, codigo, nombre, descripcion, logo_ext, color, stand, grado, meta_ventas,
           acepta_efectivo, acepta_qr, qr_ext, numero_cuenta, titular, banco, integrantes, created_at)
         VALUES (?, ?, ?, ?, 'svg', ?, ?, ?, 0, 1, 0, NULL, '', '', '', ?, ?)`,
      )
      .run(id, codigo, nombre, descripcion, input.color, stand, grado, JSON.stringify([responsable]), ahora);
    database
      .prepare(
        `INSERT INTO perfiles (id, email, password_hash, nombre, rol, emprendimiento_id, created_at)
         VALUES (?, ?, ?, ?, 'emprendedor', ?, ?)`,
      )
      .run(randomUUID(), email, hashSync(input.password, 10), responsable, id, ahora);
  });
  crear();
  const iniciales = nombre
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
  writeUpload("logos", id, "svg", logoSvg(iniciales || "FG", input.color));
  return { id, codigo };
}
