import fs from "node:fs";
import path from "node:path";

export function uploadRoot() {
  return process.env.FERIA_UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");
}

const ID_RE = /^[0-9a-f-]{36}$/i;

export type MediaKind = "logos" | "productos" | "qrs" | "comprobantes";

export function writeUpload(
  kind: MediaKind,
  id: string,
  ext: string,
  data: Buffer | string,
) {
  if (!ID_RE.test(id)) throw new Error("Identificador inválido.");
  if (!/^[a-z0-9]+$/.test(ext)) throw new Error("Extensión inválida.");
  const dir = path.join(uploadRoot(), kind);
  fs.mkdirSync(dir, { recursive: true });
  for (const old of ["jpg", "png", "webp", "svg"]) {
    if (old === ext) continue;
    const previous = path.join(dir, `${id}.${old}`);
    if (fs.existsSync(previous)) fs.unlinkSync(previous);
  }
  fs.writeFileSync(path.join(dir, `${id}.${ext}`), data);
}

export function readUpload(kind: MediaKind, id: string, ext: string) {
  if (!ID_RE.test(id) || !/^[a-z0-9]+$/.test(ext)) return null;
  const file = path.join(uploadRoot(), kind, `${id}.${ext}`);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file);
}

export function mediaUrl(kind: MediaKind, id: string) {
  return `/api/media/${kind}/${id}`;
}

export function contentType(ext: string) {
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "svg") return "image/svg+xml";
  return "image/jpeg";
}
