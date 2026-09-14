import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function RegistrosPage() {
  const session = await getServerSession(authOptions);

  const registros = await prisma.registroCumplimiento.findMany({
    where: { usuarioId: session!.user.id },
    include: { puntoControl: true, escuela: true },
    orderBy: { creadoEn: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-slate-800">Mi historial de envios</h1>
      {registros.length === 0 && <p className="text-slate-500">Aun no has enviado ningun registro.</p>}
      <div className="grid gap-3">
        {registros.map((r) => (
          <div key={r.id} className="card">
            <div className="text-sm text-slate-500">
              {r.puntoControl.codigo} {r.escuela ? `· ${r.escuela.nombre}` : ""}
            </div>
            <div className="font-medium text-slate-800">{r.puntoControl.nombre}</div>
            <div className="text-xs text-slate-400 mt-1">
              Enviado: {r.creadoEn.toLocaleString("es-CL")} · Fecha de verificacion:{" "}
              {r.fechaVerificacion.toLocaleDateString("es-CL")}
              {r.cumple ? ` · Cumple: ${r.cumple}` : ""}
            </div>
            {r.evidenciaUrl && (
              <a
                href={r.evidenciaUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-duoc underline mt-1 inline-block"
              >
                Ver evidencia adjunta
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
