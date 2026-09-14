import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const puntos = await prisma.puntoControl.findMany({
    include: { cargoInstitucional: true },
    orderBy: { codigo: "asc" },
  });
  return NextResponse.json(puntos);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const body = await req.json();
  if (!body.codigo || !body.nombre || !body.macroproceso || !body.tipoFormulario || !body.periodicidad) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }
  try {
    const punto = await prisma.puntoControl.create({
      data: {
        codigo: body.codigo,
        nombre: body.nombre,
        macroproceso: body.macroproceso,
        tipoFormulario: body.tipoFormulario,
        periodicidad: body.periodicidad,
        evidenciaRequerida: body.evidenciaRequerida || "",
        tipoResponsable: body.tipoFormulario === "B" ? "DIRECTOR_ESCUELA" : "CARGO_INSTITUCIONAL",
        cargoInstitucionalId: body.tipoFormulario === "B" ? null : body.cargoInstitucionalId || null,
      },
    });
    return NextResponse.json(punto, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "Ya existe un punto con ese codigo" }, { status: 409 });
    throw e;
  }
}
