import { SignJWT, jwtVerify } from "jose";
import { SESSION_COOKIE } from "./constants";
import type { Rol, Session } from "./types";

export { SESSION_COOKIE };

function key() {
  const secret =
    process.env.FERIA_SESSION_SECRET || "feria-go-local-demo-secret-key-32chars";
  return new TextEncoder().encode(secret);
}

export async function signSession(session: Session) {
  return new SignJWT({
    rol: session.rol,
    emp: session.emprendimientoId,
    email: session.email,
    nombre: session.nombre,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.perfilId)
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(key());
}

export async function readSessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, key());
    const rol = payload.rol;
    if (rol !== "admin" && rol !== "emprendedor") return null;
    if (!payload.sub || typeof payload.email !== "string") return null;
    return {
      perfilId: payload.sub,
      rol: rol as Rol,
      email: payload.email,
      nombre: typeof payload.nombre === "string" ? payload.nombre : "",
      emprendimientoId: typeof payload.emp === "string" ? payload.emp : null,
    };
  } catch {
    return null;
  }
}
