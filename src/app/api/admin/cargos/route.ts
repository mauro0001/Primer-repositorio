import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const cargos = await prisma.cargoInstitucional.findMany({ orderBy: { codigo: "asc" } });
  return NextResponse.json(cargos);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const body = await req.json();
  if (!body.codigo || !body.nombreCargo || !body.personaNombre || !body.personaEmail) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }
  try {
    const cargo = await prisma.cargoInstitucional.create({
      data: {
        codigo: body.codigo,
        nombreCargo: body.nombreCargo,
        personaNombre: body.personaNombre,
        personaEmail: body.personaEmail.trim().toLowerCase(),
        jefaturaEmail: body.jefaturaEmail || null,
      },
    });
    return NextResponse.json(cargo, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "Ya existe un cargo con ese codigo" }, { status: 409 });
    throw e;
  }
}
