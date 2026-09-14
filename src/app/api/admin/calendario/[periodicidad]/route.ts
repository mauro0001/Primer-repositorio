import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";
import { limpiarCacheConfigCalendario } from "@/lib/estado";

export async function PUT(req: NextRequest, { params }: { params: { periodicidad: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const body = await req.json();
  const config = await prisma.configuracionCalendario.update({
    where: { periodicidad: params.periodicidad as any },
    data: {
      mesesVencimiento: body.mesesVencimiento,
      diaVencimiento: Number(body.diaVencimiento),
      diasRecordatorioAntes: Number(body.diasRecordatorioAntes),
      diasEscalamientoDespues: Number(body.diasEscalamientoDespues),
      recordatorioActivo: !!body.recordatorioActivo,
    },
  });
  limpiarCacheConfigCalendario();
  return NextResponse.json(config);
}
