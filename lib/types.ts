import type { Categoria, Estado } from "./constants";

export type Rol = "admin" | "emprendedor";

export type Session = {
  perfilId: string;
  email: string;
  nombre: string;
  rol: Rol;
  emprendimientoId: string | null;
};

export type ItemPedido = {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
};

export type HistorialEntry = {
  id: string;
  estadoAnterior: string | null;
  estadoNuevo: Estado;
  actor: string;
  usuarioId: string | null;
  createdAt: string;
};

export type BoletaSubpedido = SubpedidoVista & {
  banco: string;
  numeroCuenta: string;
  titular: string;
  qrUrl: string | null;
  stand: string;
  grado: string;
  color: string;
};

export type SubpedidoVista = {
  id: string;
  codigo: string;
  pedidoCodigo: string;
  createdAt: string;
  acudiente: string;
  estudiante: string;
  curso: string;
  metodo: "efectivo" | "qr";
  estado: Estado;
  subtotal: number;
  comprobanteNumero: string | null;
  comprobanteUrl: string | null;
  emprendimientoId: string;
  emprendimientoCodigo: string;
  emprendimientoNombre: string;
  items: ItemPedido[];
  historial: HistorialEntry[];
};

export type ProductoVista = {
  id: string;
  codigo: string;
  secuencia: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: Categoria;
  stock: number;
  visible: boolean;
  fotoUrl: string | null;
  emprendimientoId: string;
};

export type EmprendimientoPublico = {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  color: string;
  stand: string;
  grado: string;
  logoUrl: string | null;
  integrantes: string[];
  aceptaEfectivo: boolean;
  aceptaQr: boolean;
  tieneQr: boolean;
  productos: ProductoVista[];
};
