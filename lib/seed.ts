import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { hashSync } from "bcryptjs";
import QRCode from "qrcode";
import {
  CIERRE_RESERVAS,
  COLOR_PRINCIPAL,
  COLOR_SECUNDARIO,
  DEMO,
} from "./constants";
import { comprobanteSvg, logoSvg, productoSvg } from "./artwork";
import { cop, isoHaceDias } from "./format";
import { writeUpload } from "./uploads";

type DatabaseHandle = Database.Database;

type ProductoSeed = {
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: "comestibles" | "ropa" | "accesorios" | "otros";
  stock: number;
  detalle: string;
};

type EquipoSeed = {
  codigo: string;
  nombre: string;
  descripcion: string;
  color: string;
  iniciales: string;
  stand: string;
  grado: string;
  meta: number;
  banco: string;
  cuenta: string;
  titular: string;
  integrantes: string[];
  productos: ProductoSeed[];
};

const EQUIPOS: EquipoSeed[] = [
  {
    codigo: "E01",
    nombre: "Sazón del Recreo",
    descripcion:
      "Postres y bebidas para el recreo, hechos en casa por el equipo de 10°A.",
    color: "#C2410C",
    iniciales: "SR",
    stand: "12",
    grado: "10°A",
    meta: 250000,
    banco: "Nequi",
    cuenta: "3001234567",
    titular: "Mariana López",
    integrantes: ["Mariana López", "Tomás Herrera", "Sara Díaz"],
    productos: [
      {
        nombre: "Brownie de arequipe",
        descripcion: "Porción generosa con arequipe casero.",
        precio: 4500,
        categoria: "comestibles",
        stock: 20,
        detalle: "BR",
      },
      {
        nombre: "Limonada de coco",
        descripcion: "Vaso frío, recién hecha en el stand.",
        precio: 3500,
        categoria: "comestibles",
        stock: 30,
        detalle: "LC",
      },
      {
        nombre: "Paleta de maracuyá",
        descripcion: "Paleta cremosa, una sola por pedido si se agota.",
        precio: 3000,
        categoria: "comestibles",
        stock: 15,
        detalle: "PM",
      },
      {
        nombre: "Galletas de avena",
        descripcion: "Paquete de cuatro galletas.",
        precio: 2500,
        categoria: "comestibles",
        stock: 4,
        detalle: "GA",
      },
    ],
  },
  {
    codigo: "E02",
    nombre: "Hilo & Tinta",
    descripcion: "Ropa y bolsos estampados a mano por 11°B.",
    color: "#1D4E89",
    iniciales: "HT",
    stand: "7",
    grado: "11°B",
    meta: 400000,
    banco: "Daviplata",
    cuenta: "3109876543",
    titular: "Lucía Gómez",
    integrantes: ["Lucía Gómez", "Mateo Ramírez", "Valentina Cruz"],
    productos: [
      {
        nombre: "Camiseta de la feria",
        descripcion: "Algodón, estampado del equipo. Talla única juvenil.",
        precio: 35000,
        categoria: "ropa",
        stock: 10,
        detalle: "CA",
      },
      {
        nombre: "Tote bordado",
        descripcion: "Bolsa de tela con bordado a mano.",
        precio: 28000,
        categoria: "ropa",
        stock: 8,
        detalle: "TO",
      },
      {
        nombre: "Gorra",
        descripcion: "Gorra bordada, ajustable.",
        precio: 22000,
        categoria: "ropa",
        stock: 3,
        detalle: "GO",
      },
      {
        nombre: "Par de medias",
        descripcion: "Medias de algodón con el logo del equipo.",
        precio: 12000,
        categoria: "ropa",
        stock: 14,
        detalle: "ME",
      },
    ],
  },
  {
    codigo: "E03",
    nombre: "Broches Luna",
    descripcion: "Accesorios pequeños para el pelo y la chaqueta, de 9°C.",
    color: "#7C3AED",
    iniciales: "BL",
    stand: "4",
    grado: "9°C",
    meta: 180000,
    banco: "Bancolombia",
    cuenta: "91234567890",
    titular: "Elena Vargas",
    integrantes: ["Elena Vargas", "Juan Pablo Mora", "Sofía Castro"],
    productos: [
      {
        nombre: "Set de 3 broches",
        descripcion: "Tres broches surtidos, listos para regalar.",
        precio: 8000,
        categoria: "accesorios",
        stock: 18,
        detalle: "SB",
      },
      {
        nombre: "Collar de mostacilla",
        descripcion: "Collar tejido a mano, pieza única de color.",
        precio: 15000,
        categoria: "accesorios",
        stock: 12,
        detalle: "CO",
      },
      {
        nombre: "Pulsera tejida",
        descripcion: "Pulsera ajustable de hilo.",
        precio: 7000,
        categoria: "accesorios",
        stock: 9,
        detalle: "PU",
      },
      {
        nombre: "Pin esmaltado",
        descripcion: "Pin pequeño para el saco o el morral.",
        precio: 6000,
        categoria: "accesorios",
        stock: 2,
        detalle: "PI",
      },
    ],
  },
];

