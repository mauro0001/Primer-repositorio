// Ejecuta manualmente la revision de recordatorios/escalamientos: npm run check-vencimientos
// Util para probar en local sin esperar al cron, o como tarea programada (cron de Linux,
// Task Scheduler de Windows, etc.) si no se usa el cron del hosting.
import { procesarNotificaciones } from "../src/lib/notificaciones";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Revisando vencimientos y enviando notificaciones...");
  const resultado = await procesarNotificaciones();
  console.log(JSON.stringify(resultado, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
