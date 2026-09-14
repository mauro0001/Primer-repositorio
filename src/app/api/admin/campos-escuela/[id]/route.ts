import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const body = await req.json();
  const campo = await prisma.campoRequeridoEscuela.update({
    where: { id: params.id },
    data: {
      nombreCampo: body.nombreCampo,
      tipoCampo: body.tipoCampo,
      opcionesLista: body.tipoCampo === "LISTA" ? body.opcionesLista : null,
      orden: body.orden ?? 0,
      obligatorio: body.obligatorio ?? true,
    },
  });
  return NextResponse.json(campo);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  await prisma.campoRequeridoEscuela.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
