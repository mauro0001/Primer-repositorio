import Link from "next/link";
import { calcularEstadosGlobal } from "@/lib/estado";
import { BadgeEstado } from "@/components/BadgeEstado";
import { ETIQUETAS_ESTADO, type EstadoSemaforo } from "@/lib/calendario";

const ORDEN_ESTADO: EstadoSemaforo[] = ["ESCALADO", "VENCIDO", "PROXIMO", "AL_DIA", "SIN_VENCIMIENTO"];

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: { estado?: string; texto?: string };
}) {
  const filas = await calcularEstadosGlobal();

  const conteos = Object.fromEntries(ORDEN_ESTADO.map((e) => [e, 0])) as Record<EstadoSemaforo, number>;
  for (const f of filas) conteos[f.estado]++;

  let filtradas = filas;
  if (searchParams.estado) filtradas = filtradas.filter((f) => f.estado === searchParams.estado);
  if (searchParams.texto) {
    const t = searchParams.texto.toLowerCase();
    filtradas = filtradas.filter(
      (f) =>
        f.codigo.toLowerCase().includes(t) ||
        f.nombre.toLowerCase().includes(t) ||
        f.responsableNombre.toLowerCase().includes(t) ||
        f.responsableEmail.toLowerCase().includes(t)
    );
  }

  filtradas = [...filtradas].sort((a, b) => ORDEN_ESTADO.indexOf(a.estado) - ORDEN_ESTADO.indexOf(b.estado));

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-slate-800">Estado general de cumplimiento</h1>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {ORDEN_ESTADO.map((estado) => (
          <Link
            key={estado}
            href={`/admin?estado=${estado}`}
            className={`card text-center ${searchParams.estado === estado ? "ring-2 ring-duoc" : ""}`}
          >
            <div className="text-2xl font-bold text-slate-800">{conteos[estado]}</div>
            <div className="text-xs text-slate-500">{ETIQUETAS_ESTADO[estado]}</div>
          </Link>
        ))}
      </div>

      <form className="flex flex-wrap gap-2 items-end" action="/admin">
        <div>
          <label className="label">Buscar</label>
          <input className="input" name="texto" defaultValue={searchParams.texto} placeholder="codigo, punto, persona..." />
        </div>
        {searchParams.estado && <input type="hidden" name="estado" value={searchParams.estado} />}
        <button className="btn-secondary" type="submit">
          Buscar
        </button>
        {(searchParams.estado || searchParams.texto) && (
          <Link href="/admin" className="btn-secondary">
            Limpiar filtros
          </Link>
        )}
      </form>

      <div className="overflow-x-auto card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="py-2 pr-2">Codigo</th>
              <th className="py-2 pr-2">Punto</th>
              <th className="py-2 pr-2">Responsable</th>
              <th className="py-2 pr-2">Escuela</th>
              <th className="py-2 pr-2">Vence</th>
              <th className="py-2 pr-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((f, i) => (
              <tr key={`${f.puntoControlId}-${f.responsableEmail}-${i}`} className="border-b last:border-0">
                <td className="py-2 pr-2 font-mono">{f.codigo}</td>
                <td className="py-2 pr-2">{f.nombre}</td>
                <td className="py-2 pr-2">
                  {f.responsableNombre}
                  <div className="text-xs text-slate-400">{f.responsableEmail}</div>
                </td>
                <td className="py-2 pr-2">{f.escuelaNombre || "-"}</td>
                <td className="py-2 pr-2">
                  {f.vencimientoActual ? new Date(f.vencimientoActual).toLocaleDateString("es-CL") : "-"}
                </td>
                <td className="py-2 pr-2">
                  <BadgeEstado estado={f.estado} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtradas.length === 0 && <p className="text-sm text-slate-500 py-4">No hay resultados.</p>}
      </div>
    </div>
  );
}
