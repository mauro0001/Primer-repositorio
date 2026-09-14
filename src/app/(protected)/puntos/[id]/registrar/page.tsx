import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getResponsabilidadesDeUsuario } from "@/lib/permisos";
import { RegistrarForm } from "./RegistrarForm";

export default async function RegistrarPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { cargoId?: string; escuelaId?: string; directorId?: string };
}) {
  const session = await getServerSession(authOptions);
  const punto = await prisma.puntoControl.findUnique({ where: { id: params.id } });
  if (!punto || !punto.activo) notFound();

  const { cargos, direcciones } = await getResponsabilidadesDeUsuario(session!.user.email!);

  const proveedores =
    punto.tipoFormulario === "C"
      ? await prisma.proveedorContrato.findMany({ where: { activo: true }, orderBy: { nombreProveedor: "asc" } })
      : [];

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div>
        <div className="text-sm text-slate-500">
          {punto.codigo} · {punto.macroproceso}
        </div>
        <h1 className="text-lg font-bold text-slate-800">{punto.nombre}</h1>
        <p className="text-sm text-slate-500 mt-1">Evidencia requerida: {punto.evidenciaRequerida}</p>
      </div>

      <RegistrarForm
        punto={{
          id: punto.id,
          tipoFormulario: punto.tipoFormulario as "A" | "B" | "C",
          periodicidad: punto.periodicidad,
        }}
        cargos={cargos.map((c) => ({ id: c.id, nombreCargo: c.nombreCargo }))}
        direcciones={direcciones.map((d) => ({
          id: d.id,
          escuelaId: d.escuelaId,
          escuelaNombre: d.escuela.nombre,
          carreraNombre: d.carreraNombre,
        }))}
        proveedores={proveedores.map((p) => ({ id: p.id, nombreProveedor: p.nombreProveedor, numeroContrato: p.numeroContrato }))}
        cargoIdPreseleccionado={searchParams.cargoId}
        directorIdPreseleccionado={searchParams.directorId}
      />
    </div>
  );
}
