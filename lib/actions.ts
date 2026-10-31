"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  crearEmprendimiento,
  crearSoporte,
  resolverSoporte,
} from "./admin";
import { autenticar, borrarSesion, escribirSesion, requireAdmin, requireEmprendedor } from "./auth";
import {
  guardarConfiguracion,
  guardarMeta,
  guardarPagos,
  guardarPerfilNegocio,
  guardarProducto,
} from "./catalogo";
import { AppError } from "./errors";
import { archivoABuffer } from "./images";
import { parsePesos } from "./format";
import {
  cancelarDesdeBoleta,
  cambiarEstado,
  crearReserva,
  reportarComprobante,
} from "./pedidos";

function fallo(error: unknown): { error: string } {
  if (error instanceof AppError) return { error: error.message };
  throw error;
}

function refrescar() {
  revalidatePath("/", "layout");
}

export async function ingresar(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const session = await autenticar(
    String(formData.get("email") ?? ""),
    String(formData.get("password") ?? ""),
  );
  if (!session) return { error: "Correo o contraseña incorrectos." };
  await escribirSesion(session);
  const next = String(formData.get("next") ?? "");
  if (session.rol === "admin") redirect(next.startsWith("/admin") ? next : "/admin");
  redirect(next.startsWith("/emprendedor") ? next : "/emprendedor");
}

export async function salir() {
  await borrarSesion();
  redirect("/ingreso");
}

export async function reservar(input: {
  acudiente: string;
  estudiante: string;
  curso: string;
  items: { productoId: string; cantidad: number }[];
  pagos: { emprendimientoId: string; metodo: "efectivo" | "qr" }[];
}) {
  try {
    const resultado = await crearReserva(input);
    refrescar();
    redirect(`/boleta/${resultado.codigo}?nueva=1`);
  } catch (error) {
    return fallo(error);
  }
}

export async function reportarPago(formData: FormData) {
  try {
    const foto = await archivoABuffer(formData.get("foto"));
    if (!foto) throw new AppError("Adjunta la captura del comprobante.");
    await reportarComprobante(
      String(formData.get("codigo") ?? ""),
      String(formData.get("subpedidoId") ?? ""),
      String(formData.get("numero") ?? ""),
      foto.buffer,
    );
    refrescar();
  } catch (error) {
    return fallo(error);
  }
}

export async function cancelarBoleta(formData: FormData) {
  try {
    await cancelarDesdeBoleta(
      String(formData.get("codigo") ?? ""),
      String(formData.get("subpedidoId") ?? ""),
    );
    refrescar();
  } catch (error) {
    return fallo(error);
  }
}

const ACCIONES = ["recibi_efectivo", "confirmar_qr", "rechazar_qr", "entregado", "cancelar"] as const;

export async function cambiarEstadoPedido(formData: FormData) {
  try {
    const session = await requireEmprendedor();
    const accion = String(formData.get("accion") ?? "");
    if (!ACCIONES.includes(accion as (typeof ACCIONES)[number])) {
      throw new AppError("Esa acción no existe.");
    }
    await cambiarEstado(session, String(formData.get("id") ?? ""), accion as (typeof ACCIONES)[number]);
    refrescar();
  } catch (error) {
    return fallo(error);
  }
}

export async function actualizarMeta(formData: FormData) {
  try {
    const session = await requireEmprendedor();
    const texto = String(formData.get("meta") ?? "").replace(/\./g, "").trim();
    if (!/^\d+$/.test(texto)) throw new AppError("Escribe la meta en pesos, sin puntos.");
    await guardarMeta(session, Number(texto));
    refrescar();
  } catch (error) {
    return fallo(error);
  }
}

export async function guardarProductoAccion(formData: FormData) {
  try {
    const session = await requireEmprendedor();
    const precio = parsePesos(String(formData.get("precio") ?? ""));
    if (!precio) throw new AppError("Escribe el precio en pesos, sin puntos. Ejemplo: 4500.");
    const stockTexto = String(formData.get("stock") ?? "").trim();
    if (!/^\d+$/.test(stockTexto)) throw new AppError("El stock debe ser un número.");
    const foto = await archivoABuffer(formData.get("foto"));
    const id = String(formData.get("id") ?? "");
    await guardarProducto(session, {
      id: id || undefined,
      nombre: String(formData.get("nombre") ?? ""),
      descripcion: String(formData.get("descripcion") ?? ""),
      precio,
      categoria: String(formData.get("categoria") ?? ""),
      stock: Number(stockTexto),
      visible: formData.get("visible") !== "0",
      foto,
    });
    refrescar();
  } catch (error) {
    return fallo(error);
  }
}

export async function guardarPagosAccion(formData: FormData) {
  try {
    const session = await requireEmprendedor();
    const qr = await archivoABuffer(formData.get("qr"));
    await guardarPagos(session, {
      aceptaEfectivo: formData.get("efectivo") === "1",
      aceptaQr: formData.get("qr_metodo") === "1",
      numeroCuenta: String(formData.get("cuenta") ?? ""),
      titular: String(formData.get("titular") ?? ""),
      banco: String(formData.get("banco") ?? ""),
      qr,
    });
    refrescar();
  } catch (error) {
    return fallo(error);
  }
}

export async function guardarPerfilAccion(formData: FormData) {
  try {
    const session = await requireEmprendedor();
    const logo = await archivoABuffer(formData.get("logo"));
    await guardarPerfilNegocio(session, {
      descripcion: String(formData.get("descripcion") ?? ""),
      color: String(formData.get("color") ?? ""),
      integrantes: formData.getAll("integrante").map((item) => String(item)),
      logo,
    });
    refrescar();
  } catch (error) {
    return fallo(error);
  }
}

export async function crearEmprendimientoAccion(formData: FormData) {
  try {
    await requireAdmin();
    await crearEmprendimiento({
      nombre: String(formData.get("nombre") ?? ""),
      descripcion: String(formData.get("descripcion") ?? ""),
      grado: String(formData.get("grado") ?? ""),
      stand: String(formData.get("stand") ?? ""),
      color: String(formData.get("color") ?? "#0F6E56"),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      responsable: String(formData.get("responsable") ?? ""),
    });
    refrescar();
  } catch (error) {
    return fallo(error);
  }
}

export async function guardarConfigAccion(formData: FormData) {
  try {
    await requireAdmin();
    await guardarConfiguracion({
      nombre: String(formData.get("nombre") ?? ""),
      colorPrincipal: String(formData.get("colorPrincipal") ?? ""),
      colorSecundario: String(formData.get("colorSecundario") ?? ""),
      cierreLocal: String(formData.get("cierre") ?? ""),
    });
    refrescar();
  } catch (error) {
    return fallo(error);
  }
}

export async function enviarSoporte(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  try {
    await crearSoporte({
      nombre: String(formData.get("nombre") ?? ""),
      correo: String(formData.get("correo") ?? ""),
      mensaje: String(formData.get("mensaje") ?? ""),
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    throw error;
  }
}

export async function resolverSoporteAccion(formData: FormData) {
  try {
    await requireAdmin();
    await resolverSoporte(String(formData.get("id") ?? ""), String(formData.get("respuesta") ?? ""));
    refrescar();
  } catch (error) {
    return fallo(error);
  }
}
