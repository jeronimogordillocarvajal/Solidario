import { cookies } from "next/headers";
import { compareSync, hashSync } from "bcryptjs";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "./constants";
import { ensureDb } from "./db";
import { AppError } from "./errors";
import { readSessionToken, signSession } from "./jwt";
import type { Session } from "./types";

type PerfilRow = {
  id: string;
  email: string;
  password_hash: string;
  nombre: string;
  rol: "admin" | "emprendedor";
  emprendimiento_id: string | null;
};

function aSesion(row: PerfilRow): Session {
  return {
    perfilId: row.id,
    email: row.email,
    nombre: row.nombre,
    rol: row.rol,
    emprendimientoId: row.emprendimiento_id,
  };
}

export async function autenticar(email: string, password: string) {
  const database = await ensureDb();
  const row = database
    .prepare("SELECT * FROM perfiles WHERE email = ?")
    .get(email.trim().toLowerCase()) as PerfilRow | undefined;
  if (!row || !compareSync(password, row.password_hash)) return null;
  return aSesion(row);
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const tokenSession = await readSessionToken(token);
  if (!tokenSession) return null;
  const database = await ensureDb();
  const row = database
    .prepare("SELECT * FROM perfiles WHERE id = ?")
    .get(tokenSession.perfilId) as PerfilRow | undefined;
  if (!row) return null;
  return aSesion(row);
}

export async function escribirSesion(session: Session) {
  const token = await signSession(session);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function borrarSesion() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function requireEmprendedor() {
  const session = await getSession();
  if (!session || session.rol !== "emprendedor" || !session.emprendimientoId) {
    redirect("/ingreso");
  }
  return session as Session & { emprendimientoId: string };
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.rol !== "admin") redirect("/ingreso");
  return session;
}

export async function crearAdmin(email: string, nombre: string, password: string) {
  const limpio = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio)) {
    throw new AppError("Escribe un correo válido.");
  }
  if (nombre.trim().length < 3) throw new AppError("Escribe el nombre de quien administra.");
  if (password.length < 8) {
    throw new AppError("La contraseña debe tener al menos 8 caracteres.");
  }
  const database = await ensureDb();
  const exists = database.prepare("SELECT id FROM perfiles WHERE email = ?").get(limpio);
  if (exists) throw new AppError("Ya existe un usuario con ese correo.");
  database
    .prepare(
      `INSERT INTO perfiles (id, email, password_hash, nombre, rol, emprendimiento_id, created_at)
       VALUES (?, ?, ?, ?, 'admin', NULL, ?)`,
    )
    .run(randomUUID(), limpio, hashSync(password, 10), nombre.trim(), new Date().toISOString());
}
