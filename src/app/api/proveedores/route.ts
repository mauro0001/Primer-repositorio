import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const proveedores = await prisma.proveedorContrato.findMany({
    where: { activo: true },
    orderBy: { nombreProveedor: "asc" },
  });
  return NextResponse.json(proveedores);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  if (!body.nombreProveedor || !body.numeroContrato) {
    return NextResponse.json({ error: "Nombre de proveedor y N° de contrato son obligatorios" }, { status: 400 });
  }

  const proveedor = await prisma.proveedorContrato.create({
    data: {
      nombreProveedor: body.nombreProveedor,
      numeroContrato: body.numeroContrato,
      vigenciaInicio: body.vigenciaInicio ? new Date(body.vigenciaInicio) : null,
      vigenciaFin: body.vigenciaFin ? new Date(body.vigenciaFin) : null,
    },
  });
  return NextResponse.json(proveedor, { status: 201 });
}
