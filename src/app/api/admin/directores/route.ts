import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const directores = await prisma.directorEscuela.findMany({
    include: { escuela: true },
    orderBy: [{ escuela: { orden: "asc" } }, { personaNombre: "asc" }],
  });
  return NextResponse.json(directores);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const body = await req.json();
  if (!body.escuelaId || !body.carreraNombre || !body.personaNombre || !body.personaEmail) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }
  const director = await prisma.directorEscuela.create({
    data: {
      escuelaId: body.escuelaId,
      carreraNombre: body.carreraNombre,
      personaNombre: body.personaNombre,
      personaEmail: body.personaEmail.trim().toLowerCase(),
      jefaturaEmail: body.jefaturaEmail || null,
    },
  });
  return NextResponse.json(director, { status: 201 });
}
