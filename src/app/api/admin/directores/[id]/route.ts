import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const body = await req.json();
  const director = await prisma.directorEscuela.update({
    where: { id: params.id },
    data: {
      escuelaId: body.escuelaId,
      carreraNombre: body.carreraNombre,
      personaNombre: body.personaNombre,
      personaEmail: body.personaEmail?.trim().toLowerCase(),
      jefaturaEmail: body.jefaturaEmail || null,
      activo: body.activo,
    },
  });
  return NextResponse.json(director);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  await prisma.directorEscuela.update({ where: { id: params.id }, data: { activo: false } });
  return NextResponse.json({ ok: true });
}
