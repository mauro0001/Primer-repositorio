import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const body = await req.json();

  const data: any = {
    nombre: body.nombre,
    rol: body.rol === "ADMIN" ? "ADMIN" : "RESPONSABLE",
    activo: body.activo,
  };
  if (body.password) {
    if (body.password.length < 8) {
      return NextResponse.json({ error: "La contrasena debe tener al menos 8 caracteres" }, { status: 400 });
    }
    data.passwordHash = await bcrypt.hash(body.password, 10);
  }

  const usuario = await prisma.usuario.update({
    where: { id: params.id },
    data,
    select: { id: true, email: true, nombre: true, rol: true, activo: true },
  });
  return NextResponse.json(usuario);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  await prisma.usuario.update({ where: { id: params.id }, data: { activo: false } });
  return NextResponse.json({ ok: true });
}
