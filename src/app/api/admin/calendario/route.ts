import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const configs = await prisma.configuracionCalendario.findMany();
  const global = await prisma.configuracionGlobal.upsert({
    where: { id: "global" },
    update: {},
    create: { id: "global" },
  });
  return NextResponse.json({ configs, global });
}
