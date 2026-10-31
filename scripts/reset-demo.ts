import fs from "node:fs";
import path from "node:path";

const dbPath = process.env.FERIA_DB_PATH || path.join(process.cwd(), "data", "feria.db");
const uploads = process.env.FERIA_UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");

for (const file of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
  if (fs.existsSync(file)) fs.unlinkSync(file);
}
fs.rmSync(uploads, { recursive: true, force: true });
console.log("Datos locales borrados. La próxima vez que abras la app se vuelven a crear los de demostración.");