function insertHistorial(
  database: DatabaseHandle,
  subpedidoId: string,
  anterior: string | null,
  nuevo: string,
  usuarioId: string | null,
  actor: string,
  createdAt: string,
) {
  database
    .prepare(
      `INSERT INTO historial_estados
        (id, subpedido_id, estado_anterior, estado_nuevo, usuario_id, actor, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(randomUUID(), subpedidoId, anterior, nuevo, usuarioId, actor, createdAt);
}

export async function seedIfEmpty(database: DatabaseHandle) {
  const row = database.prepare("SELECT COUNT(*) AS n FROM emprendimientos").get() as {
    n: number;
  };
  if (row.n > 0) return;

  const now = new Date().toISOString();
  database
    .prepare(
      `INSERT INTO configuracion
        (id, nombre_feria, color_principal, color_secundario, cierre_reservas, updated_at)
       VALUES (1, ?, ?, ?, ?, ?)`,
    )
    .run("Feria Go", COLOR_PRINCIPAL, COLOR_SECUNDARIO, CIERRE_RESERVAS, now);

  const empIds = new Map<string, string>();
  const productIds = new Map<string, { id: string; precio: number; nombre: string }>();
  const perfilIds = new Map<string, string>();

  const insertEmp = database.prepare(
    `INSERT INTO emprendimientos
      (id, codigo, nombre, descripcion, logo_ext, color, stand, grado, meta_ventas,
       acepta_efectivo, acepta_qr, qr_ext, numero_cuenta, titular, banco, integrantes, created_at)
     VALUES (?, ?, ?, ?, 'svg', ?, ?, ?, ?, 1, 1, 'svg', ?, ?, ?, ?, ?)`,
  );
  const insertPerfil = database.prepare(
    `INSERT INTO perfiles
      (id, email, password_hash, nombre, rol, emprendimiento_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertProducto = database.prepare(
    `INSERT INTO productos
      (id, emprendimiento_id, codigo, secuencia, nombre, descripcion, precio, categoria, stock, foto_ext, visible, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'svg', 1, ?)`,
  );

  for (const equipo of EQUIPOS) {
    const id = randomUUID();
    empIds.set(equipo.codigo, id);
    insertEmp.run(
      id,
      equipo.codigo,
      equipo.nombre,
      equipo.descripcion,
      equipo.color,
      equipo.stand,
      equipo.grado,
      equipo.meta,
      equipo.cuenta,
      equipo.titular,
      equipo.banco,
      JSON.stringify(equipo.integrantes),
      now,
    );
    writeUpload("logos", id, "svg", logoSvg(equipo.iniciales, equipo.color));
    const qr = await QRCode.toString(
      `Feria Go\n${equipo.nombre}\n${equipo.banco}\n${equipo.cuenta}\n${equipo.titular}`,
      { type: "svg", margin: 1, width: 320, color: { dark: "#1c1915", light: "#ffffff" } },
    );
    writeUpload("qrs", id, "svg", qr);

    const cuenta = DEMO.equipos.find((item) => item.codigo === equipo.codigo)!;
    const perfilId = randomUUID();
    perfilIds.set(equipo.codigo, perfilId);
    insertPerfil.run(
      perfilId,
      cuenta.email,
      hashSync(cuenta.password, 10),
      cuenta.nombre,
      "emprendedor",
      id,
      now,
    );

    equipo.productos.forEach((producto, index) => {
      const productoId = randomUUID();
      const secuencia = index + 1;
      const codigo = `${equipo.codigo}-${String(secuencia).padStart(2, "0")}`;
      productIds.set(codigo, {
        id: productoId,
        precio: producto.precio,
        nombre: producto.nombre,
      });
      insertProducto.run(
        productoId,
        id,
        codigo,
        secuencia,
        producto.nombre,
        producto.descripcion,
        producto.precio,
        producto.categoria,
        producto.stock,
        now,
      );
      writeUpload(
        "productos",
        productoId,
        "svg",
        productoSvg(producto.nombre, equipo.color, producto.detalle),
      );
    });
  }

  insertPerfil.run(
    randomUUID(),
    DEMO.admin.email,
    hashSync(DEMO.admin.password, 10),
    DEMO.admin.nombre,
    "admin",
    null,
    now,
  );

  const insertPedido = database.prepare(
    `INSERT INTO pedidos (id, codigo, acudiente, estudiante, curso, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const insertSub = database.prepare(
    `INSERT INTO subpedidos
      (id, pedido_id, emprendimiento_id, codigo, metodo_pago, estado, subtotal,
       comprobante_numero, comprobante_ext, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertItem = database.prepare(
    `INSERT INTO subpedido_items (id, subpedido_id, producto_id, nombre, precio, cantidad)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );

  function crearPedido(input: {
    codigo: string;
    acudiente: string;
    estudiante: string;
    curso: string;
    createdAt: string;
    partes: Array<{
      emp: string;
      metodo: "efectivo" | "qr";
      estado: "por_cobrar" | "pago_reportado" | "pagado";
      lineas: Array<{ codigo: string; cantidad: number }>;
      comprobante?: string;
      reportadoEn?: string;
      pagadoEn?: string;
    }>;
  }) {
    const pedidoId = randomUUID();
    insertPedido.run(
      pedidoId,
      input.codigo,
      input.acudiente,
      input.estudiante,
      input.curso,
      input.createdAt,
    );
    for (const parte of input.partes) {
      const subId = randomUUID();
      const empId = empIds.get(parte.emp)!;
      let subtotal = 0;
      const lineas = parte.lineas.map((linea) => {
        const producto = productIds.get(linea.codigo)!;
        subtotal += producto.precio * linea.cantidad;
        return { ...linea, producto };
      });
      const tieneComprobante = Boolean(parte.comprobante);
      insertSub.run(
        subId,
        pedidoId,
        empId,
        `${input.codigo}-${parte.emp}`,
        parte.metodo,
        parte.estado,
        subtotal,
        parte.comprobante ?? null,
        tieneComprobante ? "svg" : null,
        input.createdAt,
        parte.pagadoEn ?? parte.reportadoEn ?? input.createdAt,
      );
      for (const linea of lineas) {
        insertItem.run(
          randomUUID(),
          subId,
          linea.producto.id,
          linea.producto.nombre,
          linea.producto.precio,
          linea.cantidad,
        );
      }
      insertHistorial(
        database,
        subId,
        null,
        "por_cobrar",
        null,
        "acudiente",
        input.createdAt,
      );
      if (parte.estado === "pago_reportado" && parte.reportadoEn) {
        insertHistorial(
          database,
          subId,
          "por_cobrar",
          "pago_reportado",
          null,
          "acudiente",
          parte.reportadoEn,
        );
      }
      if (parte.estado === "pagado" && parte.pagadoEn) {
        const actorId = perfilIds.get(parte.emp)!;
        const email = DEMO.equipos.find((item) => item.codigo === parte.emp)!.email;
        if (parte.metodo === "qr") {
          insertHistorial(
            database,
            subId,
            "por_cobrar",
            "pago_reportado",
            null,
            "acudiente",
            parte.reportadoEn ?? input.createdAt,
          );
          insertHistorial(
            database,
            subId,
            "pago_reportado",
            "pagado",
            actorId,
            email,
            parte.pagadoEn,
          );
        } else {
          insertHistorial(
            database,
            subId,
            "por_cobrar",
            "pagado",
            actorId,
            email,
            parte.pagadoEn,
          );
        }
      }
      if (parte.comprobante) {
        const negocio = EQUIPOS.find((item) => item.codigo === parte.emp)!.nombre;
        writeUpload(
          "comprobantes",
          subId,
          "svg",
          comprobanteSvg(parte.comprobante, cop(subtotal), negocio),
        );
      }
    }
  }

  const haceDos = isoHaceDias(2, 10);
  const ayer = isoHaceDias(1, 16);
  const hoy = isoHaceDias(0, 9);
  const hoyTarde = isoHaceDias(0, 11);

  crearPedido({
    codigo: "FG-4H8M",
    acudiente: "Carmen Rojas",
    estudiante: "Emilio Rojas",
    curso: "5°B",
    createdAt: haceDos,
    partes: [
      {
        emp: "E01",
        metodo: "efectivo",
        estado: "pagado",
        pagadoEn: isoHaceDias(2, 12),
        lineas: [
          { codigo: "E01-01", cantidad: 4 },
          { codigo: "E01-02", cantidad: 2 },
        ],
      },
      {
        emp: "E02",
        metodo: "efectivo",
        estado: "pagado",
        pagadoEn: isoHaceDias(2, 12),
        lineas: [{ codigo: "E02-02", cantidad: 1 }],
      },
    ],
  });

  crearPedido({
    codigo: "FG-9Q2L",
    acudiente: "Patricia Nieto",
    estudiante: "Luna Nieto",
    curso: "7°A",
    createdAt: ayer,
    partes: [
      {
        emp: "E01",
        metodo: "qr",
        estado: "pagado",
        reportadoEn: isoHaceDias(1, 16),
        pagadoEn: isoHaceDias(1, 18),
        lineas: [{ codigo: "E01-03", cantidad: 3 }],
        comprobante: "77102",
      },
      {
        emp: "E02",
        metodo: "qr",
        estado: "por_cobrar",
        lineas: [{ codigo: "E02-03", cantidad: 1 }],
      },
    ],
  });

  crearPedido({
    codigo: "FG-K3NP",
    acudiente: "Helena Duarte",
    estudiante: "Simón Duarte",
    curso: "9°C",
    createdAt: hoy,
    partes: [
      {
        emp: "E03",
        metodo: "qr",
        estado: "pago_reportado",
        reportadoEn: hoy,
        lineas: [{ codigo: "E03-01", cantidad: 2 }],
        comprobante: "88421",
      },
    ],
  });

  crearPedido({
    codigo: "FG-P7TD",
    acudiente: "Gloria Mesa",
    estudiante: "Antonia Mesa",
    curso: "4°A",
    createdAt: hoyTarde,
    partes: [
      {
        emp: "E01",
        metodo: "efectivo",
        estado: "por_cobrar",
        lineas: [{ codigo: "E01-04", cantidad: 2 }],
      },
    ],
  });
}
