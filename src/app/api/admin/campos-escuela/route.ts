import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const campos = await prisma.campoRequeridoEscuela.findMany({
    include: { escuela: true, puntoControl: true },
    orderBy: [{ escuela: { orden: "asc" } }, { puntoControl: { codigo: "asc" } }, { orden: "asc" }],
  });
  return NextResponse.json(campos);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const body = await req.json();
  if (!body.escuelaId || !body.puntoControlId || !body.nombreCampo || !body.tipoCampo) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }
  try {
    const campo = await prisma.campoRequeridoEscuela.create({
      data: {
        escuelaId: body.escuelaId,
        puntoControlId: body.puntoControlId,
        nombreCampo: body.nombreCampo,
        tipoCampo: body.tipoCampo,
        opcionesLista: body.tipoCampo === "LISTA" ? body.opcionesLista : null,
        orden: body.orden ?? 0,
        obligatorio: body.obligatorio ?? true,
      },
    });
    return NextResponse.json(campo, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002")
      return NextResponse.json({ error: "Ya existe un campo con ese nombre para esa escuela y punto" }, { status: 409 });
    throw e;
  }
}
