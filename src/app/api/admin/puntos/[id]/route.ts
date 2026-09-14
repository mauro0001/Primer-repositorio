import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const body = await req.json();
  const punto = await prisma.puntoControl.update({
    where: { id: params.id },
    data: {
      nombre: body.nombre,
      macroproceso: body.macroproceso,
      tipoFormulario: body.tipoFormulario,
      periodicidad: body.periodicidad,
      evidenciaRequerida: body.evidenciaRequerida,
      tipoResponsable: body.tipoFormulario === "B" ? "DIRECTOR_ESCUELA" : "CARGO_INSTITUCIONAL",
      cargoInstitucionalId: body.tipoFormulario === "B" ? null : body.cargoInstitucionalId || null,
      activo: body.activo,
    },
  });
  return NextResponse.json(punto);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  await prisma.puntoControl.update({ where: { id: params.id }, data: { activo: false } });
  return NextResponse.json({ ok: true });
}
