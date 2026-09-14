import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getPuntosAsignados } from "@/lib/permisos";
import { calcularEstadosPuntos } from "@/lib/estado";
import { BadgeEstado } from "@/components/BadgeEstado";

const ORDEN_ESTADO = ["ESCALADO", "VENCIDO", "PROXIMO", "AL_DIA", "SIN_VENCIMIENTO"];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const email = session!.user.email!;

  const puntos = await getPuntosAsignados(email);
  const puntosConEstado = await calcularEstadosPuntos(puntos);

  puntosConEstado.sort((a, b) => ORDEN_ESTADO.indexOf(a.estado) - ORDEN_ESTADO.indexOf(b.estado));

  if (puntos.length === 0) {
    return (
      <div className="card">
        <p className="text-slate-600">
          No tienes puntos de control asignados todavia. Si crees que esto es un error, contacta al
          administrador para que verifique tu correo en Cargos Institucionales o Directores de Escuela.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-slate-800">Mis puntos de control</h1>
      <div className="grid gap-3">
        {puntosConEstado.map((p, i) => {
          const qs = new URLSearchParams();
          if (p.cargoInstitucionalId) qs.set("cargoId", p.cargoInstitucionalId);
          if (p.directorEscuelaId) qs.set("directorId", p.directorEscuelaId);
          return (
          <Link
            key={`${p.puntoControlId}-${p.directorEscuelaId ?? "cargo"}-${i}`}
            href={`/puntos/${p.puntoControlId}/registrar?${qs.toString()}`}
            className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:border-duoc-light transition-colors"
          >
            <div>
              <div className="text-sm text-slate-500">
                {p.codigo} · {p.macroproceso} · Tipo {p.tipoFormulario}
                {p.escuelaNombre ? ` · ${p.escuelaNombre}` : ""}
              </div>
              <div className="font-medium text-slate-800">{p.nombre}</div>
              <div className="text-xs text-slate-400">
                Periodicidad: {p.periodicidad.toLowerCase()}
                {p.vencimientoActual
                  ? ` · Vence: ${new Date(p.vencimientoActual).toLocaleDateString("es-CL")}`
                  : ""}
              </div>
            </div>
            <BadgeEstado estado={p.estado} />
          </Link>
          );
        })}
      </div>
    </div>
  );
}
