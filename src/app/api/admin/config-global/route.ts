import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const body = await req.json();
  const global = await prisma.configuracionGlobal.upsert({
    where: { id: "global" },
    update: {
      emailEscalamientoDefault: body.emailEscalamientoDefault,
      nombreInstitucion: body.nombreInstitucion,
    },
    create: {
      id: "global",
      emailEscalamientoDefault: body.emailEscalamientoDefault,
      nombreInstitucion: body.nombreInstitucion,
    },
  });
  return NextResponse.json(global);
}
