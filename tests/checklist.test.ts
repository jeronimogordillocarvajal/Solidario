import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { CIERRE_RESERVAS, DEMO } from "../lib/constants";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "feria-go-"));
process.env.FERIA_DB_PATH = path.join(dir, "feria.db");
process.env.FERIA_UPLOAD_DIR = path.join(dir, "uploads");
process.env.FERIA_SKIP_CONNECTION = "1";

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);

test("checklist de la feria antes del 13 de noviembre", async () => {
  const dbMod = await import("../lib/db");
  const pedidos = await import("../lib/pedidos");
  const catalogo = await import("../lib/catalogo");
  const admin = await import("../lib/admin");
  const auth = await import("../lib/auth");

  const database = await dbMod.ensureDb();
  const producto = (codigo: string) =>
    database.prepare("SELECT id, stock, emprendimiento_id, precio FROM productos WHERE codigo = ?").get(codigo) as {
      id: string;
      stock: number;
      emprendimiento_id: string;
      precio: number;
    };
  const emprendimiento = (codigo: string) =>
    database.prepare("SELECT id, qr_ext, numero_cuenta, titular, acepta_qr FROM emprendimientos WHERE codigo = ?").get(codigo) as {
      id: string;
      qr_ext: string;
      numero_cuenta: string;
      titular: string;
      acepta_qr: number;
    };

  const e01 = emprendimiento("E01");
  const e02 = emprendimiento("E02");
  const e03 = emprendimiento("E03");
  for (const emp of [e01, e02, e03]) {
    assert.equal(emp.acepta_qr, 1);
    assert.ok(emp.numero_cuenta);
    assert.ok(emp.titular);
    assert.ok(emp.qr_ext);
    assert.ok(fs.existsSync(path.join(dir, "uploads", "qrs", `${emp.id}.${emp.qr_ext}`)));
  }
  const qrE01 = fs.readFileSync(path.join(dir, "uploads", "qrs", `${e01.id}.${e01.qr_ext}`));
  const qrE02 = fs.readFileSync(path.join(dir, "uploads", "qrs", `${e02.id}.${e02.qr_ext}`));
  assert.notDeepEqual(qrE01, qrE02);

  const brownie = producto("E01-01");
  const camiseta = producto("E02-01");
  const collar = producto("E03-02");
  const stockAntes = {
    brownie: brownie.stock,
    camiseta: camiseta.stock,
    collar: collar.stock,
  };

  const reserva = await pedidos.crearReserva({
    acudiente: "Padre de prueba",
    estudiante: "Hija de prueba",
    curso: "6A",
    items: [
      { productoId: brownie.id, cantidad: 1 },
      { productoId: camiseta.id, cantidad: 1 },
      { productoId: collar.id, cantidad: 2 },
    ],
    pagos: [
      { emprendimientoId: e01.id, metodo: "efectivo" },
      { emprendimientoId: e02.id, metodo: "qr" },
      { emprendimientoId: e03.id, metodo: "efectivo" },
    ],
  });

  const boleta = await pedidos.obtenerBoleta(reserva.codigo);
  assert.ok(boleta);
  assert.equal(boleta.subpedidos.length, 3);
  const codigos = boleta.subpedidos.map((sub) => sub.codigo);
  assert.equal(new Set(codigos).size, 3);
  for (const codigo of codigos) {
    assert.match(codigo, /^FG-[A-Z2-9]{4}-E0[123]$/);
    assert.ok(codigo.startsWith(`${reserva.codigo}-`));
  }
  const subQr = boleta.subpedidos.find((sub) => sub.metodo === "qr");
  const subE03 = boleta.subpedidos.find((sub) => sub.emprendimientoCodigo === "E03");
  assert.ok(subQr);
  assert.equal(subQr.emprendimientoId, e02.id);
  assert.equal(subQr.qrUrl, `/api/media/qrs/${e02.id}`);
  assert.notEqual(subQr.qrUrl, `/api/media/qrs/${e01.id}`);
  assert.equal(producto("E01-01").stock, stockAntes.brownie - 1);
  assert.equal(producto("E02-01").stock, stockAntes.camiseta - 1);
  assert.equal(producto("E03-02").stock, stockAntes.collar - 2);

  await pedidos.reportarComprobante(reserva.codigo, subQr.id, "88421", jpeg);
  const hilo = await auth.autenticar(DEMO.equipos[1].email, DEMO.equipos[1].password);
  const sazon = await auth.autenticar(DEMO.equipos[0].email, DEMO.equipos[0].password);
  assert.ok(hilo && sazon);
  const vistosHilo = await pedidos.listarDelEmprendimiento(hilo.emprendimientoId!);
  const reportado = vistosHilo.find((sub) => sub.id === subQr.id);
  assert.equal(reportado?.estado, "pago_reportado");
  assert.equal(reportado?.comprobanteNumero, "88421");
  const vistosSazon = await pedidos.listarDelEmprendimiento(sazon.emprendimientoId!);
  assert.equal(vistosSazon.some((sub) => sub.id === subQr.id), false);
  await assert.rejects(() => pedidos.cambiarEstado(sazon, subQr.id, "confirmar_qr"), /emprendimiento/i);

  await pedidos.cambiarEstado(hilo, subQr.id, "confirmar_qr");
  const confirmado = (await pedidos.listarDelEmprendimiento(hilo.emprendimientoId!)).find((sub) => sub.id === subQr.id);
  assert.equal(confirmado?.estado, "pagado");
  const ultimo = confirmado?.historial.at(-1);
  assert.equal(ultimo?.estadoNuevo, "pagado");
  assert.equal(ultimo?.usuarioId, hilo.perfilId);
  assert.ok(ultimo?.createdAt);

  assert.ok(subE03);
  await pedidos.cancelarDesdeBoleta(reserva.codigo, subE03.id);
  assert.equal(producto("E03-02").stock, stockAntes.collar);

  const pin = producto("E03-04");
  const pinAntes = pin.stock;
  await assert.rejects(
    () =>
      pedidos.crearReserva({
        acudiente: "Otra familia",
        estudiante: "Otro estudiante",
        curso: "3A",
        items: [{ productoId: pin.id, cantidad: pinAntes + 1 }],
        pagos: [{ emprendimientoId: e03.id, metodo: "efectivo" }],
      }),
    /Solo quedan/,
  );
  assert.equal(producto("E03-04").stock, pinAntes);

  const limonada = producto("E01-02");
  const galleta = producto("E01-04");
  const limonadaAntes = limonada.stock;
  const galletaAntes = galleta.stock;
  await assert.rejects(
    () =>
      pedidos.crearReserva({
        acudiente: "Familia rollback",
        estudiante: "Nico rollback",
        curso: "2A",
        items: [
          { productoId: limonada.id, cantidad: 1 },
          { productoId: galleta.id, cantidad: galletaAntes + 3 },
        ],
        pagos: [{ emprendimientoId: e01.id, metodo: "efectivo" }],
      }),
    /Solo quedan/,
  );
  assert.equal(producto("E01-02").stock, limonadaAntes);
  assert.equal(producto("E01-04").stock, galletaAntes);

  const precioPedido = database
    .prepare("SELECT id, precio FROM subpedido_items WHERE subpedido_id = ? AND producto_id = ?")
    .get(subQr.id, camiseta.id) as { id: string; precio: number };
  assert.equal(precioPedido.precio, camiseta.precio);
  await catalogo.guardarProducto(hilo, {
    id: camiseta.id,
    nombre: "Camiseta de la feria",
    descripcion: "Precio nuevo solo para reservas futuras.",
    precio: camiseta.precio + 5000,
    categoria: "ropa",
    stock: producto("E02-01").stock,
    visible: true,
  });
  const precioDespues = database
    .prepare("SELECT precio FROM subpedido_items WHERE id = ?")
    .get(precioPedido.id) as { precio: number };
  assert.equal(precioDespues.precio, camiseta.precio);
  assert.throws(() => database.prepare("UPDATE subpedido_items SET precio = 1 WHERE id = ?").run(precioPedido.id));

  const nuevo = await catalogo.guardarProducto(hilo, {
    nombre: "Parche de prueba",
    descripcion: "Solo para la prueba.",
    precio: 9000,
    categoria: "ropa",
    stock: 4,
    visible: true,
  });
  assert.match(nuevo.codigo, /^E02-\d{2}$/);
  const editado = await catalogo.guardarProducto(hilo, {
    id: nuevo.id,
    nombre: "Parche editado",
    descripcion: "Sigue el mismo código.",
    precio: 9500,
    categoria: "ropa",
    stock: 4,
    visible: false,
  });
  assert.equal(editado.codigo, nuevo.codigo);
  await assert.rejects(
    () =>
      catalogo.guardarProducto(sazon, {
        id: nuevo.id,
        nombre: "No debería",
        descripcion: "",
        precio: 1000,
        categoria: "otros",
        stock: 1,
        visible: true,
      }),
    /emprendimiento/i,
  );

  const todos = await pedidos.listarTodos();
  assert.ok(todos.some((sub) => sub.codigo === subQr.codigo));
  assert.ok(todos.some((sub) => sub.emprendimientoCodigo === "E01"));
  assert.ok(todos.some((sub) => sub.emprendimientoCodigo === "E03"));
  const excel = await admin.exportarExcel();
  assert.equal(excel.subarray(0, 2).toString(), "PK");

  const soporteId = await admin.crearSoporte({
    nombre: "Familia de prueba",
    correo: "familia@example.com",
    mensaje: "No veo el QR del stand 7 en la boleta.",
  });
  await admin.resolverSoporte(soporteId, "Ya quedó visible el QR de Hilo & Tinta.");
  const soporte = (await admin.listarSoporte()).find((item) => item.id === soporteId);
  assert.equal(soporte?.estado, "resuelto");

  await catalogo.fijarCierre(new Date(Date.now() - 60_000).toISOString());
  await assert.rejects(
    () =>
      pedidos.crearReserva({
        acudiente: "Fuera de fecha",
        estudiante: "Tarde",
        curso: "1A",
        items: [{ productoId: producto("E01-02").id, cantidad: 1 }],
        pagos: [{ emprendimientoId: e01.id, metodo: "efectivo" }],
      }),
    /cerraron/i,
  );
  await catalogo.fijarCierre(CIERRE_RESERVAS);
  const config = await catalogo.obtenerConfig();
  assert.equal(config.abiertas, true);
});
