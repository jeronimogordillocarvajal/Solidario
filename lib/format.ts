import { CIERRE_RESERVAS } from "./constants";

export const ZONA = "America/Bogota";

export function cop(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function fechaHora(iso: string) {
  const texto = new Intl.DateTimeFormat("es-CO", {
    timeZone: ZONA,
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
  return texto.replace(/([ap])\.\s*m\./gi, "$1.m.");
}

export function diaBogota(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function diaCorto(ymd: string) {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function ultimosDias(n = 8, now = new Date()) {
  const [year, month, day] = diaBogota(now).split("-").map(Number);
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(Date.UTC(year, month - 1, day));
    date.setUTCDate(date.getUTCDate() - i);
    days.push(date.toISOString().slice(0, 10));
  }
  return days;
}

export function reservasAbiertas(cierreIso: string, now = new Date()) {
  return now.getTime() < new Date(cierreIso).getTime();
}

export function textoCierre() {
  return "19 de noviembre de 2026 a medianoche (hora de Bogotá)";
}

export function cierrePorDefecto() {
  return CIERRE_RESERVAS;
}

export function parsePesos(value: string) {
  const clean = value.trim().replace(/\s/g, "").replace(/\$/g, "").replace(/\./g, "");
  if (!/^\d+$/.test(clean)) return null;
  const amount = Number(clean);
  if (amount <= 0 || amount > 5_000_000) return null;
  return amount;
}

export function isoHaceDias(dias: number, horaBogota: number) {
  const [year, month, day] = diaBogota().split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, horaBogota + 5, 15, 0));
  date.setUTCDate(date.getUTCDate() - dias);
  return date.toISOString();
}
