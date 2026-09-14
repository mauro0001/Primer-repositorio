import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcularProximaFecha } from "@/lib/calendario";
import { getPuntosAsignados } from "@/lib/permisos";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { puntoControlId } = body;
  if (!puntoControlId) return NextResponse.json({ error: "Falta puntoControlId" }, { status: 400 });

  const punto = await prisma.puntoControl.findUnique({ where: { id: puntoControlId } });
  if (!punto || !punto.activo) return NextResponse.json({ error: "Punto de control no encontrado" }, { status: 404 });

  // Verifica que el punto realmente le corresponda a este usuario (no puede reportar
  // puntos de otro cargo/escuela), comparando contra lo que devuelve getPuntosAsignados.
  const asignados = await getPuntosAsignados(session.user.email!);
  const coincidencia = asignados.find((a) => {
    if (a.puntoControlId !== puntoControlId) return false;
    if (punto.tipoResponsable === "CARGO_INSTITUCIONAL") return a.cargoInstitucionalId === body.cargoInstitucionalId;
    return a.directorEscuelaId === body.directorEscuelaId;
  });
  if (!coincidencia) {
    return NextResponse.json({ error: "Este punto de control no te corresponde" }, { status: 403 });
  }

  if (!body.fechaVerificacion) {
    return NextResponse.json({ error: "Falta la fecha de verificacion" }, { status: 400 });
  }
  const fechaVerificacion = new Date(body.fechaVerificacion);

  const config = await prisma.configuracionCalendario.findUnique({ where: { periodicidad: punto.periodicidad } });
  const proximaCalculada = calcularProximaFecha(punto.periodicidad, config, fechaVerificacion);

  const data: any = {
    puntoControlId,
    usuarioId: session.user.id,
    fechaVerificacion,
    proximaFecha: punto.tipoFormulario === "C" && body.proximaFecha ? new Date(body.proximaFecha) : proximaCalculada,
    evidenciaUrl: body.evidenciaUrl || null,
    evidenciaNombre: body.evidenciaNombre || null,
  };

  if (punto.tipoFormulario === "A" || punto.tipoFormulario === "C") {
    if (!body.cumple) return NextResponse.json({ error: "Falta indicar si cumple" }, { status: 400 });
    data.cargoInstitucionalId = body.cargoInstitucionalId;
    data.cumple = body.cumple;
    data.observacion = body.observacion || null;
  }

  if (punto.tipoFormulario === "C") {
    if (!body.proveedorContratoId) {
      return NextResponse.json({ error: "Falta seleccionar el proveedor/contrato" }, { status: 400 });
    }
    data.proveedorContratoId = body.proveedorContratoId;
  }

  if (punto.tipoFormulario === "B") {
    if (!body.escuelaId || !body.directorEscuelaId) {
      return NextResponse.json({ error: "Falta la escuela" }, { status: 400 });
    }
    data.escuelaId = body.escuelaId;
    data.directorEscuelaId = body.directorEscuelaId;
    data.carrera = body.carrera || null;
    data.docenteResponsable = body.docenteResponsable || null;

    const camposDefinidos = await prisma.campoRequeridoEscuela.findMany({
      where: { puntoControlId, escuelaId: body.escuelaId },
    });
    const respuestas: Array<{ campoId: string; nombreCampo: string; valor: string }> = body.respuestasDinamicas || [];

    for (const campo of camposDefinidos) {
      if (!campo.obligatorio) continue;
      const respuesta = respuestas.find((r) => r.campoId === campo.id);
      if (!respuesta || respuesta.valor === "" || respuesta.valor === undefined || respuesta.valor === null) {
        return NextResponse.json({ error: `Falta completar el campo obligatorio "${campo.nombreCampo}"` }, { status: 400 });
      }
    }
    data.respuestasDinamicas = JSON.stringify(respuestas);
  }

  const registro = await prisma.registroCumplimiento.create({ data });
  return NextResponse.json(registro, { status: 201 });
}
