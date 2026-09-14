import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const body = await req.json();
  const proveedor = await prisma.proveedorContrato.update({
    where: { id: params.id },
    data: {
      nombreProveedor: body.nombreProveedor,
      numeroContrato: body.numeroContrato,
      vigenciaInicio: body.vigenciaInicio ? new Date(body.vigenciaInicio) : null,
      vigenciaFin: body.vigenciaFin ? new Date(body.vigenciaFin) : null,
      activo: body.activo,
    },
  });
  return NextResponse.json(proveedor);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  await prisma.proveedorContrato.update({ where: { id: params.id }, data: { activo: false } });
  return NextResponse.json({ ok: true });
}
