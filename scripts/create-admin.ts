import { crearAdmin } from "../lib/auth";

const [email, nombre, password] = process.argv.slice(2);

if (!email || !nombre || !password) {
  console.error('Uso: npm run create-admin -- correo@colegio.edu.co "Nombre" "clave-segura"');
  process.exit(1);
}

await crearAdmin(email, nombre, password);
console.log(`Administrador creado: ${email}`);
