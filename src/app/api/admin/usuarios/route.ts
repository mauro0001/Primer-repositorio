import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const usuarios = await prisma.usuario.findMany({
    orderBy: { email: "asc" },
    select: { id: true, email: true, nombre: true, rol: true, activo: true, creadoEn: true },
  });
  return NextResponse.json(usuarios);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const body = await req.json();
  const dominio = (process.env.DOMINIO_PERMITIDO || "duoc.cl").toLowerCase();
  const email = (body.email || "").trim().toLowerCase();

  if (!email.endsWith(`@${dominio}`)) {
    return NextResponse.json({ error: `El correo debe ser del dominio @${dominio}` }, { status: 400 });
  }
  if (!body.nombre || !body.password || body.password.length < 8) {
    return NextResponse.json({ error: "Nombre y contrasena (minimo 8 caracteres) son obligatorios" }, { status: 400 });
  }

  try {
    const usuario = await prisma.usuario.create({
      data: {
        email,
        nombre: body.nombre,
        rol: body.rol === "ADMIN" ? "ADMIN" : "RESPONSABLE",
        passwordHash: await bcrypt.hash(body.password, 10),
      },
      select: { id: true, email: true, nombre: true, rol: true, activo: true },
    });
    return NextResponse.json(usuario, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "Ya existe un usuario con ese correo" }, { status: 409 });
    throw e;
  }
}
