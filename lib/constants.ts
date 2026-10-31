export const COLOR_PRINCIPAL = "#0F6E56";
export const COLOR_SECUNDARIO = "#E3A008";

/** Medianoche que cierra el 19 de noviembre de 2026, hora de Bogotá (UTC-5). */
export const CIERRE_RESERVAS = "2026-11-20T00:00:00-05:00";

export const ESTADOS = [
  "por_cobrar",
  "pago_reportado",
  "pagado",
  "entregado",
  "cancelado",
] as const;

export type Estado = (typeof ESTADOS)[number];

export const ESTADO_LABEL: Record<Estado, string> = {
  por_cobrar: "Por cobrar",
  pago_reportado: "Pago reportado",
  pagado: "Pagado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export const CATEGORIAS = ["comestibles", "ropa", "accesorios", "otros"] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  comestibles: "Comestibles",
  ropa: "Ropa",
  accesorios: "Accesorios",
  otros: "Otros",
};

export const BANCOS = ["Nequi", "Daviplata", "Bancolombia"] as const;
export type Banco = (typeof BANCOS)[number];

export const DEMO = {
  admin: {
    email: "admin@feriago.edu.co",
    password: "FeriaAdmin2026",
    nombre: "Coordinación de feria",
  },
  equipos: [
    {
      codigo: "E01",
      email: "sazon@feriago.edu.co",
      password: "Sazon2026",
      nombre: "Mariana López",
    },
    {
      codigo: "E02",
      email: "hilo@feriago.edu.co",
      password: "Hilo2026",
      nombre: "Lucía Gómez",
    },
    {
      codigo: "E03",
      email: "broches@feriago.edu.co",
      password: "Broches2026",
      nombre: "Elena Vargas",
    },
  ],
} as const;

export const SESSION_COOKIE = "feria_session";
export const STOCK_BAJO = 5;
